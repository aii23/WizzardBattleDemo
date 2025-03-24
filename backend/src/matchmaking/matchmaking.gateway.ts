import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { MatchmakingService } from "./matchmaking.service";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class MatchmakingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private matchmakingService: MatchmakingService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.matchmakingService.removeFromQueue(client);
  }

  @SubscribeMessage("findMatch")
  handleFindMatch(client: Socket) {
    console.log(`Client ${client.id} looking for match`);
    const matchFound = this.matchmakingService.addToQueue(client);

    if (!matchFound) {
      client.emit("waitingForOpponent");
    }
  }
}
