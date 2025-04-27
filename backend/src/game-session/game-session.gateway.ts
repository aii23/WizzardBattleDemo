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
import {
  TransformedUserTurn,
  TransformedUserTurnV2,
} from "../types/matchmaking.types";
import { plainToClass } from "class-transformer";

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

  /*
  @SubscribeMessage("submitTurn")
  handleTurn(client: Socket, payload: { sessionId: string; turnData: any }) {
    const { sessionId, turnData } = payload;

    // Transform the incoming turn data
    const transformedTurn = plainToClass(TransformedUserTurn, turnData);

    // Validate that the client is part of this session
    const session = this.gameSessionService.getSessionBySocketId(client.id);
    if (!session || session.id !== sessionId) {
      return { success: false, error: "Invalid session" };
    }

    const success = this.gameSessionService.handleTurn(
      sessionId,
      client.id,
      transformedTurn
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
  */

  // Client side state managment
  @SubscribeMessage("SendActions")
  sendActions(client: Socket, payload: { sessionId: string; turnData: any }) {
    const { sessionId, turnData } = payload;

    console.log(turnData);

    // Transform the incoming turn data
    const transformedTurn = plainToClass(TransformedUserTurnV2, turnData);

    console.log(transformedTurn);

    // Add the action to the actions map
    this.gameSessionService.addActions(sessionId, client.id, transformedTurn);
  }

  @SubscribeMessage("updatePublicState")
  updatePublicState(
    client: Socket,
    payload: { sessionId: string; state: any }
  ) {
    const { sessionId, state } = payload;

    this.gameSessionService.updatePublicState(sessionId, client.id, state);
  }
}
