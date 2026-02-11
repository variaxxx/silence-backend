import { OnConnect, OnEvent, WsHandler } from "../../lib/decorators";
import { WebSocket } from "../../lib/interfaces";

@WsHandler("game")
export class GameWsHandler {
  @OnConnect()
  async onConnect(
    socket: WebSocket,
  ): Promise<void> {

  }

  @OnEvent("ping")
  pingPong(
    socket: WebSocket,
  ): void {
    socket.sendEvent("pong");
  }
}
