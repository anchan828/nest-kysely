import type { IsolationLevel, KyselyConfig, Migration, MigratorProps } from "kysely";

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
