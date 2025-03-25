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

export interface MatchData {
  spells: Spell[];
  mapStructure: MapStructure;
}

export interface QueueEntry {
  socket: Socket;
  matchData: MatchData;
}

export interface MatchFoundResponse {
  matchId: string;
  opponent: string;
}
