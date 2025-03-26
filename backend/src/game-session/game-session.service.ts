import { Injectable } from "@nestjs/common";
import { Socket } from "socket.io";
import {
  MatchFoundResponse,
  MatchPlayerData,
  UserTurn,
} from "../../../common/types/matchmaking.types";

interface GameSession {
  id: string;
  players: Socket[];
  playersData: MatchPlayerData[];
  currentRound: number;
}

@Injectable()
export class GameSessionService {
  private activeSessions: Map<string, GameSession> = new Map();
  private socketToSession: Map<string, string> = new Map(); // Maps socket ID to session ID

  // sessionId -> roundId -> turns
  private turns: Map<string, Map<number, UserTurn[]>> = new Map();

  createSession(
    id: string,
    players: Socket[],
    playersData: MatchPlayerData[]
  ): string {
    if (players.length !== playersData.length) {
      throw new Error("Players and playersData must have the same length");
    }

    // TODO: Check player datas id

    const session: GameSession = {
      id: id,
      players: players,
      playersData: playersData,
      currentRound: 0,
    };

    this.activeSessions.set(session.id, session);
    // Map both players' socket IDs to this session
    players.forEach((player) => {
      this.socketToSession.set(player.id, session.id);
    });

    return session.id;
  }

  private setupDisconnectHandlers(socket: Socket, sessionId: string) {
    socket.on("disconnect", () => {
      this.handlePlayerDisconnect(socket.id, sessionId);
    });
  }

  private handlePlayerDisconnect(socketId: string, sessionId: string) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // Remove socket mapping
    this.socketToSession.delete(socketId);

    // Notify the other player about the disconnect
    session.players.forEach((player) => {
      if (player.id !== socketId) {
        player.emit("playerDisconnected", {
          sessionId,
          disconnectedPlayerId: socketId,
        });
      }
    });

    // End the session if both players are disconnected
    const remainingSockets = session.players.filter((p) =>
      this.socketToSession.has(p.id)
    );

    if (remainingSockets.length === 0) {
      this.endSession(sessionId);
    }
  }

  getSession(sessionId: string): GameSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  getSessionBySocketId(socketId: string): GameSession | undefined {
    const sessionId = this.socketToSession.get(socketId);
    return sessionId ? this.getSession(sessionId) : undefined;
  }

  handleTurn(sessionId: string, playerId: string, turnData: UserTurn): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;

    const sessionRounds = this.turns.get(sessionId)!;

    const roundTurns = sessionRounds.get(session.currentRound) || [];

    if (playerId !== turnData.playerId) {
      return false;
    }

    const playerAlreadyCommitted = roundTurns.find(
      (turn) => turn.playerId === playerId
    );
    if (playerAlreadyCommitted) {
      return false;
    }

    roundTurns.push(turnData);

    sessionRounds.set(session.currentRound, roundTurns);

    if (roundTurns.length === session.players.length) {
      this.startNextRound(sessionId);
    }

    // Process turn
    // Add your game logic here

    return true;
  }

  private processTurns(sessionId: string, turns: UserTurn[]): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    // Process movement
    for (const turn of turns) {
      const playerData = session.playersData.find(
        (data) => data.playerId === turn.playerId
      );
      if (!playerData) continue;

      playerData.playerPosition = turn.moveInfo.to;
    }

    // Process spell cast
    for (const turn of turns) {
      for (const spellCastInfo of turn.spellCastInfo) {
        console.log(spellCastInfo);
      }
    }
  }

  private startNextRound(sessionId: string): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    session.currentRound++;

    const sessionRounds = this.turns.get(sessionId)!;

    sessionRounds.set(session.currentRound, []);

    // Process turns
    const roundTurns = sessionRounds.get(session.currentRound)!;

    this.processTurns(sessionId, roundTurns);

    session.players.forEach((player) => {
      player.emit("nextRound", {
        sessionId,
        currentRound: session.currentRound,
      });
    });
  }

  endSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      // Clean up socket mappings
      session.players.forEach((player) => {
        this.socketToSession.delete(player.id);
      });
      this.activeSessions.delete(sessionId);
    }
  }

  getPublicStateForPlayer(data: MatchPlayerData): MatchPlayerData {
    return {
      playerId: data.playerId,
      mapStructure: data.mapStructure,
      health: data.health,
    };
  }

  getPrivateStateForPlayer(data: MatchPlayerData): MatchPlayerData {
    return {
      playerId: data.playerId,
      spells: data.spells,
      mapStructure: data.mapStructure,
      playerPosition: data.playerPosition,
      health: data.health,
    };
  }

  getStateForPlayer(sessionId: string, playerId: string): MatchPlayerData[] {
    const session = this.getSession(sessionId);
    if (!session) return [];

    let state = session.playersData.map((data) => {
      if (data.playerId === playerId) {
        return this.getPrivateStateForPlayer(data);
      }

      return this.getPublicStateForPlayer(data);
    });

    return state;
  }
}
