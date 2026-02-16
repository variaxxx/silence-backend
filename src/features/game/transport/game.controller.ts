import { FastifyRequest } from "fastify";

import { Controller, Get, HttpCode, Post } from "../../../lib/decorators";
import { HttpException } from "../../../lib/exceptions";
import { GameService } from "../app/game.service";
import { CreateGameRequest, CreateGameSchema, GameIdParamSchema, GameResponse } from "../dto";

@Controller("games")
export class GameController {
  constructor(
    private readonly service: GameService,
  ) {}

  @HttpCode(201)
  @Post("", {
    schema: { body: CreateGameSchema },
  })
  async create(
    req: FastifyRequest<{ Body: CreateGameRequest }>,
  ): Promise<GameResponse> {
    return await this.service.create(req.body);
  }

  @Get()
  async getMany(): Promise<any> {
    return await this.service.findMany();
  }

  @Get(":gameId", {
    schema: { params: GameIdParamSchema },
  })
  async getInfo(
    req: FastifyRequest<{ Params: { gameId: number } }>,
  ): Promise<GameResponse> {
    const { gameId } = req.params;
    const game = await this.service.findById(gameId);

    if (!game)
      throw new HttpException(404, "Game not found");
    return game;
  }

  @Post(":gameId/start", {
    schema: { params: GameIdParamSchema },
  })
  async start(
    req: FastifyRequest<{ Params: { gameId: number } }>,
  ): Promise<GameResponse> {
    const { gameId } = req.params;
    return await this.service.start(gameId);
  }

  @Post(":gameId/finish", {
    schema: { params: GameIdParamSchema },
  })
  async finish(
    req: FastifyRequest<{ Params: { gameId: number } }>,
  ): Promise<GameResponse> {
    const { gameId } = req.params;
    return await this.service.finish(gameId);
  }

  @Post(":gameId/pause", {
    schema: { params: GameIdParamSchema },
  })
  async pause(
    req: FastifyRequest<{ Params: { gameId: number } }>,
  ): Promise<GameResponse> {
    const { gameId } = req.params;
    return await this.service.pause(gameId);
  }
}
