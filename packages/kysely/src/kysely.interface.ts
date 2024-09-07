import { RepeatableMigrationResultSet, RepeatableMigratorProps } from "@anchan828/kysely-migration";
import type { Dialect, IsolationLevel, Kysely, KyselyConfig, MigrationResultSet, MigratorProps } from "kysely";

export interface KyselyMigrationOptions {
  migrationsRun?: boolean;
  migratorProps?: Omit<MigratorProps, "db">;
  throwMigrationError?: boolean;

  /**
   * Callback that runs before the migration.
   */
  migrateBefore?: (db: Kysely<any>) => Promise<void>;
  /**
   * Callback that runs after the migration.
   */
  migrateAfter?: (db: Kysely<any>) => Promise<void>;
  /**
   * Callback that runs after the migration result.
   */
  migrateResult?: (resultSet: MigrationResultSet) => Promise<void>;
}

export interface KyselyRepeatableMigrationOptions {
  migrationsRun?: boolean;
  migratorProps?: Omit<RepeatableMigratorProps, "db">;
  throwMigrationError?: boolean;

  /**
   * Callback that runs before the migration.
   */
  migrateBefore?: (db: Kysely<any>) => Promise<void>;
  /**
   * Callback that runs after the migration.
   */
  migrateAfter?: (db: Kysely<any>) => Promise<void>;

  /**
   * Callback that runs after the migration result.
   */
  migrateResult?: (resultSet: RepeatableMigrationResultSet) => Promise<void>;
}

export interface KyselyModuleOptions extends KyselyConfig {
  /**
   * The dialect for migrations. Use when performing migration with different users. If not set, dialect will be used.
   */
  migrationDialect?: Dialect;
  migrations?: KyselyMigrationOptions;
  repeatableMigrations?: KyselyRepeatableMigrationOptions;
}

export interface KyselyTransactionalOptions {
  isolationLevel?: IsolationLevel;
}
