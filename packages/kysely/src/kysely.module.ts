import { Global, Inject, Logger, Module, OnApplicationShutdown, OnModuleInit } from "@nestjs/common";
import { Kysely, Migrator } from "kysely";
import { KYSELY } from "./kysely.constant";
import { KyselyModuleOptions } from "./kysely.interface";
import { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } from "./kysely.module-definition";
import { KyselyService } from "./kysely.service";

@Global()
@Module({
  providers: [
    {
      provide: KYSELY,
      useFactory: async (options: KyselyModuleOptions) => {
        return new Kysely(options);
      },
      inject: [MODULE_OPTIONS_TOKEN],
    },
    KyselyService,
  ],
  exports: [KYSELY, KyselyService],
})
export class KyselyModule extends ConfigurableModuleClass implements OnModuleInit, OnApplicationShutdown {
  #logger = new Logger("KyselyModule");

  constructor(
    @Inject(MODULE_OPTIONS_TOKEN) private readonly options: KyselyModuleOptions,
    @Inject(KYSELY) readonly kysely: Kysely<any>,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    const migratorProps = this.options.migrations?.migratorProps;
    if (this.options.migrations?.migrationsRun && migratorProps) {
      const migrator = new Migrator({ db: this.kysely, ...migratorProps });
      const { error } = await migrator.migrateToLatest();
      if (error) {
        if (this.options.migrations?.throwMigrationError) {
          throw error;
        } else {
          this.#logger.error(error);
        }
      }
    }
  }

  async onApplicationShutdown(): Promise<void> {
    await this.kysely.destroy();
  }
}
