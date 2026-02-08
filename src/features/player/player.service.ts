import { Service } from "typedi";

import { HttpException } from "../../common/exceptions";
import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../infra/db/prisma.service";
import { PrismaQueryError } from "../../shared/enums";
import { PlayerResponse } from "./dto";
import { CreatePlayerRequest } from "./dto/create-player.request";

@Service()
export class PlayerService {
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

  public async getById(
    id: number,
  ): Promise<PlayerResponse | null> {
    const player = await this.prisma.player.findUnique({
      where: { id },
    });

    if (!player)
      return null;
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
