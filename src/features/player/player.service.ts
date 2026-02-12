import { Service } from "typedi";

import { DynamicConfig, DynamicConfigService } from "../../core/config/dynamic";
import { $Enums, Prisma, PrismaQueryError, PrismaService } from "../../infra/db";
import { HttpException } from "../../lib/exceptions";
import { PlayerResponse } from "./dto";
import { CreatePlayerRequest } from "./dto/create-player.request";

@Service()
export class PlayerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dynamicConfig: DynamicConfigService,
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

  public async getById(
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

  public async kick(
    gameId: number,
    playerId: number,
  ): Promise<PlayerResponse> {
    return this.changeStatus(gameId, playerId, "KICKED");
  }

  public async restore(
    gameId: number,
    playerId: number,
  ): Promise<PlayerResponse> {
    return this.changeStatus(gameId, playerId, "ACTIVE");
  }

  public async strike(
    gameId: number,
    playerId: number,
  ): Promise<PlayerResponse | null> {
    const balanceDec = await this.dynamicConfig.getOrThrow(DynamicConfig.STRIKE_PRICE);

    const player = await this.prisma.player.update({
      where: { id: playerId, gameId },
      data: { balance: { decrement: balanceDec }, strikes: { increment: 1 } },
    }).catch((e) => {
      if (e.code === PrismaQueryError.RecordsNotFound)
        return null;
      throw e;
    });

    if (!player)
      return null;

    return this.toResponse(player);
  }

  private async changeStatus(
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
