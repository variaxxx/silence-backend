import { Service } from "typedi";

import { Logger } from "../../../core/logger";
import { Prisma, PrismaQueryError, PrismaService } from "../../../infra/db";
import { HttpException } from "../../../lib/exceptions";
import { PlayerResponse } from "../dto";

@Service()
export class PlayerBalanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  public async topup(
    gameId: number,
    playerId: number,
    amount: number,
  ): Promise<PlayerResponse> {
    if (amount < 0)
      throw new HttpException(400, "Top up amount can`t be negative");

    const player = await this.changeBalance(gameId, playerId, amount);
    this.logger.writeLog(`Player ${playerId} balance has been replenished by ${amount}}`);
    return player;
  }

  public async deduct(
    gameId: number,
    playerId: number,
    amount: number,
  ): Promise<PlayerResponse> {
    if (amount < 0)
      throw new HttpException(400, "Deduct amount can`t be negative");

    const player = await this.changeBalance(gameId, playerId, -amount);
    this.logger.writeLog(`Player ${playerId} balance has been debited by ${amount}`);
    return player;
  }

  private async changeBalance(
    gameId: number,
    playerId: number,
    amount: number,
  ): Promise<PlayerResponse> {
    const balance: Prisma.IntFieldUpdateOperationsInput = amount < 0
      ? { decrement: Math.abs(amount) }
      : { increment: amount };

    const player = await this.prisma.player.update({
      where: { id: playerId, gameId },
      data: { balance },
    }).catch((e) => {
      if (e.code === PrismaQueryError.RecordsNotFound)
        throw new HttpException(404, "Player not found");
      throw e;
    });

    return this.toResponse(player);
  }

  private toResponse(
    player: Prisma.PlayerGetPayload<object>,
  ): PlayerResponse {
    return {
      id: player.id,
      gameId: player.gameId,
      micId: player.micId,
      strikes: player.strikes,
      balance: player.balance,
      name: player.name,
      status: player.status,
    };
  }
}
