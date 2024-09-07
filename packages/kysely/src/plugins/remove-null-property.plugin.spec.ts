import { KyselyMigrationClassProvider } from "@anchan828/kysely-migration";
import { Test, TestingModule } from "@nestjs/testing";
import * as SQLite from "better-sqlite3";
import { Generated, Kysely, Migration, MysqlDialect, PostgresDialect, SqliteDialect } from "kysely";
import { createPool } from "mysql2";
import { Pool } from "pg";
import { KyselyModule } from "../kysely.module";
import { KyselyService } from "../kysely.service";
import { RemoveNullPropertyPlugin } from "./remove-null-property.plugin";
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
])("RemoveNullPropertyPlugin: $name", ({ name, createDialect }) => {
  let app: TestingModule;

  beforeAll(async () => {
    class Migration1 implements Migration {
      public async up(db: Kysely<any>): Promise<void> {
        switch (name) {
          case "mysql":
            await db.schema
              .createTable("user")
              .addColumn("id", "integer", (cb) => cb.primaryKey().autoIncrement())
              .addColumn("name", "varchar(255)", (cb) => cb.notNull())
              .addColumn("nullableColumn", "varchar(255)")
              .execute();
            break;
          case "postgres":
            await db.schema
              .createTable("user")
              .addColumn("id", "serial", (cb) => cb.primaryKey())
              .addColumn("name", "varchar", (cb) => cb.notNull())
              .addColumn("nullableColumn", "varchar")
              .execute();
            break;
          case "sqlite":
            await db.schema
              .createTable("user")
              .addColumn("id", "integer", (cb) => cb.primaryKey().autoIncrement().notNull())
              .addColumn("name", "varchar(255)", (cb) => cb.notNull())
              .addColumn("nullableColumn", "varchar(255)")
              .execute();
            break;
        }
      }
    }

    app = await Test.createTestingModule({
      imports: [
        KyselyModule.register({
          dialect: createDialect(),
          migrations: {
            migrationsRun: true,
            migratorProps: {
              provider: new KyselyMigrationClassProvider([Migration1]),
            },
          },
          plugins: [new RemoveNullPropertyPlugin()],
        }),
      ],
    }).compile();

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should remove nullableColumn property", async () => {
    const service = app.get<
      KyselyService<{
        user: { id: Generated<number>; name: string; nullableColumn?: string };
      }>
    >(KyselyService);

    await service.db.insertInto("user").values({ name: "test" }).execute();
    const result = await service.db
      .selectFrom("user")
      .where("id", "=", 1)
      .select(["id", "name", "nullableColumn as check/nested.value"])
      .executeTakeFirst();
    expect(result).toEqual({ id: 1, name: "test" });
  });
});
