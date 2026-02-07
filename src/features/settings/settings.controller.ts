import { FastifyRequest } from "fastify";

import { Controller, Get, Post } from "../../common/decorators";
import { DynamicConfigService } from "../../core/config/dynamic/dynamic-config.service";
import { ChangeSettingsRequest, ChangeSettingsSchema } from "./dto/change-settings.request";
import { SettingsResponse } from "./dto/settings.response";

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
    schema: ChangeSettingsSchema,
  })
  async change(
    req: FastifyRequest<{ Body: ChangeSettingsRequest }>,
    // rep: FastifyReply,
  ): Promise<SettingsResponse> {
    const body = req.body;
    await this.config.setMany(body);
    return await this.config.getAll();
  }
}
