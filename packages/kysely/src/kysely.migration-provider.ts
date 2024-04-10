import { Migration, MigrationProvider } from "kysely";
import { KyselyMigrationProviderOptions, MigrationClass } from "./kysely.interface";

/**
 * Provider for generating migrations from classes.
 * Migrations are executed in the order in which the classes are passed in the constructor.
 */
export class KyselyMigrationProvider implements MigrationProvider {
  constructor(
    private readonly migrations: MigrationClass[],
    private readonly options?: KyselyMigrationProviderOptions,
  ) {}

  async getMigrations(): Promise<Record<string, Migration>> {
    const uniqueNames = new Set<string>();

    for (const migration of this.migrations) {
      if (uniqueNames.has(migration.name)) {
        throw new Error(`Migration name '${migration.name}' is duplicated. Are you setting the same migration class?`);
      } else {
        uniqueNames.add(migration.name);
      }
    }

    return this.migrations.reduce(
      (acc, migration, index) => {
        const prefix = this.options?.prefixFn ? this.options.prefixFn(index) : index.toString().padStart(8, "0");
        const migrationKey = `${prefix}-${migration.name}`;
        const obj = new migration();
        acc[migrationKey] = {
          up: obj.up.bind(obj),
          down: obj.down?.bind(obj),
        };
        return acc;
      },
      {} as Record<string, Migration>,
    );
  }
}
