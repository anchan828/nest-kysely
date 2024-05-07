import { Migration, MigrationProvider } from "kysely";
import { KyselyMigrationClassProviderOptions, MigrationClass } from "./kysely.interface";

/**
 * Provider for generating migrations from classes.
 * Migrations are executed in the order in which the classes are passed in the constructor.
 */
export class KyselyMigrationClassProvider implements MigrationProvider {
  constructor(
    private readonly migrations: MigrationClass[],
    private readonly options?: KyselyMigrationClassProviderOptions,
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
        const migrationKey = this.getMigrationKey(migration, index);
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

  private getMigrationKey(migration: MigrationClass, index: number): string {
    if (this.options?.prefixFn) {
      return `${this.options.prefixFn(index)}-${migration.name}`;
    }

    if (this.options?.useSuffixNumberAsPrefix) {
      if (migration.name.length > 500) {
        throw new Error("Migration name is too long. It should be less than 500 characters.");
      }

      const match = migration.name.match(/^(.*?)(\d+)$/);

      if (match) {
        return `${match[2]}-${match[1]}`;
      }
    }

    return `${index.toString().padStart(8, "0")}-${migration.name}`;
  }
}
