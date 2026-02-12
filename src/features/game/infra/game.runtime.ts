import { Service } from "typedi";

import { DynamicConfig, DynamicConfigService } from "../../../core/config/dynamic";
import { Logger } from "../../../core/logger";
import { GameConnections } from "./game.connections";
import { GameRepository } from "./game.repository";

@Service()
export class GameRuntime {
  private readonly gameIdToInterval = new Map<number, NodeJS.Timeout>();
  private readonly gameIdToWatchdog = new Map<number, NodeJS.Timeout>();

  constructor(
    private readonly dynamicConfig: DynamicConfigService,
    private readonly connections: GameConnections,
    private readonly repo: GameRepository,
    private readonly logger: Logger,
  ) {}

  public async setupWatchdog(
    gameId: number,
    onTimeout: () => Promise<void>,
  ): Promise<void> {
    const existingWatchdog = this.gameIdToWatchdog.get(gameId);
    if (existingWatchdog)
      clearTimeout(existingWatchdog);

    const timeoutMs = await this.dynamicConfig.getOrThrow(DynamicConfig.GAME_DEATH_TIMEOUT);
    const newWatchdog = setTimeout(onTimeout, timeoutMs);

    this.gameIdToWatchdog.set(gameId, newWatchdog);
  }

  public removeWatchdog(
    gameId: number,
  ): void {
    this.gameIdToWatchdog.delete(gameId);
  }

  public async startPolling(
    gameId: number,
  ): Promise<void> {
    // if (this.gameIdToInterval.has(gameId))
    //   return;

    const rate = await this.dynamicConfig.getOrThrow(DynamicConfig.STATE_POLLING_RATE);

    const interval = setInterval(async () => {
      try {
        const game = await this.repo.findById(gameId);
        if (!game)
          throw new Error("Game not found");

        const socket = this.connections.getSocket(gameId);
        if (!socket)
          throw new Error("Socket not found");

        if (game.status === "FINISHED")
          return this.stopPolling(gameId);

        socket.sendEvent("game:state", game);
      } catch (e) {
        this.logger.log.error(`Polling for game ${gameId} failed: ${e instanceof Error ? e.message : e}`);
        this.stopPolling(gameId);
      }
    }, rate);

    this.gameIdToInterval.set(gameId, interval);
  }

  public stopPolling(
    gameId: number,
  ): void {
    const interval = this.gameIdToInterval.get(gameId);

    if (!interval)
      return;

    clearInterval(interval);
  }
}
