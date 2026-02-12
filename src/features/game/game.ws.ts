import { FastifyRequest } from "fastify";
import Joi from "joi";

import { OnConnect, OnEvent, WsHandler } from "../../lib/decorators";
import { WebSocket } from "../../lib/interfaces";
import { GameStatePayload } from "./dto";
import { GameService } from "./game.service";

@WsHandler("game/:gameId")
export class GameWsHandler {
  constructor(
    private readonly service: GameService,
  ) {}

  @OnConnect()
  async onConnect(
    socket: WebSocket,
    req: FastifyRequest,
  ): Promise<void> {
    const schema = Joi.object({
      gameId: Joi.number().positive().required(),
    }).required();
    const { value, error } = schema.validate(req.params);

    if (error)
      return socket.close(1008);

    await this.service.handleConnection(socket, value.gameId);
  }

  @OnEvent("game:start")
  async startGame(
    socket: WebSocket,
  ): Promise<void> {
    const gameId = this.service.getGameIdByWs(socket);
    if (!gameId)
      return void socket.sendEvent("error", "No connection to the game");
    await this.service.start(gameId);
    socket.sendEvent("game:started");
  }

  @OnEvent("game:pause")
  async pauseGame(
    socket: WebSocket,
  ): Promise<void> {
    const gameId = this.service.getGameIdByWs(socket);
    if (!gameId)
      return void socket.sendEvent("error", "No connection to the game");
    await this.service.pause(gameId);
    socket.sendEvent("game:paused");
  }

  @OnEvent("game:finish")
  async finishGame(
    socket: WebSocket,
  ): Promise<void> {
    const gameId = this.service.getGameIdByWs(socket);
    if (!gameId)
      return void socket.sendEvent("error", "No connection to the game");
    await this.service.finish(gameId);
    socket.sendEvent("game:finished");
  }

  @OnEvent("game:state")
  async gameState(
    socket: WebSocket,
    payload: GameStatePayload,
  ): Promise<void> {
    await this.service.handleGameState(socket, payload);
  }
}
