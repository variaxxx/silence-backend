import { Controller, Post } from "../../common/decorators";
import { PlayerService } from "./player.service";

@Controller("players")
export class PlayerController {
  constructor(
    private readonly service: PlayerService,
  ) {}

  // @Post("/", {
  //   schema: 
  // })
  // async create(): Promise<any> {
  //   return await this.service.create();
  // }
}
