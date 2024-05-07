import type {
  FileMigrationProviderProps,
  IsolationLevel,
  KyselyConfig,
  Migration,
  MigrationProvider,
  MigratorProps,
} from "kysely";

export interface KyselyMigrationOptions {
  migrationsRun?: boolean;
  migratorProps?: Omit<MigratorProps, "db">;
  throwMigrationError?: boolean;
}

export interface KyselyModuleOptions extends KyselyConfig {
  migrations?: KyselyMigrationOptions;
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
