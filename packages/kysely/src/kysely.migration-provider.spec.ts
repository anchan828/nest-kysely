import { Kysely, Migration } from "kysely";
import { KyselyMigrationProvider } from "./kysely.migration-provider";

describe("KyselyMigrationProvider", () => {
  it("should be defined", () => {
    expect(new KyselyMigrationProvider([])).toBeDefined();
  });

  describe("getMigrations", () => {
    it("should throw error if duplicate migration name", async () => {
      class Migration1 implements Migration {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        public async up(db: Kysely<any>): Promise<void> {}
      }

      const provider = new KyselyMigrationProvider([Migration1, Migration1]);

      await expect(provider.getMigrations()).rejects.toThrow(
        "Migration name 'Migration1' is duplicated. Are you setting the same migration class?",
      );
    });

    it("should get migrations", async () => {
      class Migration1 implements Migration {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        public async up(db: Kysely<any>): Promise<void> {}
      }

      class Migration2 implements Migration {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        public async up(db: Kysely<any>): Promise<void> {}
      }

      const provider = new KyselyMigrationProvider([Migration1, Migration2]);
      await expect(provider.getMigrations()).resolves.toEqual({
        "0-Migration1": expect.anything(),
        "1-Migration2": expect.anything(),
      });
    });
  });
});
