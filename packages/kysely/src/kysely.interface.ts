import type {
  Dialect,
  FileMigrationProviderProps,
  IsolationLevel,
  Kysely,
  KyselyConfig,
  Migration,
  MigrationProvider,
  MigrationResultSet,
  MigratorProps,
} from "kysely";
import { RepeatableMigrationResultSet, RepeatableMigratorProps } from "./migrations/repeatable";

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

export interface MigrationClass extends Function {
  new (...args: any[]): Migration;
}

export interface KyselyMigrationClassProviderOptions {
  /**
   * Generates a prefix for the migration key.
   */
  prefixFn?: (index: number) => string;

  /**
   * If true, the number of the migration will be used as a prefix.
   * For example, if the migration class name is CreateUserTable00000001, the migration name will be `00000001-CreateUserTable`.
   * @default false
   */
  useSuffixNumberAsPrefix?: boolean;
}

export interface KyselyMigrationFileProviderOptions extends FileMigrationProviderProps {
  fs: FileMigrationProviderProps["fs"] & {
    readFile: (path: string, encoding?: BufferEncoding) => Promise<string | Buffer>;
  };
}

export interface KyselyMigrationMergeProviderOptions {
  providers: MigrationProvider[];
}
