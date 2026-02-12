import { Service } from "typedi";

import { $Enums } from "../../../infra/db";
import { WebSocket } from "../../../lib/interfaces";
import { GameRepository } from "./game.repository";

@Service()
export class GameConnections {
  private readonly gameIdToSocket = new Map<number, WebSocket>();
  private readonly socketToGameId = new Map<WebSocket, number>();
  private readonly gameIdToStatus = new Map<number, $Enums.GameStatus>();

  constructor(
    private readonly repo: GameRepository,
  ) {}

  public getGameId(
    ws: WebSocket,
  ): number | undefined {
    return this.socketToGameId.get(ws);
  }

  public getSocket(
    gameId: number,
  ): WebSocket | undefined {
    return this.gameIdToSocket.get(gameId);
  }

  public async connect(
    ws: WebSocket,
    gameId: number,
  ): Promise<void> {
    const game = await this.repo.findById(gameId);

    if (!game || game.status === "FINISHED")
      ws.close();

    this.gameIdToSocket.set(gameId, ws);
    this.socketToGameId.set(ws, gameId);
  }

  public getStatus(
    gameId: number,
  ): $Enums.GameStatus | undefined {
    return this.gameIdToStatus.get(gameId);
  }

  public setStatus(
    gameId: number,
    status: $Enums.GameStatus,
  ): void {
    this.gameIdToStatus.set(gameId, status);
  }
}
