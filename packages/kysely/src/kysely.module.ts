import { Global, Inject, Logger, Module, OnApplicationShutdown, OnModuleInit, Type } from "@nestjs/common";
import { Kysely, Migrator } from "kysely";
import { KYSELY } from "./kysely.constant";
import { KyselyMigrationOptions, KyselyModuleOptions, KyselyRepeatableMigrationOptions } from "./kysely.interface";
import { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } from "./kysely.module-definition";
import { KyselyService } from "./kysely.service";
import { RepeatableMigrator } from "./migrations/repeatable";

@Global()
@Module({
  providers: [
    {
      provide: KYSELY,
      useFactory: (options: KyselyModuleOptions): Kysely<any> => {
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
    await this.#runMigrations(Migrator, this.options.migrations);
    await this.#runMigrations(RepeatableMigrator, this.options.repeatableMigrations);
  }

  async #runMigrations(
    MigratorCreator: Type<Migrator | RepeatableMigrator>,
    options?: KyselyMigrationOptions | KyselyRepeatableMigrationOptions,
  ): Promise<void> {
    const migratorProps = options?.migratorProps;

    if (!(options?.migrationsRun && migratorProps)) {
      return;
    }

    await this.#runMigrationHook(options.migrateBefore, options.throwMigrationError);

    const migrator = new MigratorCreator({ db: this.kysely, ...migratorProps });
    const migrationResultSet = await migrator.migrateToLatest();
    if (migrationResultSet.error) {
      if (options.throwMigrationError) {
        throw migrationResultSet.error;
      } else {
        this.#logger.error(migrationResultSet.error);
      }
    }

    await this.#runMigrationHook(options.migrateAfter, options.throwMigrationError);

    if (options.migrateResult) {
      await options.migrateResult(migrationResultSet as any);
    }
  }

  async #runMigrationHook(hook?: (db: Kysely<any>) => Promise<void>, throwMigrationError?: boolean): Promise<void> {
    if (!hook) {
      return;
    }

    try {
      const supportsTransactionalDdl = this.kysely.getExecutor().adapter.supportsTransactionalDdl;
      await (supportsTransactionalDdl
        ? this.kysely.transaction().execute(hook)
        : this.kysely.connection().execute(hook));
    } catch (error) {
      if (throwMigrationError) {
        throw error;
      } else {
        this.#logger.error(error);
      }
    }
  }

  async onApplicationShutdown(): Promise<void> {
    await this.kysely.destroy();
  }
}
