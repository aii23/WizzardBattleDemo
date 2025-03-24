import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class MatchmakingService {
  private queue: Socket[] = [];

  addToQueue(socket: Socket): boolean {
    if (this.queue.length > 0) {
      const opponent = this.queue.shift();
      if (opponent) {
        this.notifyMatch(socket, opponent);
        return true;
      }
    }
    this.queue.push(socket);
    return false;
  }

  removeFromQueue(socket: Socket): void {
    const index = this.queue.indexOf(socket);
    if (index > -1) {
      this.queue.splice(index, 1);
    }
  }

  private notifyMatch(player1: Socket, player2: Socket): void {
    const matchId = Math.random().toString(36).substring(7);
    player1.emit('matchFound', { matchId, opponent: player2.id });
    player2.emit('matchFound', { matchId, opponent: player1.id });
  }
} 