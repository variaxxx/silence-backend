import { Service } from "typedi";

import { FindManyApiResponse } from "../../common/interfaces";
import { DynamicConfig, DynamicConfigService } from "../../core/config/dynamic";
import { Logger } from "../../core/logger";
import { $Enums, Prisma, PrismaQueryError, PrismaService } from "../../infra/db";
import { HttpException } from "../../lib/exceptions";
import { WebSocket } from "../../lib/interfaces";
import { PlayerService } from "../player/player.service";
import { GameResponse, GameStatePayload } from "./dto";

@Service()
export class GameService {
  private readonly gameIdToSocket = new Map<number, WebSocket>();
  private readonly socketToGameId = new Map<WebSocket, number>();

  private readonly gameIdToInterval = new Map<number, NodeJS.Timeout>();
  private readonly gameIdToWatchdog = new Map<number, NodeJS.Timeout>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
    private readonly dynamicConfig: DynamicConfigService,
    private readonly playerService: PlayerService,
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

  public getGameIdByWs(
    ws: WebSocket,
  ): number | undefined {
    return this.socketToGameId.get(ws);
  }

  public async start(
    gameId: number,
  ): Promise<GameResponse> {
    const game = await this.changeStatus(gameId, "RUNNING");
    this.startPolling(gameId);
    this.setupWatchdog(gameId);
    return game;
  }

  public async finish(
    gameId: number,
  ): Promise<GameResponse> {
    const game = await this.changeStatus(gameId, "FINISHED");
    this.stopPolling(gameId);
    this.removeWatchdog(gameId);
    return game;
  }

  public async pause(
    gameId: number,
  ): Promise<GameResponse> {
    const game = await this.changeStatus(gameId, "WAITING");
    this.stopPolling(gameId);
    this.removeWatchdog(gameId);
    return game;
  }

  public async handleConnection(
    ws: WebSocket,
    gameId: number,
  ): Promise<void> {
    const game = await this.getById(gameId);

    if (!game)
      ws.close();

    this.gameIdToSocket.set(gameId, ws);
    this.socketToGameId.set(ws, gameId);
  }

  public async handleGameState(
    socket: WebSocket,
    payload: GameStatePayload,
  ): Promise<void> {
    const gameId = this.getGameIdByWs(socket);
    if (!gameId)
      return void socket.sendEvent("error", "No connection to the game");

    const threshold = await this.dynamicConfig.getOrThrow(DynamicConfig.VOLUME_THRESHOLD);

    for (const p of payload.players) {
      if (p.micState >= threshold) {
        const player = await this.playerService.strike(gameId, p.id);
        socket.sendEvent("player:strike", player);
      }
    }

    await this.setupWatchdog(gameId);
  }

  private async setupWatchdog(
    gameId: number,
  ): Promise<void> {
    const existingWatchdog = this.gameIdToWatchdog.get(gameId);
    if (existingWatchdog)
      clearTimeout(existingWatchdog);

    const timeoutMs = await this.dynamicConfig.getOrThrow(DynamicConfig.GAME_DEATH_TIMEOUT);
    const newWatchdog = setTimeout(async () => {
      await this.pause(gameId);
      this.gameIdToSocket.get(gameId)?.sendEvent("game:paused");
    }, timeoutMs);

    this.gameIdToWatchdog.set(gameId, newWatchdog);
  }

  private removeWatchdog(
    gameId: number,
  ): void {
    this.gameIdToWatchdog.delete(gameId);
  }

  private startPolling(
    gameId: number,
  ): void {
    if (this.gameIdToInterval.has(gameId))
      return;

    const interval = setInterval(async () => {
      try {
        const game = await this.getById(gameId);
        if (!game)
          throw new Error("Game not found");

        const socket = this.gameIdToSocket.get(gameId);
        if (!socket)
          throw new Error("Socket not found");

        if (game.status === "FINISHED")
          return this.stopPolling(gameId);

        socket.sendEvent("game:state", game);
      } catch (e) {
        this.logger.log.error(`Polling for game ${gameId} failed: ${e instanceof Error ? e.message : e}`);
        this.stopPolling(gameId);
      }
    }, 1000);

    this.gameIdToInterval.set(gameId, interval);
  }

  private stopPolling(
    gameId: number,
  ): void {
    const interval = this.gameIdToInterval.get(gameId);

    if (!interval)
      return;

    clearInterval(interval);
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
