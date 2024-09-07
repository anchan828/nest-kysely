import { Migration, MigrationProvider } from "kysely";
import { KyselyMigrationMergeProviderOptions } from "./interfaces";

/**
 * Provider for merging migrations from multiple providers.
 */
export class KyselyMigrationMergeProvider implements MigrationProvider {
  constructor(private readonly options: KyselyMigrationMergeProviderOptions) {}

  public async getMigrations(): Promise<Record<string, Migration>> {
    const merged: Record<string, Migration> = {};

    for (const provider of this.options.providers) {
      const migrations = await provider.getMigrations();
      for (const key in migrations) {
        merged[key] = migrations[key];
      }
    }

    return merged;
  }
}
