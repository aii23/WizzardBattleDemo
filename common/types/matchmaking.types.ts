import { Socket } from "socket.io";

export enum TileType {
  VALLEY = 0,
  ROCK = 1,
  WATER = 2,
}

export interface MapStructure {
  matrix: TileType[][];
}

export interface Spell {
  id: number;
  name: string;
  description: string;
  image: string;
}

export interface MatchPlayerData {
  playerId: string;
  health: number;
  spells?: Spell[];
  mapStructure?: MapStructure;
  playerPosition?: { x: number; y: number };
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

export interface SpellCastInfo {
  spellId: number;
  target: { x: number; y: number };
}

export interface MoveInfo {
  to: { x: number; y: number };
}

export interface UserTurn {
  playerId: string;
  spellCastInfo: SpellCastInfo[];
  moveInfo: MoveInfo;
}
