import { Service } from "typedi";

import { FindManyApiResponse } from "../../../common/interfaces";
import { DynamicConfig, DynamicConfigService } from "../../../core/config/dynamic";
import { WebSocket } from "../../../lib/interfaces";
import { PlayerService } from "../../player/app/player.service";
import { CreateGameRequest, GameResponse, GameStatePayload } from "../dto";
import { GameConnections } from "../infra/game.connections";
import { GameRepository } from "../infra/game.repository";
import { GameRuntime } from "../infra/game.runtime";
import { DamageOverTimeService } from "./dot.service";

@Service()
export class GameService {
  constructor(
    private readonly repo: GameRepository,
    private readonly connections: GameConnections,
    private readonly runtime: GameRuntime,
    private readonly dot: DamageOverTimeService,
    private readonly dynamicConfig: DynamicConfigService,
    private readonly playerService: PlayerService,
  ) {}

  public async create(
    payload: CreateGameRequest,
  ): Promise<GameResponse> {
    return this.repo.create({
      isDotEnabled: payload.isDotEnabled,
    });
  }

  public async findById(
    gameId: number,
  ): Promise<GameResponse | null> {
    return this.repo.findById(gameId);
  }

  public async findMany(): Promise<FindManyApiResponse<GameResponse>> {
    return this.repo.findMany();
  }

  public async start(
    gameId: number,
  ): Promise<GameResponse> {
    const game = await this.repo.changeStatus(gameId, "RUNNING");
    this.connections.setStatus(gameId, "RUNNING");

    this.dot.start(gameId);
    this.runtime.startPolling(gameId);
    this.runtime.setupWatchdog(gameId, async () => {
      try {
        const state = await this.pause(gameId);
        this.connections.getSocket(gameId)?.sendEvent("game:paused", state);
      } catch {}
    });

    return game;
  }

  public async finish(
    gameId: number,
  ): Promise<GameResponse> {
    const game = await this.repo.changeStatus(gameId, "FINISHED");
    this.connections.setStatus(gameId, "FINISHED");

    this.dot.stop(gameId);
    this.runtime.stopPolling(gameId);
    this.runtime.removeWatchdog(gameId);

    return game;
  }

  public async pause(
    gameId: number,
  ): Promise<GameResponse> {
    if (this.connections.getStatus(gameId) !== "RUNNING")
      throw new Error("Game is not running");

    const game = await this.repo.changeStatus(gameId, "WAITING");
    this.connections.setStatus(gameId, "WAITING");

    this.dot.stop(gameId);
    this.runtime.stopPolling(gameId);
    this.runtime.removeWatchdog(gameId);

    return game;
  }

  public async handleGameState(
    socket: WebSocket,
    payload: GameStatePayload,
  ): Promise<void> {
    const gameId = this.connections.getGameId(socket);
    if (!gameId)
      throw new Error("No connection to the game");

    if (this.connections.getStatus(gameId) !== "RUNNING")
      throw new Error("Game is not running");

    const threshold = await this.dynamicConfig.getOrThrow(DynamicConfig.VOLUME_THRESHOLD);

    for (const p of payload.players) {
      if (p.micState >= threshold) {
        try {
          const player = await this.playerService.strike(gameId, p.id);
          socket.sendEvent("player:strike", player);
        } catch {}
      }
    }

    await this.runtime.setupWatchdog(gameId, async () => {
      try {
        const state = await this.pause(gameId);
        this.connections.getSocket(gameId)?.sendEvent("game:paused", state);
      } catch {}
    });
  }
}
