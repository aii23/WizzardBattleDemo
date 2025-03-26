import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { GameSessionService } from "./game-session.service";
import { UserTurn } from "../../../common/types/matchmaking.types";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class GameSessionGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private gameSessionService: GameSessionService) {}

  handleConnection(client: Socket) {
    console.log(`Game client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Game client disconnected: ${client.id}`);
    // The disconnect is now handled in the GameSessionService
  }

  @SubscribeMessage("submitTurn")
  handleTurn(
    client: Socket,
    payload: { sessionId: string; turnData: UserTurn }
  ) {
    const { sessionId, turnData } = payload;

    // Validate that the client is part of this session
    const session = this.gameSessionService.getSessionBySocketId(client.id);
    if (!session || session.id !== sessionId) {
      return { success: false, error: "Invalid session" };
    }

    const success = this.gameSessionService.handleTurn(
      sessionId,
      client.id,
      turnData
    );

    if (success) {
      // TODO: Broadcast the turn to all players in the session
      // const session = this.gameSessionService.getSession(sessionId);
      // if (session) {
      //   // Broadcast the turn to all players in the session
      //   session.players.forEach((player) => {
      //     player.emit("turnUpdate", {
      //       sessionId,
      //       currentTurn: session.currentTurn,
      //       turnData,
      //     });
      //   });
      // }
    }

    return { success };
  }
}
