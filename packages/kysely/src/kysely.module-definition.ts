import { ConfigurableModuleBuilder } from "@nestjs/common";
import { KyselyModuleOptions } from "./kysely.interface";

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<KyselyModuleOptions>().build();
