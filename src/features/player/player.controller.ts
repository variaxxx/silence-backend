import { FastifyRequest } from "fastify";

import { Controller, Get, HttpCode, Post } from "../../common/decorators";
import { HttpException } from "../../common/exceptions";
import { GameIdParamSchema } from "../game/dto";
import { PlayerIdParamSchema, PlayerResponse } from "./dto";
import { CreatePlayerRequest, CreatePlayerSchema } from "./dto/create-player.request";
import { PlayerService } from "./player.service";

@Controller("games/:gameId/players")
export class PlayerController {
  constructor(
    private readonly service: PlayerService,
  ) {}

  @HttpCode(201)
  @Post("", {
    schema: { body: CreatePlayerSchema, params: GameIdParamSchema },
  })
  async create(
    req: FastifyRequest<{ Body: CreatePlayerRequest; Params: { gameId: number } }>,
  ): Promise<PlayerResponse> {
    const { gameId } = req.params;
    return await this.service.create(gameId, req.body);
  }

  @Get(":playerId", { schema: { params: PlayerIdParamSchema } })
  async getOne(
    req: FastifyRequest<{ Params: {
      playerId: number;
      gameId: number;
    }; }>,
  ): Promise<PlayerResponse> {
    const { playerId } = req.params;
    const player = await this.service.getById(playerId);

    if (!player)
      throw new HttpException(404, "Player not founds");
    return player;
  }

  // @Post(":userId/top-up")
  // async getOne(
  //   req: FastifyRequest<{ Params: { userId: number } }>,
  // ): Promise<any> {

  // }

  // @Get(":userId")
  // async getOne(
  //   req: FastifyRequest<{ Params: { userId: number } }>,
  // ): Promise<any> {

  // }
}
