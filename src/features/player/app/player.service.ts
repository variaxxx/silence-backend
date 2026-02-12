import { Service } from "typedi";

import { DynamicConfig, DynamicConfigService } from "../../../core/config/dynamic";
import { PlayerResponse } from "../dto";
import { CreatePlayerRequest } from "../dto/create-player.request";
import { PlayerRepository } from "../infra/player.repository";

@Service()
export class PlayerService {
  constructor(
    private readonly repo: PlayerRepository,
    private readonly dynamicConfig: DynamicConfigService,
  ) {}

  public async create(
    gameId: number,
    payload: CreatePlayerRequest,
  ): Promise<PlayerResponse> {
    return this.repo.create(gameId, payload);
  }

  public async findById(
    gameId: number,
    playerId: number,
  ): Promise<PlayerResponse | null> {
    return this.repo.findById(gameId, playerId);
  }

  public async kick(
    gameId: number,
    playerId: number,
  ): Promise<PlayerResponse> {
    return this.repo.changeStatus(gameId, playerId, "KICKED");
  }

  public async restore(
    gameId: number,
    playerId: number,
  ): Promise<PlayerResponse> {
    return this.repo.changeStatus(gameId, playerId, "ACTIVE");
  }

  public async strike(
    gameId: number,
    playerId: number,
  ): Promise<PlayerResponse | null> {
    const balanceDec = await this.dynamicConfig.getOrThrow(DynamicConfig.STRIKE_PRICE);

    return this.repo.countStrike(gameId, playerId, balanceDec);
  }
}
