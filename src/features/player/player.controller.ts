import { FastifyRequest } from "fastify";
import Joi from "joi";

import { Controller, Get, HttpCode, Post } from "../../lib/decorators";
import { HttpException } from "../../lib/exceptions";
import { GameIdParam, GameIdParamSchema } from "../game/dto";
import { CreatePlayerRequest, CreatePlayerSchema, DeductBalanceRequest, DeductBalanceSchema, PlayerIdParam, PlayerIdParamSchema, PlayerResponse, TopupBalanceRequest, TopupBalanceSchema } from "./dto";
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

  @Get(":playerId", { schema: { params: PlayerIdParamSchema.concat(GameIdParamSchema as Joi.ObjectSchema) } })
  async getOne(
    req: FastifyRequest<{ Params: PlayerIdParam & GameIdParam }>,
  ): Promise<PlayerResponse> {
    const { playerId, gameId } = req.params;
    const player = await this.playerService.getById(gameId, playerId);

    if (!player)
      throw new HttpException(404, "Player not found");
    return player;
  }

  @Post(":playerId/balance/topup", {
    schema: {
      params: PlayerIdParamSchema.concat(GameIdParamSchema as Joi.ObjectSchema),
      body: TopupBalanceSchema,
    },
  })
  async topup(
    req: FastifyRequest<{
      Params: PlayerIdParam & GameIdParam;
      Body: TopupBalanceRequest;
    }>,
  ): Promise<PlayerResponse> {
    const { playerId, gameId } = req.params;
    const { amount } = req.body;
    return await this.balanceService.topup(gameId, playerId, amount);
  }

  @Post(":playerId/balance/deduct", {
    schema: {
      params: PlayerIdParamSchema.concat(GameIdParamSchema as Joi.ObjectSchema),
      body: DeductBalanceSchema,
    },
  })
  async deduct(
    req: FastifyRequest<{
      Params: PlayerIdParam & GameIdParam;
      Body: DeductBalanceRequest;
    }>,
  ): Promise<PlayerResponse> {
    const { playerId, gameId } = req.params;
    const { amount } = req.body;
    return await this.balanceService.deduct(gameId, playerId, amount);
  }

  @Post(":playerId/kick", {
    schema: { params: PlayerIdParamSchema.concat(GameIdParamSchema as Joi.ObjectSchema) },
  })
  async kick(
    req: FastifyRequest<{ Params: PlayerIdParam & GameIdParam }>,
  ): Promise<PlayerResponse> {
    const { gameId, playerId } = req.params;
    return await this.playerService.kick(gameId, playerId);
  }

  @Post(":playerId/restore", {
    schema: { params: PlayerIdParamSchema.concat(GameIdParamSchema as Joi.ObjectSchema) },
  })
  async restore(
    req: FastifyRequest<{ Params: PlayerIdParam & GameIdParam }>,
  ): Promise<PlayerResponse> {
    const { gameId, playerId } = req.params;
    return await this.playerService.restore(gameId, playerId);
  }
}
