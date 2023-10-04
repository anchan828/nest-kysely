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
      dialect: new SQLite(":memory:"),
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
This package provides KyselyMigrationProvider. This provider can perform migration by passing the Migration class. Of course, you can also use FileMigrationProvider.

```ts
import { Kysely, Migration } from "kysely";
import { KyselyMigrationProvider } from "@anchan828/nest-kysely";

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
      dialect: new SQLite(":memory:"),
      migrations: {
        migrationsRun: true,
        migratorProps: {
          provider: new KyselyMigrationProvider([CreateUserTable]),
        },
      },
    }),
  ],
})
export class AppModule {}
```

## Transaction

This KyselyTransactional decorator handles and propagates transactions between methods of different providers.

```ts
@Injectable()
class ChildService {
  constructor(private readonly kysely: KyselyService<Database>) {}

  @KyselyTransactional()
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

## Use raw Kysely object

You can inject Kysely. **However, transactions using KyselyTransactional will not work.**

```ts
@Injectable()
class Service {
  constructor(private readonly db: Kysely<Database>) {}

  public async ok(): Promise<void> {
    await this.db.insertInto("user").values({ name: "Service" }).execute();
  }
}
```

## Troubleshooting

### Nest can't resolve dependencies of the XXX. Please make sure that the "Symbol(KYSELY_TRANSACTIONAL_DECORATOR_SYMBOL)" property is available in the current context.

This is the error output when using the KyselyTransactional decorator without importing the KyselyModule.

## License

[MIT](LICENSE)
