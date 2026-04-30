import { Service } from "typedi";

import { FindManyApiResponse } from "../../../common/interfaces";
import { $Enums, Prisma, PrismaQueryError, PrismaService } from "../../../infra/db";
import { HttpException } from "../../../lib/exceptions";
import { GameResponse } from "../dto";

@Service()
export class GameRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  public async create(
    options?: {
      isDotEnabled?: boolean;
    },
  ): Promise<GameResponse> {
    const game = await this.prisma.game.create({
      data: { isDotEnabled: options?.isDotEnabled },
      include: { players: true },
    });

    return this.toResponse(game);
  }

  public async findById(
    id: number,
  ): Promise<GameResponse | null> {
    const game = await this.prisma.game.findUnique({
      where: { id },
      include: { players: true },
    });

    if (!game)
      return null;

    return this.toResponse(game);
  }

  public async findMany(): Promise<FindManyApiResponse<GameResponse>> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.game.findMany({ where: { status: { not: "FINISHED" } } }),
      this.prisma.game.count(),
    ]);

    return {
      total,
      items: items.map(i => this.toResponse(i)),
    };
  }

  public async changeStatus(
    id: number,
    status: $Enums.GameStatus,
  ): Promise<GameResponse> {
    const game = await this.prisma.game.update({
      where: { id, status: { not: "FINISHED" } },
      data: {
        status,
        finishedAt: status === "FINISHED" ? new Date() : undefined,
      },
      include: { players: true },
    }).catch((e) => {
      if (e.code === PrismaQueryError.RecordsNotFound)
        throw new HttpException(404, "Game not found");
      throw e;
    });

    return this.toResponse(game);
  }

  private toResponse(
    game: Prisma.GameGetPayload<object> & { players?: Prisma.PlayerGetPayload<object>[] },
  ): GameResponse {
    return {
      gameId: game.id,
      createdAt: game.createdAt,
      finishedAt: game.finishedAt,
      status: game.status,
      players: game.players
        ? game.players.map(p => ({
            id: p.id,
            gameId: game.id,
            status: p.status,
            balance: p.balance,
            name: p.name,
            micId: p.micId,
            strikes: p.strikes,
          }))
        : undefined,
    };
  }
}
