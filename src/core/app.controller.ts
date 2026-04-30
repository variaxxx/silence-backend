import { Controller, Get } from "../lib/decorators";

@Controller()
export class AppController {
  @Get("health")
  health(): any {
    return { ok: true };
  }
}
