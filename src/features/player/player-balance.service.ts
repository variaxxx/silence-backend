import { Service } from "typedi";

import { HttpException } from "../../common/exceptions";
import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../infra/db/prisma.service";
import { PrismaQueryError } from "../../shared/enums";
import { PlayerResponse } from "./dto";

@Service()
export class PlayerBalanceService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  public async topup(
    playerId: number,
    amount: number,
  ): Promise<PlayerResponse> {
    if (amount < 0)
      throw new HttpException(400, "Top up amount can`t be negative");

    return this.changeBalance(playerId, amount);
  }

  public async deduct(
    playerId: number,
    amount: number,
  ): Promise<PlayerResponse> {
    if (amount < 0)
      throw new HttpException(400, "Deduct amount can`t be negative");

    return this.changeBalance(playerId, -amount);
  }

  private async changeBalance(
    playerId: number,
    amount: number,
  ): Promise<PlayerResponse> {
    const balance: Prisma.IntFieldUpdateOperationsInput = amount < 0
      ? { decrement: Math.abs(amount) }
      : { increment: amount };

    const player = await this.prisma.player.update({
      where: { id: playerId },
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
    };
  }
}
