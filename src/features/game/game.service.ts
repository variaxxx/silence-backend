import { Service } from "typedi";

import { HttpException } from "../../common/exceptions";
import { FindManyApiResponse } from "../../common/interfaces";
import { $Enums, Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../infra/db/prisma.service";
import { PrismaQueryError } from "../../shared/enums";
import { GameResponse } from "./dto";

@Service()
export class GameService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  public async create(): Promise<GameResponse> {
    const game = await this.prisma.game.create({
      include: { players: true },
    });

    return this.toResponse(game);
  }

  public async getById(
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

  public async getMany(): Promise<FindManyApiResponse<GameResponse>> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.game.findMany({ where: { status: { not: "FINISHED" } } }),
      this.prisma.game.count(),
    ]);

    return {
      total,
      items: items.map(i => this.toResponse(i)),
    };
  }

  public async start(
    id: number,
  ): Promise<GameResponse> {
    // TODO: start polling
    return await this.changeStatus(id, "RUNNING");
  }

  public async finish(
    id: number,
  ): Promise<GameResponse> {
    // TODO: stop polling
    return await this.changeStatus(id, "FINISHED");
  }

  public async pause(
    id: number,
  ): Promise<GameResponse> {
    // TODO: pause polling
    return await this.changeStatus(id, "WAITING");
  }

  private async changeStatus(
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
            balance: p.balance,
            name: p.name,
            micId: p.micId,
            strikes: p.strikes,
          }))
        : undefined,
    };
  }
}
