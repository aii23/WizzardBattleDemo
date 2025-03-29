import { Socket } from "socket.io";

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

export interface Spell {
  id: number;
  name: string;
  description: string;
  image: string;
  effectType: SpellEffect;
  effect: (castPosition: Position, player: MatchPlayerData) => MatchPlayerData;
}

export interface MatchPlayerData {
  playerId: string;
  health: number;
  spells?: Spell[];
  mapStructure?: MapStructure;
  playerPosition?: Position;
}

export interface QueueEntry {
  socket: Socket;
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
