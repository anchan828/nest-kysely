import { RepeatableMigrator } from "@anchan828/kysely-migration";
import { Global, Inject, Logger, Module, OnApplicationShutdown, OnModuleInit, Type } from "@nestjs/common";
import { Kysely, Migrator } from "kysely";
import { KYSELY } from "./kysely.constant";
import { KyselyMigrationOptions, KyselyModuleOptions, KyselyRepeatableMigrationOptions } from "./kysely.interface";
import { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } from "./kysely.module-definition";
import { KyselyService } from "./kysely.service";

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
    const migrationKysely = this.options.migrationDialect
      ? new Kysely({
          ...this.options,
          dialect: this.options.migrationDialect,
        })
      : this.kysely;
    await this.#runMigrations(Migrator, migrationKysely, this.options.migrations);
    await this.#runMigrations(RepeatableMigrator, migrationKysely, this.options.repeatableMigrations);

    if (this.options.migrationDialect) {
      await migrationKysely.destroy();
    }
  }

  async #runMigrations(
    MigratorCreator: Type<Migrator | RepeatableMigrator>,
    kysely: Kysely<any>,
    options?: KyselyMigrationOptions | KyselyRepeatableMigrationOptions,
  ): Promise<void> {
    const migratorProps = options?.migratorProps;

    if (!(options?.migrationsRun && migratorProps)) {
      return;
    }

    await this.#runMigrationHook(kysely, options.migrateBefore, options.throwMigrationError);

    const migrator = new MigratorCreator({ db: kysely, ...migratorProps });
    const migrationResultSet = await migrator.migrateToLatest();
    if (migrationResultSet.error) {
      if (options.throwMigrationError) {
        throw migrationResultSet.error;
      } else {
        this.#logger.error(migrationResultSet.error);
      }
    }

    await this.#runMigrationHook(kysely, options.migrateAfter, options.throwMigrationError);

    if (options.migrateResult) {
      await options.migrateResult(migrationResultSet as any);
    }
  }

  async #runMigrationHook(
    kysely: Kysely<any>,
    hook?: (db: Kysely<any>) => Promise<void>,
    throwMigrationError?: boolean,
  ): Promise<void> {
    if (!hook) {
      return;
    }

    try {
      const supportsTransactionalDdl = kysely.getExecutor().adapter.supportsTransactionalDdl;
      await (supportsTransactionalDdl ? kysely.transaction().execute(hook) : kysely.connection().execute(hook));
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
