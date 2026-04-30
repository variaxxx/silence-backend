import { $Enums } from "../../../infra/db";
import { PlayerResponse } from "../../player/dto";

export interface GameResponse {
  gameId: number;
  createdAt: Date;
  finishedAt: Date | null;
  status: $Enums.GameStatus;
  players?: PlayerResponse[];
}
