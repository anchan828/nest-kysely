import { Injectable } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as SQLite from "better-sqlite3";
import { Generated, MysqlDialect, PostgresDialect, SqliteDialect } from "kysely";
import { createPool } from "mysql2";
import { Pool } from "pg";
import { KYSELY_TRANSACTIONAL_DECORATOR_SYMBOL } from "./kysely.constant";
import { KyselyTransactional } from "./kysely.decorator";
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
])("KyselyTransactional: $name", ({ name, createDialect }) => {
  it("should throw error without importing module", async () => {
    class TestService {
      @KyselyTransactional()
      public async test(): Promise<string> {
        return "test";
      }
    }

    await expect(
      Test.createTestingModule({
        providers: [TestService],
      }).compile(),
    ).rejects.toThrowError("Nest can't resolve dependencies");
  });

  it("should inject kysely via decorator", async () => {
    class TestService {
      @KyselyTransactional()
      public async test(): Promise<string> {
        return "test";
      }
    }

    const app = await Test.createTestingModule({
      imports: [
        KyselyModule.register({
          dialect: createDialect(),
        }),
      ],
      providers: [TestService],
    }).compile();
    await app.init();
    const service = app.get(TestService);

    expect(service).toBeDefined();

    expect(Reflect.get(service, KYSELY_TRANSACTIONAL_DECORATOR_SYMBOL)).toBeDefined();

    await expect(service.test()).resolves.toEqual("test");

    await app.close();
  });

  it("should inject kysely via decorator (isolationLevel)", async () => {
    class TestService {
      @KyselyTransactional({ isolationLevel: "read committed" })
      public async test(): Promise<string> {
        return "test";
      }
    }

    const app = await Test.createTestingModule({
      imports: [
        KyselyModule.register({
          dialect: createDialect(),
        }),
      ],
      providers: [TestService],
    }).compile();
    await app.init();
    const service = app.get(TestService);

    expect(service).toBeDefined();

    await expect(service.test()).resolves.toEqual("test");

    await app.close();
  });

  it("should rollback transaction", async () => {
    interface Database {
      rollbackTest: {
        id: Generated<number>;
        name: string;
      };
    }

    @Injectable()
    class TestService2 {
      constructor(private readonly kysely: KyselyService<Database>) {}

      @KyselyTransactional()
      public async ok(): Promise<void> {
        await this.kysely.db.insertInto("rollbackTest").values({ name: "TestService2" }).execute();
      }

      @KyselyTransactional()
      public async error(): Promise<void> {
        await this.kysely.db.insertInto("rollbackTest").values({ name: "TestService2" }).execute();
        throw new Error("error");
      }
    }

    @Injectable()
    class TestService1 {
      constructor(
        private readonly service2: TestService2,
        private readonly kysely: KyselyService<Database>,
      ) {}

      @KyselyTransactional()
      public async ok(): Promise<void> {
        await this.kysely.db.insertInto("rollbackTest").values({ name: "TestService1" }).execute();
        await this.service2.ok();
      }

      @KyselyTransactional()
      public async error(): Promise<void> {
        await this.kysely.db.insertInto("rollbackTest").values({ name: "TestService1" }).execute();
        await this.service2.error();
      }
    }

    const app = await Test.createTestingModule({
      imports: [
        KyselyModule.register({
          dialect: createDialect(),
        }),
      ],
      providers: [TestService1, TestService2],
    }).compile();
    await app.init();
    const service = app.get(TestService1);

    const kysely = app.get(KyselyService<Database>);
    await kysely.db.schema.dropTable("rollbackTest").ifExists().execute();
    switch (name) {
      case "mysql":
        await kysely.db.schema
          .createTable("rollbackTest")
          .addColumn("id", "integer", (cb) => cb.primaryKey().autoIncrement())
          .addColumn("name", "varchar(255)", (cb) => cb.notNull())
          .execute();
        break;
      case "postgres":
        await kysely.db.schema
          .createTable("rollbackTest")
          .addColumn("id", "serial", (cb) => cb.primaryKey())
          .addColumn("name", "varchar", (cb) => cb.notNull())
          .execute();
        break;
      case "sqlite":
        await kysely.db.schema
          .createTable("rollbackTest")
          .addColumn("id", "integer", (cb) => cb.primaryKey().autoIncrement().notNull())
          .addColumn("name", "varchar(255)", (cb) => cb.notNull())
          .execute();
        break;
    }

    await expect(service.ok()).resolves.toBeUndefined();

    await expect(kysely.db.selectFrom("rollbackTest").selectAll().execute()).resolves.toEqual([
      {
        id: 1,
        name: "TestService1",
      },
      {
        id: 2,
        name: "TestService2",
      },
    ]);

    await expect(service.error()).rejects.toThrow("error");

    await expect(kysely.db.selectFrom("rollbackTest").selectAll().execute()).resolves.toEqual([
      {
        id: 1,
        name: "TestService1",
      },
      {
        id: 2,
        name: "TestService2",
      },
    ]);

    await kysely.db.schema.dropTable("rollbackTest").execute();

    await app.close();
  });
});
