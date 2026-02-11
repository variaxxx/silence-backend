import { FastifyRequest } from "fastify";

import { DynamicConfigService } from "../../core/config/dynamic";
import { Controller, Get, Post } from "../../lib/decorators";
import { ChangeSettingsRequest, ChangeSettingsSchema, SettingsResponse } from "./dto";

@Controller("settings")
export class SettingsController {
  constructor(
    private readonly config: DynamicConfigService,
  ) {}

  @Get()
  async get(): Promise<SettingsResponse> {
    return await this.config.getAll();
  }

  @Post("/", {
    schema: { body: ChangeSettingsSchema },
  })
  async change(
    req: FastifyRequest<{ Body: ChangeSettingsRequest }>,
  ): Promise<SettingsResponse> {
    const body = req.body;
    await this.config.setMany(body);
    return await this.config.getAll();
  }
}
