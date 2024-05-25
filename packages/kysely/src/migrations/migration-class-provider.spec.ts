import { Kysely, Migration } from "kysely";
import { KyselyMigrationClassProvider } from "./migration-class-provider";

describe("KyselyMigrationProvider", () => {
  it("should be defined", () => {
    expect(new KyselyMigrationClassProvider([])).toBeDefined();
  });

  describe("getMigrations", () => {
    it("should throw error if duplicate migration name", async () => {
      class Migration1 implements Migration {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        public async up(db: Kysely<any>): Promise<void> {}
      }

      const provider = new KyselyMigrationClassProvider([Migration1, Migration1]);

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

      const provider = new KyselyMigrationClassProvider(migrationClasses);
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
      const migrationClasses = Array(21)
        .fill(0)
        .map((_, i) => {
          const MigrationClass = class implements Migration {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            public async up(db: Kysely<any>): Promise<void> {}
          };
          Object.defineProperty(MigrationClass, "name", { value: `Migration${i}` });
          return MigrationClass;
        });

      const provider = new KyselyMigrationClassProvider(migrationClasses, {
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
        "91100000-Migration11": expect.anything(),
        "91200000-Migration12": expect.anything(),
        "91300000-Migration13": expect.anything(),
        "91400000-Migration14": expect.anything(),
        "91500000-Migration15": expect.anything(),
        "91600000-Migration16": expect.anything(),
        "91700000-Migration17": expect.anything(),
        "91800000-Migration18": expect.anything(),
        "91900000-Migration19": expect.anything(),
        "92000000-Migration20": expect.anything(),
      });
    });

    it("should get migrations (useSuffixNumberAsPrefix)", async () => {
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

      const provider = new KyselyMigrationClassProvider(migrationClasses, { useSuffixNumberAsPrefix: true });
      await expect(provider.getMigrations()).resolves.toStrictEqual({
        "0-Migration": expect.anything(),
        "1-Migration": expect.anything(),
        "2-Migration": expect.anything(),
        "3-Migration": expect.anything(),
        "4-Migration": expect.anything(),
        "5-Migration": expect.anything(),
        "6-Migration": expect.anything(),
        "7-Migration": expect.anything(),
        "8-Migration": expect.anything(),
        "9-Migration": expect.anything(),
        "10-Migration": expect.anything(),
      });
    });
  });
});
