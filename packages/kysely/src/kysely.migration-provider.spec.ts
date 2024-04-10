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
      const migrationClasses = Array(11)
        .fill(0)
        .map((_, i) => {
          const MigrationClass = class implements Migration {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            public async up(db: Kysely<any>): Promise<void> {}
          };
          Object.defineProperty(MigrationClass, "name", { value: `Migration${i}` });
          return MigrationClass;
        });

      const provider = new KyselyMigrationProvider(migrationClasses);
      await expect(provider.getMigrations()).resolves.toStrictEqual({
        "00000000-Migration0": expect.anything(),
        "00000001-Migration1": expect.anything(),
        "00000002-Migration2": expect.anything(),
        "00000003-Migration3": expect.anything(),
        "00000004-Migration4": expect.anything(),
        "00000005-Migration5": expect.anything(),
        "00000006-Migration6": expect.anything(),
        "00000007-Migration7": expect.anything(),
        "00000008-Migration8": expect.anything(),
        "00000009-Migration9": expect.anything(),
        "00000010-Migration10": expect.anything(),
      });
    });

    it("should get migrations (custom prefix)", async () => {
      const migrationClasses = Array(11)
        .fill(0)
        .map((_, i) => {
          const MigrationClass = class implements Migration {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            public async up(db: Kysely<any>): Promise<void> {}
          };
          Object.defineProperty(MigrationClass, "name", { value: `Migration${i}` });
          return MigrationClass;
        });

      const provider = new KyselyMigrationProvider(migrationClasses, {
        prefixFn: (index) => {
          if (index <= 9) {
            return index.toString();
          }
          return `9${index}`.padEnd(8, "0");
        },
      });
      await expect(provider.getMigrations()).resolves.toStrictEqual({
        "0-Migration0": expect.anything(),
        "1-Migration1": expect.anything(),
        "2-Migration2": expect.anything(),
        "3-Migration3": expect.anything(),
        "4-Migration4": expect.anything(),
        "5-Migration5": expect.anything(),
        "6-Migration6": expect.anything(),
        "7-Migration7": expect.anything(),
        "8-Migration8": expect.anything(),
        "9-Migration9": expect.anything(),
        "91000000-Migration10": expect.anything(),
      });
    });
  });
});
