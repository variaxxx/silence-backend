import { $Enums } from "../../../generated/prisma/client";

export interface PlayerResponse {
  id: number;
  micId: number;
  gameId: number;
  status: $Enums.PlayerStatus;
  name: string;
  strikes: number;
  balance: number;
}
