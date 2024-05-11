import * as SQLite from "better-sqlite3";
import { writeFileSync } from "fs";
import { Kysely, MysqlDialect, PostgresDialect, SqliteDialect } from "kysely";
import { createPool } from "mysql2";
import { tmpdir } from "os";
import { resolve } from "path";
import { Pool } from "pg";
import { KyselyRepeatableMigrationSqlFileProvider } from "./migration-sql-file-provider";
import { RepeatableMigrator } from "./migrator";
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
])("RepeatableMigrator: $name", ({ name, createDialect }) => {
  let db: Kysely<any>;
  beforeEach(() => {
    db = new Kysely<any>({ dialect: createDialect() });
  });

  afterEach(async () => {
    await db.schema.dropTable("kysely_repeatable_migration").execute();
    await db.schema.dropTable("kysely_repeatable_migration_lock").execute();
    await db.destroy();
  });

  it("should create migration tables", async () => {
    const migrator = new RepeatableMigrator({ db, provider: new KyselyRepeatableMigrationSqlFileProvider({}) });

    await migrator.runMigrations();

    await expect(db.introspection.getTables({ withInternalKyselyTables: true })).resolves.toMatchObject([
      expect.objectContaining({ name: "kysely_repeatable_migration" }),
      expect.objectContaining({ name: "kysely_repeatable_migration_lock" }),
    ]);
  });

  it("should run migrations", async () => {
    const migrator = new RepeatableMigrator({
      db,
      provider: new KyselyRepeatableMigrationSqlFileProvider({
        sqlTexts: [{ name: "test", sql: "SELECT 1;" }],
      }),
    });

    await migrator.runMigrations();

    await expect(db.selectFrom("kysely_repeatable_migration").selectAll().execute()).resolves.toEqual([
      {
        name: "test",
        hash: "71568061b2970a4b7c5160fe75356e10",
        timestamp: expect.any(String),
      },
    ]);
  });

  it("should not run same migrations", async () => {
    const migrator = new RepeatableMigrator({
      db,
      provider: new KyselyRepeatableMigrationSqlFileProvider({
        sqlTexts: [{ name: "test", sql: "SELECT 1;" }],
      }),
    });

    await migrator.runMigrations();

    const executedMigrations = await migrator.getMigrations();

    await migrator.runMigrations();

    const executedMigrations2 = await migrator.getMigrations();

    expect(executedMigrations).toEqual(executedMigrations2);
  });

  it("should update migration", async () => {
    const sqlFile = resolve(tmpdir(), `${name}-test.sql`);
    writeFileSync(sqlFile, "SELECT 1;");
    let migrator = new RepeatableMigrator({
      db,
      provider: new KyselyRepeatableMigrationSqlFileProvider({
        sqlFiles: [sqlFile],
        sqlTexts: [{ name: "test", sql: "SELECT 1;" }],
      }),
    });

    await expect(migrator.getMigrations()).resolves.toEqual([
      {
        executed: undefined,
        hash: "71568061b2970a4b7c5160fe75356e10",
        name: `${name}-test`,
        sql: "SELECT 1;",
      },
      {
        executed: undefined,
        hash: "71568061b2970a4b7c5160fe75356e10",
        name: "test",
        sql: "SELECT 1;",
      },
    ]);

    await expect(migrator.runMigrations()).resolves.toEqual({
      results: [
        {
          migrationHash: "71568061b2970a4b7c5160fe75356e10",
          migrationName: `${name}-test`,
          status: "Success",
        },
        {
          migrationHash: "71568061b2970a4b7c5160fe75356e10",
          migrationName: "test",
          status: "Success",
        },
      ],
    });

    await expect(migrator.getMigrations()).resolves.toEqual([
      {
        executed: expect.any(Date),
        hash: "71568061b2970a4b7c5160fe75356e10",
        name: `${name}-test`,
        sql: "SELECT 1;",
      },
      {
        executed: expect.any(Date),
        hash: "71568061b2970a4b7c5160fe75356e10",
        name: "test",
        sql: "SELECT 1;",
      },
    ]);

    migrator = new RepeatableMigrator({
      db,
      provider: new KyselyRepeatableMigrationSqlFileProvider({
        sqlTexts: [{ name: "test", sql: "SELECT 2;" }],
      }),
    });

    await expect(migrator.getMigrations()).resolves.toEqual([
      {
        executed: undefined,
        hash: "6c7e36422f79696602e19079534b4076",
        name: "test",
        sql: "SELECT 2;",
      },
    ]);

    await expect(migrator.runMigrations()).resolves.toEqual({
      results: [
        {
          migrationHash: "71568061b2970a4b7c5160fe75356e10",
          migrationName: `${name}-test`,
          status: "Deleted",
        },
        {
          migrationHash: "6c7e36422f79696602e19079534b4076",
          migrationName: "test",
          status: "Success",
        },
      ],
    });

    await expect(db.selectFrom("kysely_repeatable_migration").selectAll().execute()).resolves.toEqual([
      {
        name: "test",
        hash: "6c7e36422f79696602e19079534b4076",
        timestamp: expect.any(String),
      },
    ]);
  });

  it("should delete old migration", async () => {
    const sqlFile = resolve(tmpdir(), `${name}-test.sql`);
    writeFileSync(sqlFile, "SELECT 1;");
    let migrator = new RepeatableMigrator({
      db,
      provider: new KyselyRepeatableMigrationSqlFileProvider({
        sqlTexts: [{ name: "test", sql: "SELECT 1;" }],
      }),
    });

    await expect(migrator.getMigrations()).resolves.toEqual([
      {
        executed: undefined,
        hash: "71568061b2970a4b7c5160fe75356e10",
        name: "test",
        sql: "SELECT 1;",
      },
    ]);

    await expect(migrator.runMigrations()).resolves.toEqual({
      results: [
        {
          migrationHash: "71568061b2970a4b7c5160fe75356e10",
          migrationName: "test",
          status: "Success",
        },
      ],
    });

    await expect(migrator.getMigrations()).resolves.toEqual([
      {
        executed: expect.any(Date),
        hash: "71568061b2970a4b7c5160fe75356e10",
        name: "test",
        sql: "SELECT 1;",
      },
    ]);

    migrator = new RepeatableMigrator({
      db,
      provider: new KyselyRepeatableMigrationSqlFileProvider({
        sqlTexts: [{ name: "test2", sql: "SELECT 2;" }],
      }),
    });

    await expect(migrator.getMigrations()).resolves.toEqual([
      {
        executed: undefined,
        hash: "6c7e36422f79696602e19079534b4076",
        name: "test2",
        sql: "SELECT 2;",
      },
    ]);

    await expect(migrator.runMigrations()).resolves.toEqual({
      results: [
        {
          migrationHash: "71568061b2970a4b7c5160fe75356e10",
          migrationName: "test",
          status: "Deleted",
        },
        {
          migrationHash: "6c7e36422f79696602e19079534b4076",
          migrationName: "test2",
          status: "Success",
        },
      ],
    });

    await expect(db.selectFrom("kysely_repeatable_migration").selectAll().execute()).resolves.toEqual([
      {
        name: "test2",
        hash: "6c7e36422f79696602e19079534b4076",
        timestamp: expect.any(String),
      },
    ]);
  });
});
