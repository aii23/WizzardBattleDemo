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

    this.turns.set(session.id, new Map());

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
    console.log("handleTurn", sessionId, playerId, turnData);
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
      console.log("turn", turn);
      const playerData = session.playersData.find(
        (data) => data.playerId === turn.playerId
      );
      if (!playerData) continue;

      if (turn.moveInfo) {
        playerData.playerPosition = turn.moveInfo.to;
        console.log("playerData after move", playerData);
      }
    }

    // Process spell cast
    for (const turn of turns) {
      for (const spellCastInfo of turn.spellCastInfo) {
        console.log(spellCastInfo);
      }
    }
  }

  private startNextRound(sessionId: string): void {
    console.log("startNextRound", sessionId);
    const session = this.getSession(sessionId);
    if (!session) return;

    const sessionRounds = this.turns.get(sessionId)!;

    // Process turns
    const roundTurns = sessionRounds.get(session.currentRound)!;

    console.log("this.processTurns(sessionId, roundTurns);", roundTurns);
    this.processTurns(sessionId, roundTurns);

    session.currentRound++;

    sessionRounds.set(session.currentRound, []);

    session.players.forEach((player) => {
      player.emit("nextRound", {
        sessionId,
        currentRound: session.currentRound,
        state: this.getStateForPlayer(sessionId, player.id),
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
