import type { Kysely } from "kysely";

export interface RepeatableMigration {
  sql: string;
  hash: string;
}

export interface RepeatableMigrationProvider {
  getMigrations(): Promise<Record<string, RepeatableMigration>>;
}

export interface RepeatableMigratorProps {
  readonly db: Kysely<any>;
  readonly provider: RepeatableMigrationProvider;
  /**
   * The name of the internal migration table. Defaults to `kysely_repeatable_migration`.
   *
   * If you do specify this, you need to ALWAYS use the same value. Kysely doesn't
   * support changing the table on the fly. If you run the migrator even once with a
   * table name X and then change the table name to Y, kysely will create a new empty
   * migration table and attempt to run the migrations again, which will obviously
   * fail.
   *
   * If you do specify this, ALWAYS ALWAYS use the same value from the beginning of
   * the project, to the end of time or prepare to manually migrate the migration
   * tables.
   */
  readonly migrationTableName?: string;
  /**
   * The name of the internal migration lock table. Defaults to `kysely_repeatable_migration_lock`.
   *
   * If you do specify this, you need to ALWAYS use the same value. Kysely doesn't
   * support changing the table on the fly. If you run the migrator even once with a
   * table name X and then change the table name to Y, kysely will create a new empty
   * lock table.
   *
   * If you do specify this, ALWAYS ALWAYS use the same value from the beginning of
   * the project, to the end of time or prepare to manually migrate the migration
   * tables.
   */
  readonly migrationLockTableName?: string;
}

export interface RepeatableMigrationResultSet {
  readonly error?: unknown;
  readonly results?: RepeatableMigrationResult[];
}

export interface RepeatableMigrationResult {
  readonly migrationName: string;
  readonly migrationHash: string;
  readonly error?: unknown;
  readonly status: "Success" | "Error" | "NotExecuted" | "Deleted";
}

export interface RepeatableMigrationInfo {
  /**
   * Name of the migration.
   */
  name: string;

  /**
   * SQL text of the migration.
   */
  sql: string;

  /**
   * Hash of the migration.
   */
  hash: string;

  /**
   * If the migration has been executed.
   */
  executed?: Date;
}

export interface RepeatableMigration {
  /**
   * Hash of the migration.
   */
  hash: string;

  /**
   * SQL text of the migration.
   */
  sql: string;
}

export interface KyselyRepeatableMigrationSqlFileProviderOptions {
  /**
   * SQL file path
   */
  sqlFiles?: string[];
  /**
   * SQL texts for the migrations.
   */
  sqlTexts?: Array<{ name: string; sql: string }>;
}
