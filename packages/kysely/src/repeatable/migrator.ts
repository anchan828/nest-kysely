import { CreateTableBuilder, Kysely, MigrationLockOptions, Transaction, sql } from "kysely";
import {
  RepeatableMigration,
  RepeatableMigrationInfo,
  RepeatableMigrationResult,
  RepeatableMigrationResultSet,
  RepeatableMigratorProps,
} from "./interface";

export class RepeatableMigrator {
  #MIGRATION_LOCK_ID = "Repeatable_migration_lock";

  #props: Required<RepeatableMigratorProps>;

  constructor(props: RepeatableMigratorProps) {
    this.#props = Object.freeze({
      migrationTableName: "kysely_repeatable_migration",
      migrationLockTableName: "kysely_repeatable_migration_lock",
      ...props,
    });
  }

  public async getMigrations(): Promise<ReadonlyArray<RepeatableMigrationInfo>> {
    await this.#ensureMigrationTablesExists(this.#props.db);
    const executedMigrations = await this.#getExecutedMigrations(this.#props.db);
    const migrations = await this.#resolveMigrations();

    return migrations.map(({ name, ...migration }) => {
      const executed = executedMigrations.find((it) => it.name === name && it.hash === migration.hash);
      return {
        name,
        hash: migration.hash,
        sql: migration.sql,
        executed: executed ? new Date(executed.timestamp) : undefined,
      };
    });
  }

  /**
   * Compatibility with Migrator
   */
  public migrateToLatest(): Promise<RepeatableMigrationResultSet> {
    return this.runMigrations();
  }

  public async runMigrations(): Promise<RepeatableMigrationResultSet> {
    try {
      await this.#ensureMigrationTablesExists(this.#props.db);
      return await this.#runMigrations();
    } catch (error) {
      if (error instanceof RepeatableMigrationResultSetError) {
        return error.resultSet;
      }

      return { error };
    }
  }

  async #runMigrations(): Promise<RepeatableMigrationResultSet> {
    const adapter = this.#props.db.getExecutor().adapter;

    const lockOptions: MigrationLockOptions = Object.freeze({
      lockTable: this.#props.migrationLockTableName,
      lockRowId: this.#MIGRATION_LOCK_ID,
    });

    const run = async (trx: Transaction<any> | Kysely<any>): Promise<RepeatableMigrationResultSet> => {
      try {
        await adapter.acquireMigrationLock(trx, lockOptions);
        const state = await this.#getState(trx);
        if (state.migrations.length === 0) {
          return { results: [] };
        }

        return this.#migrate(trx, state);
      } finally {
        await adapter.releaseMigrationLock(trx, lockOptions);
      }
    };

    if (adapter.supportsTransactionalDdl) {
      return this.#props.db.transaction().execute(run);
    } else {
      return this.#props.db.connection().execute(run);
    }
  }

  async #ensureMigrationTablesExists(db: Kysely<any>): Promise<void> {
    await this.#ensureMigrationTableExists(db);
    await this.#ensureMigrationLockTableExists(db);
    await this.#ensureLockRowExists(db);
  }

  async #migrate(
    trx: Transaction<any> | Kysely<any>,
    state: RepeatableMigrationState,
  ): Promise<RepeatableMigrationResultSet> {
    const results: RepeatableMigrationResult[] = [];

    const timestamp = new Date().toISOString();

    for (let i = 0; i < state.unnecessaryMigrations.length; i++) {
      const migration = state.unnecessaryMigrations[i];
      await trx.deleteFrom(this.#props.migrationTableName).where("name", "=", migration.name).execute();
      results.push({
        migrationName: migration.name,
        migrationHash: migration.hash,
        status: "Deleted",
      });
    }

    for (let i = 0; i < state.pendingMigrations.length; i++) {
      const migration = state.pendingMigrations[i];

      try {
        await sql.raw(migration.sql).execute(trx);
        if (migration.exists) {
          await trx
            .updateTable(this.#props.migrationTableName)
            .set({ hash: migration.hash, timestamp })
            .where("name", "=", migration.name)
            .execute();
        } else {
          await trx
            .insertInto(this.#props.migrationTableName)
            .values({ name: migration.name, hash: migration.hash, timestamp })
            .execute();
        }

        results.push({
          migrationName: migration.name,
          migrationHash: migration.hash,
          status: "Success",
        });
      } catch (error) {
        results.push({
          ...results[i],
          error,
          status: "Error",
        });
        throw new RepeatableMigrationResultSetError({
          error,
          results,
        });
      }
    }

    return { results };
  }

  async #getState(trx: Transaction<any> | Kysely<any>): Promise<RepeatableMigrationState> {
    const migrations = await this.#resolveMigrations();
    const executedMigrations = await this.#getExecutedMigrations(trx);

    const pendingMigrations = this.#getPendingMigrations(migrations, executedMigrations);

    const unnecessaryMigrations = this.#getUnnecessaryMigrations(migrations, executedMigrations);

    return Object.freeze({
      migrations,
      executedMigrations,
      pendingMigrations,
      unnecessaryMigrations,
    });
  }

  #getPendingMigrations(
    migrations: ReadonlyArray<NamedRepeatableMigration>,
    executedMigrations: ReadonlyArray<{ name: string; hash: string; timestamp: string }>,
  ): ReadonlyArray<NamedRepeatableMigration> {
    const executedMigrationKeys = new Map<string, string>(executedMigrations.map((it) => [it.name, it.hash]));

    return migrations
      .map((migration) => {
        if (executedMigrationKeys.get(migration.name) === migration.hash) {
          return;
        }

        return {
          ...migration,
          exists: executedMigrationKeys.has(migration.name),
        };
      })
      .filter((it): it is NamedRepeatableMigration => !!it);
  }

  #getUnnecessaryMigrations(
    migrations: ReadonlyArray<NamedRepeatableMigration>,
    executedMigrations: ReadonlyArray<{ name: string; hash: string; timestamp: string }>,
  ): ReadonlyArray<{ name: string; hash: string; timestamp: string }> {
    const migrationKeys = new Map<string, string>(migrations.map((it) => [it.name, it.hash]));

    return executedMigrations.filter((executedMigration) => !migrationKeys.has(executedMigration.name));
  }

  async #resolveMigrations(): Promise<ReadonlyArray<NamedRepeatableMigration>> {
    const allMigrations = await this.#props.provider.getMigrations();

    return Object.keys(allMigrations)
      .sort()
      .map((name) => ({
        ...allMigrations[name],
        name,
        exists: false,
      }));
  }

  async #getExecutedMigrations(
    trx: Transaction<any> | Kysely<any>,
  ): Promise<ReadonlyArray<{ name: string; hash: string; timestamp: string }>> {
    const existingMigrationTable = await this.#doesTableExists(trx, this.#props.migrationTableName);

    if (!existingMigrationTable) {
      return [];
    }
    return await trx.selectFrom(this.#props.migrationTableName).select(["name", "hash", "timestamp"]).execute();
  }

  async #ensureMigrationTableExists(trx: Transaction<any> | Kysely<any>): Promise<void> {
    if (!(await this.#doesTableExists(trx, this.#props.migrationTableName))) {
      try {
        await this.#createTable(trx);
      } catch (e) {
        if (!(await this.#doesTableExists(trx, this.#props.migrationTableName))) {
          throw e;
        }
      }
    }
  }

  async #ensureMigrationLockTableExists(trx: Transaction<any> | Kysely<any>): Promise<void> {
    if (!(await this.#doesTableExists(trx, this.#props.migrationLockTableName))) {
      try {
        await this.#createLockTable(trx);
      } catch (e) {
        if (!(await this.#doesTableExists(trx, this.#props.migrationLockTableName))) {
          throw e;
        }
      }
    }
  }

  async #ensureLockRowExists(trx: Transaction<any> | Kysely<any>): Promise<void> {
    if (!(await this.#doesLockRowExists(trx))) {
      try {
        await trx
          .insertInto(this.#props.migrationLockTableName)
          .values({ id: this.#MIGRATION_LOCK_ID, is_locked: 0 })
          .execute();
      } catch (error) {
        if (!(await this.#doesLockRowExists(trx))) {
          throw error;
        }
      }
    }
  }

  async #createTable(trx: Transaction<any> | Kysely<any>): Promise<void> {
    await this.#createIfNotExists(
      trx,
      trx.schema
        .createTable(this.#props.migrationTableName)
        .addColumn("name", "varchar(255)", (cb) => cb.primaryKey())
        .addColumn("hash", "varchar(255)", (cb) => cb.notNull())
        .addColumn("timestamp", "varchar(255)", (cb) => cb.notNull()),
    );
  }

  async #createLockTable(trx: Transaction<any> | Kysely<any>): Promise<void> {
    await this.#createIfNotExists(
      trx,
      trx.schema
        .createTable(this.#props.migrationLockTableName)
        .addColumn("id", "varchar(255)", (cb) => cb.primaryKey())
        .addColumn("is_locked", "integer", (cb) => cb.notNull()),
    );
  }

  async #doesTableExists(trx: Transaction<any> | Kysely<any>, tableName: string): Promise<boolean> {
    const tables = await trx.introspection.getTables({
      withInternalKyselyTables: true,
    });

    return tables.some((it) => it.name === tableName);
  }

  async #doesLockRowExists(trx: Transaction<any> | Kysely<any>): Promise<boolean> {
    const lockRow = await trx
      .selectFrom(this.#props.migrationLockTableName)
      .where("id", "=", this.#MIGRATION_LOCK_ID)
      .select("id")
      .executeTakeFirst();

    return !!lockRow;
  }

  async #createIfNotExists(trx: Transaction<any> | Kysely<any>, qb: CreateTableBuilder<any, any>): Promise<void> {
    if (trx.getExecutor().adapter.supportsCreateIfNotExists) {
      qb = qb.ifNotExists();
    }

    await qb.execute();
  }
}

interface NamedRepeatableMigration extends RepeatableMigration {
  name: string;
  exists: boolean;
}

interface RepeatableMigrationState {
  // All migrations sorted by name.
  readonly migrations: ReadonlyArray<NamedRepeatableMigration>;

  // Names of executed migrations sorted by execution timestamp
  readonly executedMigrations: ReadonlyArray<{ name: string; hash: string; timestamp: string }>;

  // Migrations that have not yet ran
  readonly pendingMigrations: ReadonlyArray<NamedRepeatableMigration>;

  // Migrations that are in the database but not in the code
  readonly unnecessaryMigrations: ReadonlyArray<{ name: string; hash: string; timestamp: string }>;
}

class RepeatableMigrationResultSetError extends Error {
  readonly #resultSet: RepeatableMigrationResultSet;

  constructor(result: RepeatableMigrationResultSet) {
    super();
    this.#resultSet = result;
  }

  get resultSet(): RepeatableMigrationResultSet {
    return this.#resultSet;
  }
}
