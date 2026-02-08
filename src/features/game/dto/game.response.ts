import { $Enums } from "../../../generated/prisma/client";
import { PlayerResponse } from "../../player/dto";

export interface GameResponse {
  gameId: number;
  createdAt: Date;
  finishedAt: Date | null;
  status: $Enums.GameStatus;
  players?: PlayerResponse[];
}
