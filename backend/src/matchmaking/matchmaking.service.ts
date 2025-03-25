import { Injectable } from "@nestjs/common";
import { Socket } from "socket.io";
import {
  MatchData,
  QueueEntry,
  MatchFoundResponse,
} from "../../../common/types/matchmaking.types";

@Injectable()
export class MatchmakingService {
  private queue: QueueEntry[] = [];

  addToQueue(socket: Socket, matchData: MatchData): boolean {
    if (this.queue.length > 0) {
      const opponent = this.queue.shift();
      if (opponent) {
        this.notifyMatch(
          socket,
          opponent.socket,
          matchData,
          opponent.matchData
        );
        return true;
      }
    }
    this.queue.push({ socket, matchData });
    return false;
  }

  removeFromQueue(socket: Socket): void {
    const index = this.queue.findIndex((entry) => entry.socket === socket);
    if (index > -1) {
      this.queue.splice(index, 1);
    }
  }

  private notifyMatch(
    player1: Socket,
    player2: Socket,
    player1Data: MatchData,
    player2Data: MatchData
  ): void {
    const matchId = Math.random().toString(36).substring(7);
    const player1Response: MatchFoundResponse = {
      matchId,
      opponent: player2.id,
    };
    const player2Response: MatchFoundResponse = {
      matchId,
      opponent: player1.id,
    };

    player1.emit("matchFound", player1Response);
    player2.emit("matchFound", player2Response);
  }
}
