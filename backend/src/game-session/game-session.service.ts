import { Injectable } from "@nestjs/common";
import { Socket } from "socket.io";
import {
  Impact,
  MatchFoundResponse,
  MatchPlayerData,
  SpellEffect,
  UserTurn,
} from "../../../common/types/matchmaking.types";
import { allSpells } from "../../../common/types/spells";
import { allWizards } from "../../../common/wizards";

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

    console.log("GameSessionService createSession", session.id);
    console.log("this.activeSessions", session);
    console.log(
      "this.socketToSession",
      session.playersData.map((data) => data.playerPosition)
    );

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

  private processTurns(sessionId: string, turns: UserTurn[]): Impact[] {
    const session = this.getSession(sessionId);
    if (!session) return;

    const impacts = [];

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
        const spell = allSpells.find((s) => s.id === spellCastInfo.spellId);
        if (!spell) {
          console.error("Spell not found", spellCastInfo.spellId);
          continue;
        }

        const targetPlayer = session.playersData.find(
          (data) => data.playerId === spellCastInfo.targetId
        );
        if (!targetPlayer) {
          console.error("Target player not found", spellCastInfo.targetId);
          continue;
        }

        console.log("spellCastInfo", spellCastInfo);
        console.log("targetPlayer", targetPlayer);

        if (spell.effectType === SpellEffect.ENEMY_EFFECT) {
          impacts.push({
            playerId: spellCastInfo.targetId,
            position: spellCastInfo.targetPosition,
            spellId: spellCastInfo.spellId,
          });
        }

        const effectResult = spell.effect(
          spellCastInfo.targetPosition,
          targetPlayer
        );

        session.playersData = session.playersData.map((data) => {
          if (data.playerId === spellCastInfo.targetId) {
            return effectResult;
          }
          return data;
        });

        console.log(spellCastInfo);
      }
    }

    return impacts;
  }

  private startNextRound(sessionId: string): void {
    console.log("startNextRound", sessionId);
    const session = this.getSession(sessionId);
    if (!session) return;

    const sessionRounds = this.turns.get(sessionId)!;

    // Process turns
    const roundTurns = sessionRounds.get(session.currentRound)!;

    console.log("this.processTurns(sessionId, roundTurns);", roundTurns);
    const impacts = this.processTurns(sessionId, roundTurns);

    session.currentRound++;

    sessionRounds.set(session.currentRound, []);

    let alivePlayers = session.playersData.filter((data) => data.health > 0);

    if (alivePlayers.length <= 1) {
      session.players.forEach((player) => {
        player.emit("gameOver", {
          sessionId,
          winners: alivePlayers.map((data) => data.playerId),
        });
      });

      return;
    }

    session.players.forEach((player) => {
      player.emit("nextRound", {
        sessionId,
        currentRound: session.currentRound,
        state: this.getStateForPlayer(sessionId, player.id),
        impacts,
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
    const wizard = allWizards.find((w) => w.id === data.wizardId);

    const publicFields = wizard?.publicFields || [];

    const publicState = {
      playerId: data.playerId,
      wizardId: data.wizardId,
      mapStructure: data.mapStructure,
      health: data.health,
    };

    publicFields.forEach((field) => {
      publicState[field] = data[field];
    });

    return publicState;
  }

  getPrivateStateForPlayer(data: MatchPlayerData): MatchPlayerData {
    return {
      playerId: data.playerId,
      wizardId: data.wizardId,
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
