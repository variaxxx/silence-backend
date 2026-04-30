import { Service } from "typedi";

import { DynamicConfig, DynamicConfigService } from "../../../core/config/dynamic";
import { Logger } from "../../../core/logger";
import { PlayerResponse } from "../dto";
import { CreatePlayerRequest } from "../dto/create-player.request";
import { PlayerRepository } from "../infra/player.repository";

@Service()
export class PlayerService {
  constructor(
    private readonly repo: PlayerRepository,
    private readonly dynamicConfig: DynamicConfigService,
    private readonly logger: Logger,
  ) {}

  public async create(
    gameId: number,
    payload: CreatePlayerRequest,
  ): Promise<PlayerResponse> {
    const player = await this.repo.create(gameId, payload);
    this.logger.writeLog(`Player ${player.id} was created`);
    return player;
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
    const player = await this.repo.changeStatus(gameId, playerId, "KICKED");
    this.logger.writeLog(`Player ${player.id} was kicked from game ${gameId}`);
    return player;
  }

  public async restore(
    gameId: number,
    playerId: number,
  ): Promise<PlayerResponse> {
    const player = await this.repo.changeStatus(gameId, playerId, "ACTIVE");
    this.logger.writeLog(`Player ${player.id} was restored to game ${gameId}`);
    return player;
  }

  public async strike(
    gameId: number,
    playerId: number,
  ): Promise<PlayerResponse> {
    const balanceDec = await this.dynamicConfig.getOrThrow(DynamicConfig.STRIKE_PRICE);

    const player = await this.repo.countStrike(gameId, playerId, balanceDec);
    this.logger.writeLog(`Player ${player.id} made a strike`);
    return player;
  }
}
