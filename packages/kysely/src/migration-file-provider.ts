import { FileMigrationProvider, Migration, MigrationProvider, sql } from "kysely";
import { KyselyMigrationFileProviderOptions } from "./kysely.interface";

/**
 * Provider for generating migrations from TS/JS and SQL file.
 * The SQL file does not support the `down` function.
 */
export class KyselyMigrationFileProvider implements MigrationProvider {
  #fileProvider: FileMigrationProvider;

  constructor(private readonly options: KyselyMigrationFileProviderOptions) {
    this.#fileProvider = new FileMigrationProvider(options);
  }

  public async getMigrations(): Promise<Record<string, Migration>> {
    const migrations: Record<string, Migration> = await this.#fileProvider.getMigrations();
    const files = await this.options.fs.readdir(this.options.migrationFolder);

    for (const fileName of files) {
      if (!fileName.endsWith(".sql")) {
        continue;
      }

      const migration = await this.options.fs
        .readFile(this.options.path.join(this.options.migrationFolder, fileName))
        .then((buffer) => buffer.toString());

      const migrationKey = fileName.substring(0, fileName.lastIndexOf("."));

      migrations[migrationKey] = {
        up: async (db) => {
          await sql.raw(migration).execute(db);
        },
      };
    }

    return migrations;
  }
}
