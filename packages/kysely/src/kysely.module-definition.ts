import { ConfigurableModuleBuilder } from "@nestjs/common";
import { KyselyModuleOptions } from "./kysely.interface";

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } = new ConfigurableModuleBuilder<KyselyModuleOptions>()
  .setExtras(
    {
      /**
       * Indicates whether the Module instance should be global.
       * @default false
       */
      isGlobal: false,
    },
    (definition, extras) => ({
      ...definition,
      global: extras.isGlobal,
    }),
  )
  .build();
