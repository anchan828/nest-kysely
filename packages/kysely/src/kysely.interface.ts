import type { IsolationLevel, KyselyConfig, MigratorProps } from "kysely";

export interface KyselyMigrationOptions {
  migrationsRun?: boolean;
  migratorProps?: Omit<MigratorProps, "db">;
  throwMigrationError?: boolean;
}

export interface KyselyModuleOptions extends KyselyConfig {
  migrations?: KyselyMigrationOptions;
}

export interface TransactionalOptions {
  isolationLevel?: IsolationLevel;
}
