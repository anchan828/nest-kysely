# @anchan828/nest-kysely

![npm](https://img.shields.io/npm/v/@anchan828/nest-kysely.svg)
![NPM](https://img.shields.io/npm/l/@anchan828/nest-kysely.svg)

Module for using [kysely](https://www.npmjs.com/package/kysely) with nestjs.

## Installation

```bash
$ npm i --save @anchan828/nest-kysely kysely
```

## Quick Start

### 1. Import module

```ts
import { KyselyModule } from "@anchan828/nest-kysely";
import * as SQLite from "better-sqlite3";

@Module({
  imports: [
    KyselyModule.register({
      dialect: new SqliteDialect({
        database: new SQLite(":memory:"),
      }),
    }),
  ],
})
export class AppModule {}
```

### 2. Inject KyselyService

```ts
import { KyselyService } from "@anchan828/nest-kysely";
import { Database } from "./database.type";
@Injectable()
export class ExampleService {
  constructor(readonly kysely: KyselyService<Database>) {}

  public async test(): Promise<void> {
    await this.kysely.db.selectFrom("person").where("id", "=", id).selectAll().executeTakeFirst();
  }
}
```

## Migration

If you want to do migration at module initialization time like TypeORM, use the migrations option.
This package provides some migration providers.

### KyselyMigrationClassProvider

This provider can perform migration by passing the Migration class.

```ts
import { Kysely, Migration } from "kysely";
import { KyselyMigrationClassProvider } from "@anchan828/nest-kysely";

class CreateUserTable implements Migration {
  public async up(db: Kysely<any>): Promise<void> {
    await db.schema
      .createTable("user")
      .addColumn("id", "integer", (cb) => cb.primaryKey().autoIncrement().notNull())
      .addColumn("name", "varchar(255)", (cb) => cb.notNull())
      .execute();
  }
}

@Module({
  imports: [
    KyselyModule.register({
      dialect: new SqliteDialect({
        database: new SQLite(":memory:"),
      }),
      migrations: {
        migrationsRun: true,
        migratorProps: {
          provider: new KyselyMigrationClassProvider([CreateUserTable]),
        },
      },
    }),
  ],
})
export class AppModule {}
```

### KyselyMigrationFileProvider

This provider can perform migration by passing the migrations directory path. This provider wraps the FileMigrationProvider provided by kysely and supports SQL files.

```shell
migrations
├── 1715003546247-CreateUserTable.ts
├── 1715003558664-CreateUserInsertTrigger.sql
├── 1715003568628-UpdateUserTable.sql
└── 1715003583015-CreateUserTableIndex.js
```

```ts
@Module({
  imports: [
    KyselyModule.register({
      dialect: new PostgresDialect({
        pool: new Pool({
          database: "test",
          user: "root",
          password: "root",
        }),
      }),
      migrations: {
        migrationsRun: true,
        migratorProps: {
          provider: new KyselyMigrationFileProvider({
            fs: require("fs"),
            path: require("path"),
            migrationFolder: path.join(__dirname, "migrations"),
          }),
        },
      },
    }),
  ],
})
export class AppModule {}
```

### KyselyMigrationMergeProvider

This provider can perform migration by merging multiple providers.

```ts
@Module({
  imports: [
    KyselyModule.register({
      dialect: new PostgresDialect({
        pool: new Pool({
          database: "test",
          user: "root",
          password: "root",
        }),
      }),
      migrations: {
        migrationsRun: true,
        migratorProps: {
          provider: new KyselyMigrationMergeProvider({
            providers: [
              new KyselyMigrationFileProvider({
                fs: require("fs"),
                path: require("path"),
                migrationFolder: path.join(__dirname, "migrations"),
              }),
              new KyselyMigrationClassProvider([CreateUserTable]),
            ],
          }),
        },
      },
    }),
  ],
})
export class AppModule {}
```

## Transaction

This KyselyTransactional decorator handles and propagates transactions between methods of different providers.

### Use @KyselyTransactional()

```ts
@Injectable()
class ChildService {
  constructor(private readonly kysely: KyselyService<Database>) {}

  public async ok(): Promise<void> {
    await this.kysely.db.insertInto("user").values({ name: "ChildService" }).execute();
  }
}

@Injectable()
class ParentService {
  constructor(
    private readonly child: ChildService,
    private readonly kysely: KyselyService<Database>,
  ) {}

  @KyselyTransactional()
  public async ok(): Promise<void> {
    await this.kysely.db.insertInto("user").values({ name: "ParentService" }).execute();
    await this.child.ok();
  }
}
```

### Use KyselyService

Using KyselyService.startTransaction allows you to propagate transactions.

```ts
@Injectable()
class ChildService {
  constructor(private readonly kysely: KyselyService<Database>) {}

  public async ok(): Promise<void> {
    await this.kysely.db.insertInto("user").values({ name: "ChildService" }).execute();
  }
}

@Injectable()
class ParentService {
  constructor(
    private readonly child: ChildService,
    private readonly kysely: KyselyService<Database>,
  ) {}

  public async ok(): Promise<void> {
    await this.kysely.startTransaction(() => {
      await this.kysely.db.insertInto("user").values({ name: "ParentService" }).execute();
      await this.child.ok();
    });
  }
}
```

## Use raw Kysely object

You can inject Kysely. **However, transactions using KyselyTransactional will not work.**

```ts
@Injectable()
class Service {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  public async ok(): Promise<void> {
    await this.db.insertInto("user").values({ name: "Service" }).execute();
  }
}
```

## Plugin

### RemoveNullPropertyPlugin

This plugin removes properties with null values from the result.

```json
{
  "id": 1,
  "name": "John",
  "nullableColumn": null
}
```

will be transformed to:

```json
{
  "id": 1,
  "name": "John"
}
```

## CLI

This package provides a very simple CLI for generating migration files.

```bash
$ npm exec -- nest-kysely migration:create src/migrations CreateTable
Created migration file: src/migrations/1710847324757-CreateTable.ts
```

A timestamp is automatically added to the file name and class name.

```ts
import { Kysely, Migration } from "kysely";

export class CreateTable1710847324757 implements Migration {
  public async up(db: Kysely<any>): Promise<void> {}
  public async down(db: Kysely<any>): Promise<void> {}
}
```

### Options

| Option    | Description                 | Default |
| --------- | --------------------------- | ------- |
| --type    | Type of file (ts/js/sql)    | ts      |
| --no-down | Do not generate down method | false   |

## Repeatable Migrations

This is a feature to support migrations that need to be regenerated multiple times, such as views/functions/triggers/etc. Unlike migrations that are executed only once, it compares the checksum of the SQL to be executed to determine the need for migration.

```ts
KyselyModule.register({
  dialect: createDialect(),
  repeatableMigrations: {
    migrationsRun: true,
    migratorProps: {
      provider: new KyselyRepeatableMigrationSqlFileProvider({
        sqlFiles: [resolve(__dirname, "user-view.sql")],
        sqlTexts: [{ name: "test", sql: "SELECT 1;" }],
      }),
    },
  },
});
```

| name      | hash                             | timestamp                |
| --------- | -------------------------------- | ------------------------ |
| user-view | 6c7e36422f79696602e19079534b4076 | 2024-05-11T17:04:20.211Z |
| test      | e7d6c7d4d9b1b0b4c7f5d7b3d5e9d4d4 | 2024-05-11T17:04:20.211Z |

### Note

- Once the file is renamed, the migration is executed even if the contents have not changed.
- Views/Functions/Triggers created by Repeatable Migration are not automatically deleted (or update/rename) by simply deleting the corresponding SQL, so please delete them using the normal migration function.

## Troubleshooting

### Nest can't resolve dependencies of the XXX. Please make sure that the "Symbol(KYSELY_TRANSACTIONAL_DECORATOR_SYMBOL)" property is available in the current context.

This is the error output when using the KyselyTransactional decorator without importing the KyselyModule.

## License

[MIT](LICENSE)
