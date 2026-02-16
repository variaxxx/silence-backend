import { Service } from "typedi";

import { DynamicConfig, DynamicConfigService } from "../../../core/config/dynamic";
import { PrismaService } from "../../../infra/db";

@Service()
export class DamageOverTimeService {
  private readonly gameIdToInterval = new Map<number, NodeJS.Timeout>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: DynamicConfigService,
  ) {}

  public async start(
    gameId: number,
  ): Promise<void> {
    const ms = await this.config.getOrThrow(DynamicConfig.DOT_INTERVAL_MS);

    const interval = setInterval(async () => {
      const decrement = await this.config.getOrThrow(DynamicConfig.DOT_FUNDS_WRITE_OFF);
      await this.prisma.player.updateMany({
        where: { gameId },
        data: { balance: { decrement } },
      });
    }, ms);

    this.gameIdToInterval.set(gameId, interval);
  }

  public async stop(
    gameId: number,
  ): Promise<void> {
    const interval = this.gameIdToInterval.get(gameId);

    if (!interval)
      return;

    clearInterval(interval);
  }
}
