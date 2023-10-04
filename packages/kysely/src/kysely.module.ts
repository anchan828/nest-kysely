import { Global, Inject, Logger, Module, OnApplicationShutdown, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Kysely, Migrator } from "kysely";
import { KyselyModuleOptions } from "./kysely.interface";
import { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } from "./kysely.module-definition";
import { KyselyService } from "./kysely.service";

@Global()
@Module({
  providers: [
    {
      provide: Kysely,
      useFactory: async (options: KyselyModuleOptions) => {
        return new Kysely(options);
      },
      inject: [MODULE_OPTIONS_TOKEN],
    },
    KyselyService,
  ],
  exports: [Kysely, KyselyService],
})
export class KyselyModule
  extends ConfigurableModuleClass
  implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown
{
  #logger = new Logger("KyselyModule");

  constructor(
    @Inject(MODULE_OPTIONS_TOKEN) private readonly options: KyselyModuleOptions,
    readonly kysely: Kysely<any>,
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

  async onModuleDestroy(): Promise<void> {
    await this.kysely.destroy();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.kysely.destroy();
  }
}
