import { FastifyRequest } from "fastify";

import { Controller, Get, HttpCode, Post } from "../../common/decorators";
import { HttpException } from "../../common/exceptions";
import { GameIdParamSchema } from "../game/dto";
import { DeductBalanceRequest, DeductBalanceSchema, PlayerIdParamSchema, PlayerResponse, TopupBalanceRequest, TopupBalanceSchema } from "./dto";
import { CreatePlayerRequest, CreatePlayerSchema } from "./dto/create-player.request";
import { PlayerBalanceService } from "./player-balance.service";
import { PlayerService } from "./player.service";

@Controller("games/:gameId/players")
export class PlayerController {
  constructor(
    private readonly playerService: PlayerService,
    private readonly balanceService: PlayerBalanceService,
  ) {}

  @HttpCode(201)
  @Post("", {
    schema: { body: CreatePlayerSchema, params: GameIdParamSchema },
  })
  async create(
    req: FastifyRequest<{ Body: CreatePlayerRequest; Params: { gameId: number } }>,
  ): Promise<PlayerResponse> {
    const { gameId } = req.params;
    return await this.playerService.create(gameId, req.body);
  }

  @Get(":playerId", { schema: { params: PlayerIdParamSchema } })
  async getOne(
    req: FastifyRequest<{ Params: {
      playerId: number;
      gameId: number;
    }; }>,
  ): Promise<PlayerResponse> {
    const { playerId } = req.params;
    const player = await this.playerService.getById(playerId);

    if (!player)
      throw new HttpException(404, "Player not found");
    return player;
  }

  @Post(":playerId/balance/topup", {
    schema: {
      params: PlayerIdParamSchema,
      body: TopupBalanceSchema,
    },
  })
  async topup(
    req: FastifyRequest<{
      Params: { playerId: number };
      Body: TopupBalanceRequest;
    }>,
  ): Promise<PlayerResponse> {
    const { playerId } = req.params;
    const { amount } = req.body;
    return await this.balanceService.topup(playerId, amount);
  }

  @Post(":playerId/balance/deduct", {
    schema: {
      params: PlayerIdParamSchema,
      body: DeductBalanceSchema,
    },
  })
  async deduct(
    req: FastifyRequest<{
      Params: { playerId: number };
      Body: DeductBalanceRequest;
    }>,
  ): Promise<PlayerResponse> {
    const { playerId } = req.params;
    const { amount } = req.body;
    return await this.balanceService.deduct(playerId, amount);
  }
}
