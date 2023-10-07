import { Migration, MigrationProvider } from "kysely";
import { MigrationClass } from "./kysely.interface";

/**
 * Provider for generating migrations from classes.
 * Migrations are executed in the order in which the classes are passed in the constructor.
 */
export class KyselyMigrationProvider implements MigrationProvider {
  constructor(private readonly migrations: MigrationClass[]) {}

  async getMigrations(): Promise<Record<string, Migration>> {
    const uniqueNames = new Set<string>();

    return this.migrations.reduce(
      (acc, migration, index) => {
        if (uniqueNames.has(migration.name)) {
          throw new Error(
            `Migration name '${migration.name}' is duplicated. Are you setting the same migration class?`,
          );
        } else {
          uniqueNames.add(migration.name);
        }

        const migrationKey = `${index}-${migration.name}`;
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
