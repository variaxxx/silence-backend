import { FastifyRequest } from "fastify";
import Joi from "joi";

import { OnConnect, OnEvent, WsHandler } from "../../../lib/decorators";
import { WebSocket } from "../../../lib/interfaces";
import { GameService } from "../app/game.service";
import { GameStatePayload } from "../dto";
import { GameConnections } from "../infra/game.connections";

@WsHandler("game/:gameId")
export class GameWsHandler {
  constructor(
    private readonly service: GameService,
    private readonly connections: GameConnections,
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

    await this.connections.connect(socket, value.gameId);
  }

  @OnEvent("game:start")
  async startGame(
    socket: WebSocket,
  ): Promise<void> {
    const gameId = this.connections.getGameId(socket);
    if (!gameId)
      throw new Error("No connection to the game");

    const state = await this.service.start(gameId);
    socket.sendEvent("game:started", state);
  }

  @OnEvent("game:pause")
  async pauseGame(
    socket: WebSocket,
  ): Promise<void> {
    const gameId = this.connections.getGameId(socket);
    if (!gameId)
      throw new Error("No connection to the game");

    const state = await this.service.pause(gameId);
    socket.sendEvent("game:paused", state);
  }

  @OnEvent("game:finish")
  async finishGame(
    socket: WebSocket,
  ): Promise<void> {
    const gameId = this.connections.getGameId(socket);
    if (!gameId)
      throw new Error("No connection to the game");

    const state = await this.service.finish(gameId);
    socket.sendEvent("game:finished", state);
  }

  @OnEvent("game:state")
  async gameState(
    socket: WebSocket,
    payload: GameStatePayload,
  ): Promise<void> {
    await this.service.handleGameState(socket, payload);
  }
}
