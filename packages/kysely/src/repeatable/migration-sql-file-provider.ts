import { createHash } from "crypto";
import { readFile } from "fs/promises";
import { basename } from "path";
import {
  KyselyRepeatableMigrationSqlFileProviderOptions,
  RepeatableMigration,
  RepeatableMigrationProvider,
} from "./interface";

/**
 * Provider for generating migrations from SQL file.
 */
export class KyselyRepeatableMigrationSqlFileProvider implements RepeatableMigrationProvider {
  constructor(private readonly options: KyselyRepeatableMigrationSqlFileProviderOptions) {}

  public async getMigrations(): Promise<Record<string, RepeatableMigration>> {
    const migrations: Record<string, RepeatableMigration> = {};

    const sqlFiles = this.options.sqlFiles?.filter((file) => file.endsWith(".sql")) ?? [];

    const sqlTexts = this.options.sqlTexts ?? [];

    for (const sqlFile of sqlFiles) {
      const sqlText = await readFile(sqlFile, { encoding: "utf8" });
      const baseFilename = basename(sqlFile);
      const migrationKey = baseFilename.substring(0, baseFilename.lastIndexOf("."));
      sqlTexts.push({ name: migrationKey, sql: sqlText });
    }

    for (const { name, sql } of sqlTexts) {
      migrations[name] = { sql, hash: createHash("md5").update(sql).digest("hex") };
    }

    return migrations;
  }
}
