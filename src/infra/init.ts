import { Container } from "typedi";

import { DynamicConfigService } from "../core/config/dynamic";
import { PrismaService } from "./db";

export async function initInfrastructure(): Promise<void> {
  const prisma = Container.get(PrismaService);
  const dynamicConfig = Container.get(DynamicConfigService);

  await Promise.all([dynamicConfig.load(), prisma.connect()]);
}
