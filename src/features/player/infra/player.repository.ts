import { Service } from "typedi";

import { $Enums, Prisma, PrismaQueryError, PrismaService } from "../../../infra/db";
import { HttpException } from "../../../lib/exceptions";
import { CreatePlayerRequest, PlayerResponse } from "../dto";

@Service()
export class PlayerRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  public async create(
    gameId: number,
    dto: CreatePlayerRequest,
  ): Promise<PlayerResponse> {
    const player = await this.prisma.player.create({
      data: {
        name: dto.name,
        micId: dto.micId,
        gameId,
      },
    }).catch((e) => {
      if (e.code === PrismaQueryError.UniqueConstraintViolation)
        throw new HttpException(409, "This microphone ID is already associated with the player");
      if (e.code === PrismaQueryError.ForeignConstraintViolation)
        throw new HttpException(400, `Game ${gameId} do not exist`);
      throw e;
    });

    return this.toResponse(player);
  }

  public async findById(
    gameId: number,
    id: number,
  ): Promise<PlayerResponse | null> {
    const player = await this.prisma.player.findUnique({
      where: { id, gameId },
    });

    if (!player)
      return null;
    return this.toResponse(player);
  }

  public async changeStatus(
    gameId: number,
    playerId: number,
    status: $Enums.PlayerStatus,
  ): Promise<PlayerResponse> {
    const player = await this.prisma.player.update({
      where: { id: playerId, gameId },
      data: { status },
    }).catch((e) => {
      if (e.code === PrismaQueryError.RecordsNotFound)
        throw new HttpException(404, "Player not found");
      throw e;
    });

    return this.toResponse(player);
  }

  public async countStrike(
    gameId: number,
    playerId: number,
    amount: number,
  ): Promise<PlayerResponse> {
    const player = await this.prisma.player.update({
      where: { id: playerId, gameId, status: "ACTIVE" },
      data: { balance: { decrement: amount }, strikes: { increment: 1 } },
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
