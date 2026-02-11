import { OnConnect, OnEvent, WsHandler } from "../../common/decorators";
import { WebSocket } from "../../common/interfaces";

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
