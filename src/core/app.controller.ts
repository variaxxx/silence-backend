import { Controller, Get } from "../common/decorators";

@Controller()
export class AppController {
  @Get("test")
  test(): any {
    return [1];
  }

  @Get("health")
  health(): any {
    return { ok: true };
  }
}
