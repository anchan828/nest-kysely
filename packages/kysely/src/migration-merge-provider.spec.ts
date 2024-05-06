import { Kysely, Migration } from "kysely";
import * as fs from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { KyselyMigrationClassProvider } from "./migration-class-provider";
import { KyselyMigrationFileProvider } from "./migration-file-provider";
import { KyselyMigrationMergeProvider } from "./migration-merge-provider";

describe("KyselyMigrationMergeProvider", () => {
  describe("getMigrations", () => {
    it("should merge migrations", async () => {
      const tmpDir = await fs.mkdtemp(path.resolve(tmpdir(), "kysely-migration-file-provider"));

      await fs.writeFile(path.resolve(tmpDir, "00000001-Migration2.sql"), "SELECT 1;");

      class Migration1 implements Migration {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        public async up(db: Kysely<any>): Promise<void> {}
      }

      const provider = new KyselyMigrationMergeProvider({
        providers: [
          new KyselyMigrationFileProvider({
            fs,
            path,
            migrationFolder: tmpDir,
          }),
          new KyselyMigrationClassProvider([Migration1]),
        ],
      });

      await expect(provider.getMigrations()).resolves.toEqual({
        "00000000-Migration1": {
          up: expect.any(Function),
        },
        "00000001-Migration2": {
          up: expect.any(Function),
        },
      });
    });
  });
});
