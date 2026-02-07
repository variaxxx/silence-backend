import { Controller, Get } from "../common/decorators";

@Controller()
export class AppController {
  @Get("health")
  health(): any {
    return { ok: true };
  }
}
