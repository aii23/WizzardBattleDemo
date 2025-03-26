import { Injectable } from "@nestjs/common";
import { Socket } from "socket.io";
import {
  MatchFoundResponse,
  MatchPlayerData,
} from "../../../common/types/matchmaking.types";

interface GameSession {
  id: string;
  players: Socket[];
  playersData: MatchPlayerData[];
  currentTurn: number;
}

@Injectable()
export class GameSessionService {
  private activeSessions: Map<string, GameSession> = new Map();
  private socketToSession: Map<string, string> = new Map(); // Maps socket ID to session ID

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
      currentTurn: 0,
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

  handleTurn(sessionId: string, playerId: string, turnData: any): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;

    // Validate turn order
    const currentPlayerIndex = session.players.findIndex(
      (p) => p.id === playerId
    );
    if (currentPlayerIndex !== session.currentTurn) return false;

    // Process turn
    // Add your game logic here

    // Update turn order
    session.currentTurn = (session.currentTurn + 1) % 2;
    return true;
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
    };
  }

  getPrivateStateForPlayer(data: MatchPlayerData): MatchPlayerData {
    return {
      playerId: data.playerId,
      spells: data.spells,
      mapStructure: data.mapStructure,
      playerPosition: data.playerPosition,
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
