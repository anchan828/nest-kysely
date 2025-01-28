import {
  KyselyMigrationClassProvider,
  KyselyMigrationFileProvider,
  KyselyRepeatableMigrationSqlFileProvider,
} from "@anchan828/kysely-migration";
import { Test } from "@nestjs/testing";
import * as SQLite from "better-sqlite3";
import { mkdtempSync, writeFileSync } from "fs";
import * as fsPromises from "fs/promises";
import { Kysely, Migration, MysqlDialect, PostgresDialect, SqliteDialect } from "kysely";
import { createPool } from "mysql2";
import { randomUUID } from "node:crypto";
import { tmpdir } from "os";
import * as path from "path";
import { resolve } from "path";
import { Pool } from "pg";
import { KyselyModule } from "./kysely.module";
import { KyselyService } from "./kysely.service";

const sqliteFilePath = resolve(tmpdir(), "kysely-sqlite-" + randomUUID() + ".db");

describe.each([
  {
    name: "mysql",
    createDialect: () =>
      new MysqlDialect({
        pool: createPool({
          database: "test",
          user: "root",
          password: "root",
        }),
      }),
  },
  {
    name: "postgres",
    createDialect: () =>
      new PostgresDialect({
        pool: new Pool({
          database: "test",
          user: "root",
          password: "root",
        }),
      }),
  },
  {
    name: "sqlite",
    createDialect: () =>
      new SqliteDialect({
        database: new SQLite(sqliteFilePath),
      }),
  },
])("KyselyModule: $name", ({ name, createDialect }) => {
  it("should be defined", async () => {
    const app = await Test.createTestingModule({
      imports: [
        KyselyModule.register({
          dialect: createDialect(),
        }),
      ],
    }).compile();
    expect(app).toBeDefined();

    await app.close();
  });

  describe("migration", () => {
    it("should be migrated", async () => {
      class Migration1 implements Migration {
        public async up(db: Kysely<any>): Promise<void> {
          switch (name) {
            case "mysql":
              await db.schema
                .createTable("user")
                .addColumn("id", "integer", (cb) => cb.primaryKey().autoIncrement())
                .addColumn("name", "varchar(255)", (cb) => cb.notNull())
                .execute();
              break;
            case "postgres":
              await db.schema
                .createTable("user")
                .addColumn("id", "serial", (cb) => cb.primaryKey())
                .addColumn("name", "varchar", (cb) => cb.notNull())
                .execute();
              break;
            case "sqlite":
              await db.schema
                .createTable("user")
                .addColumn("id", "integer", (cb) => cb.primaryKey().autoIncrement().notNull())
                .addColumn("name", "varchar(255)", (cb) => cb.notNull())
                .execute();
              break;
          }
        }
      }

      const migrateResultMock = jest.fn();
      const repeatableMigrateResultMock = jest.fn();

      const app = await Test.createTestingModule({
        imports: [
          KyselyModule.register({
            dialect: createDialect(),
            migrations: {
              migrationsRun: true,
              migratorProps: {
                provider: new KyselyMigrationClassProvider([Migration1]),
              },
              migrateResult: migrateResultMock,
            },
            repeatableMigrations: {
              migrationsRun: true,
              migratorProps: {
                provider: new KyselyRepeatableMigrationSqlFileProvider({
                  sqlTexts: [{ name: "test", sql: "SELECT 1;" }],
                }),
              },
              migrateResult: repeatableMigrateResultMock,
            },
          }),
        ],
      }).compile();
      await app.init();
      const db = app.get(KyselyService).db;

      await expect(db.introspection.getTables({ withInternalKyselyTables: true })).resolves.toMatchObject([
        expect.objectContaining({ name: "kysely_migration" }),
        expect.objectContaining({ name: "kysely_migration_lock" }),
        expect.objectContaining({ name: "kysely_repeatable_migration" }),
        expect.objectContaining({ name: "kysely_repeatable_migration_lock" }),
        expect.objectContaining({ name: "user" }),
      ]);

      expect(migrateResultMock.mock.calls).toEqual([
        [
          {
            results: [
              {
                direction: "Up",
                migrationName: "00000000-Migration1",
                status: "Success",
              },
            ],
          },
        ],
      ]);
      expect(repeatableMigrateResultMock.mock.calls).toEqual([
        [
          {
            results: [
              {
                migrationHash: "71568061b2970a4b7c5160fe75356e10",
                migrationName: "test",
                status: "Success",
              },
            ],
          },
        ],
      ]);

      await db.schema.dropTable("user").execute();
      await db.schema.dropTable("kysely_migration").execute();
      await db.schema.dropTable("kysely_migration_lock").execute();
      await db.schema.dropTable("kysely_repeatable_migration").execute();
      await db.schema.dropTable("kysely_repeatable_migration_lock").execute();

      await app.close();
    });

    it("should fail migrate (not throw error)", async () => {
      class Migration1 implements Migration {
        public async up(): Promise<void> {
          throw new Error("Migration failed");
        }
      }
      const app = await Test.createTestingModule({
        imports: [
          KyselyModule.register({
            dialect: createDialect(),
            migrations: {
              migrationsRun: true,
              migratorProps: {
                provider: new KyselyMigrationClassProvider([Migration1]),
              },
            },
          }),
        ],
      }).compile();
      await app.init();
      const db = app.get(KyselyService).db;
      await expect(db.introspection.getTables({ withInternalKyselyTables: true })).resolves.toMatchObject([
        expect.objectContaining({ name: "kysely_migration" }),
        expect.objectContaining({ name: "kysely_migration_lock" }),
      ]);

      await db.schema.dropTable("kysely_migration").execute();
      await db.schema.dropTable("kysely_migration_lock").execute();

      await app.close();
    });

    it("should fail migrate (throw error)", async () => {
      class Migration1 implements Migration {
        public async up(): Promise<void> {
          throw new Error("Migration failed");
        }
      }
      const app = await Test.createTestingModule({
        imports: [
          KyselyModule.register({
            dialect: createDialect(),
            migrations: {
              migrationsRun: true,
              migratorProps: {
                provider: new KyselyMigrationClassProvider([Migration1]),
              },
              throwMigrationError: true,
            },
          }),
        ],
      }).compile();
      await expect(app.init()).rejects.toThrowError("Migration failed");

      const db = app.get(KyselyService).db;
      await db.schema.dropTable("kysely_migration").execute();
      await db.schema.dropTable("kysely_migration_lock").execute();
      await db.destroy();
    });

    it("should use migrationDialect", async () => {
      const migrationDialect = createDialect();
      const driverSpy = jest.spyOn(migrationDialect, "createDriver");

      class Migration1 implements Migration {
        public async up(): Promise<void> {}
      }
      const app = await Test.createTestingModule({
        imports: [
          KyselyModule.register({
            dialect: createDialect(),
            migrationDialect,
            migrations: {
              migrationsRun: true,
              migratorProps: {
                provider: new KyselyMigrationClassProvider([Migration1]),
              },
            },
          }),
        ],
      }).compile();

      await app.init();

      expect(driverSpy).toHaveBeenCalledTimes(1);

      const db = app.get(KyselyService).db;
      await db.schema.dropTable("kysely_migration").execute();
      await db.schema.dropTable("kysely_migration_lock").execute();

      await app.close();
    });
  });

  describe("migrationBefore / migrationAfter ", () => {
    it("should run migrationBefore / migrationAfter", async () => {
      const reRunnableMigrationDir = mkdtempSync(resolve(tmpdir(), "kysely-re-runnable-migration-"));

      writeFileSync(resolve(reRunnableMigrationDir, "test.sql"), "SELECT 1;");
      const migrateBeforeMock = jest.fn();
      const migrateAfterMock = jest.fn();
      const app = await Test.createTestingModule({
        imports: [
          KyselyModule.register({
            dialect: createDialect(),

            migrations: {
              migrationsRun: true,
              migratorProps: {
                provider: new KyselyMigrationFileProvider({
                  fs: fsPromises,
                  path,
                  migrationFolder: reRunnableMigrationDir,
                }),
              },
              migrateBefore: migrateBeforeMock,
              migrateAfter: migrateAfterMock,
            },
          }),
        ],
      }).compile();
      await app.init();

      expect(migrateBeforeMock).toHaveBeenCalledTimes(1);
      expect(migrateAfterMock).toHaveBeenCalledTimes(1);
      const db = app.get(KyselyService).db;
      await db.schema.dropTable("kysely_migration").execute();
      await db.schema.dropTable("kysely_migration_lock").execute();
      await app.close();
    });
  });
});
