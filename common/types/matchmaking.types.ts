// import { Socket } from "socket.io-client";

import { ActionPack, Stater, UserState } from "../stater";

export enum TileType {
  VALLEY = 0,
  ROCK = 1,
  WATER = 2,
}

export enum SpellEffect {
  FRIENDLY_EFFECT = 0,
  ENEMY_EFFECT = 1,
}

export interface MapStructure {
  matrix: TileType[][];
}

export class Position {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  equals(other: Position): boolean {
    return this.x === other.x && this.y === other.y;
  }

  manhattanDistance(other: Position): number {
    return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
  }
}

export interface Impact {
  playerId: string;
  position: Position;
  spellId: number;
}

export interface Spell {
  id: number;
  name: string;
  description: string;
  image: string;
  effectType: SpellEffect;
  effect2: (state: UserState, castPosition: Position) => void;
}

export interface MatchPlayerData {
  playerId: string;
  health: number;
  wizardId: number;
  spells?: Spell[];
  mapStructure?: MapStructure;
  playerPosition?: Position;
}

export interface QueueEntry {
  socket: any;
  matchData: MatchPlayerData;
}

export interface MatchFoundResponse {
  matchId: string;
  opponent: string;
  state: MatchPlayerData[];
}

export interface NextRoundResponse {
  sessionId: string;
  currentRound: number;
  state: MatchPlayerData[];
  impacts: Impact[];
}

export interface NextRoundResponseV2 {
  sessionId: string;
  currentRound: number;
  state: MatchPlayerData[];
}

export interface SpellCastInfo {
  spellId: number;
  targetId: string;
  targetPosition: Position;
}

export interface MoveInfo {
  to: Position;
}

export interface UserTurn {
  playerId: string;
  spellCastInfo: SpellCastInfo[];
  moveInfo: MoveInfo | null;
}

export interface GameOverResponse {
  sessionId: string;
  winners: string[];
}

export interface SubmittedActionsResponse {
  sessionId: string;
  currentRound: number;
  actions: ActionPack[];
}
