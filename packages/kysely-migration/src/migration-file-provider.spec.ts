import * as fs from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { KyselyMigrationFileProvider } from "./migration-file-provider";
describe("KyselyMigrationFileProvider", () => {
  describe("getMigrations", () => {
    it("should get migrations (sql)", async () => {
      const tmpDir = await fs.mkdtemp(path.resolve(tmpdir(), "kysely-migration-file-provider"));

      await fs.writeFile(path.resolve(tmpDir, "00000000-migration.sql"), "SELECT 1;");
      const provider = new KyselyMigrationFileProvider({
        fs,
        path,
        migrationFolder: tmpDir,
      });

      await expect(provider.getMigrations()).resolves.toEqual({
        "00000000-migration": {
          up: expect.any(Function),
        },
      });
    });
  });
});
