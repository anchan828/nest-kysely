import { Type } from "@nestjs/common";
import { Migration, MigrationProvider } from "kysely";

export class KyselyMigrationProvider implements MigrationProvider {
  constructor(private readonly migrations: Type<Migration>[]) {}

  async getMigrations(): Promise<Record<string, Migration>> {
    return this.migrations.reduce(
      (acc, migration) => {
        if (acc[migration.name]) {
          throw new Error(`Duplicate migration name: ${migration.name}`);
        }
        const obj = new migration();
        acc[migration.name] = {
          up: obj.up.bind(obj),
          down: obj.down?.bind(obj),
        };
        return acc;
      },
      {} as Record<string, Migration>,
    );
  }
}
