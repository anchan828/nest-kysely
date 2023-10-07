import { Test } from "@nestjs/testing";
import * as SQLite from "better-sqlite3";
import { randomUUID } from "crypto";
import { Generated, MysqlDialect, PostgresDialect, SqliteDialect, sql } from "kysely";
import { createPool } from "mysql2";
import { Pool } from "pg";
import { KyselyModule } from "./kysely.module";
import { KyselyService } from "./kysely.service";

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
])("KyselyService: $name", ({ name, createDialect }) => {
  it("should get service", async () => {
    const app = await Test.createTestingModule({
      imports: [
        KyselyModule.register({
          dialect: createDialect(),
        }),
      ],
    }).compile();

    const service = app.get(KyselyService);

    expect(service).toBeDefined();

    await app.close();
  });

  it("should call database", async () => {
    const app = await Test.createTestingModule({
      imports: [
        KyselyModule.register({
          dialect: createDialect(),
        }),
      ],
    }).compile();

    const service = app.get(KyselyService);
    expect(service["kysely"]).toBeDefined();
    await expect(sql`SELECT 1`.execute(service["kysely"])).resolves.toMatchObject({ rows: expect.anything() });
    await app.close();
  });

  it("should create user table", async () => {
    const app = await Test.createTestingModule({
      imports: [
        KyselyModule.register({
          dialect: createDialect(),
        }),
      ],
    }).compile();
    const service = app.get(KyselyService<{ user: { id: Generated<number>; name: string } }>);

    await service.db.schema.dropTable("user").ifExists().execute();

    switch (name) {
      case "mysql":
        await service.db.schema
          .createTable("user")
          .addColumn("id", "integer", (cb) => cb.primaryKey().autoIncrement())
          .addColumn("name", "varchar(255)", (cb) => cb.notNull())
          .execute();
        break;
      case "postgres":
        await service.db.schema
          .createTable("user")
          .addColumn("id", "serial", (cb) => cb.primaryKey())
          .addColumn("name", "varchar", (cb) => cb.notNull())
          .execute();
        break;
      case "sqlite":
        await service.db.schema
          .createTable("user")
          .addColumn("id", "integer", (cb) => cb.primaryKey().autoIncrement().notNull())
          .addColumn("name", "varchar(255)", (cb) => cb.notNull())
          .execute();
        break;
    }

    await service.db.insertInto("user").values({ name: "John" }).execute();

    await expect(service.db.selectFrom("user").selectAll().executeTakeFirst()).resolves.toEqual({
      id: 1,
      name: "John",
    });
    await service.db.schema.dropTable("user").ifExists().execute();

    await app.close();
  });

  it("should create transaction", async () => {
    const app = await Test.createTestingModule({
      imports: [
        KyselyModule.register({
          dialect: createDialect(),
        }),
      ],
    }).compile();
    const service = app.get(KyselyService<{ user: { id: string; name: string } }>);

    await service.db.schema.dropTable("user").ifExists().execute();

    switch (name) {
      case "mysql":
        await service.db.schema
          .createTable("user")
          .addColumn("id", "varchar(255)", (cb) => cb.primaryKey().notNull())
          .addColumn("name", "varchar(255)", (cb) => cb.notNull())
          .execute();
        break;
      case "postgres":
        await service.db.schema
          .createTable("user")
          .addColumn("id", "uuid", (cb) => cb.primaryKey().notNull())
          .addColumn("name", "varchar", (cb) => cb.notNull())
          .execute();
        break;
      case "sqlite":
        await service.db.schema
          .createTable("user")
          .addColumn("id", "uuid", (cb) => cb.primaryKey().notNull())
          .addColumn("name", "varchar(255)", (cb) => cb.notNull())
          .execute();
        break;
    }

    const user1Id = randomUUID();
    const user2Id = randomUUID();

    await service
      .startTransaction(async (trx) => {
        await trx.insertInto("user").values({ id: user1Id, name: "User1" }).execute();
        await trx.insertInto("user").values({ id: user2Id, name: "User2" }).execute();
        throw new Error("Rollback");
      })
      .catch(() => {});

    await expect(service.db.selectFrom("user").selectAll().execute()).resolves.toEqual([]);

    await service.startTransaction(
      async (trx) => {
        await trx.insertInto("user").values({ id: user1Id, name: "User1" }).execute();
        await trx.insertInto("user").values({ id: user2Id, name: "User2" }).execute();
      },
      { isolationLevel: "read committed" },
    );
    await expect(service.db.selectFrom("user").selectAll().execute()).resolves.toEqual(
      expect.arrayContaining([
        { id: user1Id, name: "User1" },
        { id: user2Id, name: "User2" },
      ]),
    );

    await service.db.schema.dropTable("user").ifExists().execute();
    await app.close();
  });
});
