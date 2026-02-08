import { Service } from "typedi";

import { PrismaService } from "../../infra/db/prisma.service";

@Service()
export class PlayerService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // async create(
  //   dto,
  // ): Promise<any> {
  //   const player = await this.prisma.player.create({
  //     data: {
  //       name: dto.name,
  //       micId: dto.micId,
  //       gameId: dto.gameId,
  //     },
  //   });

  //   return player;
  // }
}
