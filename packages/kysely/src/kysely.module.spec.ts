import { Test } from "@nestjs/testing";
import * as SQLite from "better-sqlite3";
import { Kysely, Migration, MysqlDialect, PostgresDialect, SqliteDialect } from "kysely";
import { createPool } from "mysql2";
import { Pool } from "pg";
import { KyselyModule } from "./kysely.module";
import { KyselyService } from "./kysely.service";
import { KyselyMigrationClassProvider } from "./migration-class-provider";
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
        database: new SQLite(":memory:"),
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
        expect.objectContaining({ name: "user" }),
      ]);

      await db.schema.dropTable("user").execute();
      await db.schema.dropTable("kysely_migration").execute();
      await db.schema.dropTable("kysely_migration_lock").execute();

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

      await app.close();
    });
  });
});
