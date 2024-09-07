# @anchan828/nest-kysely

![npm](https://img.shields.io/npm/v/@anchan828/nest-kysely.svg)
![NPM](https://img.shields.io/npm/l/@anchan828/nest-kysely.svg)

Module for using [kysely](https://www.npmjs.com/package/kysely) with nestjs.

## Installation

```bash
$ npm i --save @anchan828/nest-kysely @anchan828/kysely-migration kysely
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

If you want to perform migration at the time of application initialization, use the migrations property.

```ts
import { SqliteDialect, FileMigrationProvider } from "kysely";

@Module({
  imports: [
    KyselyModule.register({
      dialect: new SqliteDialect({
        database: new SQLite(":memory:"),
      }),
      migrations: {
        migrationsRun: true,
        migratorProps: {
          provider: new FileMigrationProvider({
            fs,
            path,
            migrationFolder: "path/to/migrations/folder",
          }),
        },
      },
    }),
  ],
})
export class AppModule {}
```

I several means to make migration easier to use. Please see the [kysely-migration](https://www.npmjs.com/package/@anchan828/kysely-migration) package for more information.

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

### Note

- Once the file is renamed, the migration is executed even if the contents have not changed.
- Views/Functions/Triggers created by Repeatable Migration are not automatically deleted (or update/rename) by simply deleting the corresponding SQL, so please delete them using the normal migration function.

## Troubleshooting

### Nest can't resolve dependencies of the XXX. Please make sure that the "Symbol(KYSELY_TRANSACTIONAL_DECORATOR_SYMBOL)" property is available in the current context.

This is the error output when using the KyselyTransactional decorator without importing the KyselyModule.

## License

[MIT](LICENSE)
