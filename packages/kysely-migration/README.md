# @anchan828/kysely-migration

![npm](https://img.shields.io/npm/v/@anchan828/kysely-migration.svg)
![NPM](https://img.shields.io/npm/l/@anchan828/kysely-migration.svg)

Migration library for [kysely](https://www.npmjs.com/package/kysely).

## Installation

```bash
$ npm i --save kysely @anchan828/kysely-migration
```

## Quick Start

### KyselyMigrationClassProvider

This provider can perform migration by passing the Migration class.

```ts
import { Kysely, Migration } from "kysely";
import { KyselyMigrationClassProvider } from "@anchan828/kysely-migration";

class CreateUserTable implements Migration {
  public async up(db: Kysely<any>): Promise<void> {
    await db.schema
      .createTable("user")
      .addColumn("id", "integer", (cb) => cb.primaryKey().autoIncrement().notNull())
      .addColumn("name", "varchar(255)", (cb) => cb.notNull())
      .execute();
  }
}

const provider = new KyselyMigrationClassProvider([CreateUserTable]);

await new Migrator({ db, provider }).migrateToLatest();
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
const provider = new KyselyMigrationFileProvider({
  fs: require("fs"),
  path: require("path"),
  migrationFolder: path.join(__dirname, "migrations"),
});

await new Migrator({ db, provider }).migrateToLatest();
```

### KyselyMigrationMergeProvider

This provider can perform migration by merging multiple providers.

```ts
const provider = new KyselyMigrationMergeProvider({
  providers: [
    new KyselyMigrationFileProvider({
      fs: require("fs"),
      path: require("path"),
      migrationFolder: path.join(__dirname, "migrations"),
    }),
    new KyselyMigrationClassProvider([CreateUserTable]),
  ],
});

await new Migrator({ db, provider }).migrateToLatest();
```

## Repeatable Migrations

This is a feature to support migrations that need to be regenerated multiple times, such as views/functions/triggers/etc. Unlike migrations that are executed only once, it compares the checksum of the SQL to be executed to determine the need for migration.

```ts
import { KyselyRepeatableMigrationSqlFileProvider, RepeatableMigrator } from "@anchan828/kysely-migration";
const provider = new KyselyRepeatableMigrationSqlFileProvider({
  sqlFiles: [resolve(__dirname, "user-view.sql")],
  sqlTexts: [{ name: "test", sql: "SELECT 1;" }],
});

await new RepeatableMigrator({ db, provider }).migrateToLatest();
```

| name      | hash                             | timestamp                |
| --------- | -------------------------------- | ------------------------ |
| user-view | 6c7e36422f79696602e19079534b4076 | 2024-05-11T17:04:20.211Z |
| test      | e7d6c7d4d9b1b0b4c7f5d7b3d5e9d4d4 | 2024-05-11T17:04:20.211Z |

### Note

- Once the file is renamed, the migration is executed even if the contents have not changed.
- Views/Functions/Triggers created by Repeatable Migration are not automatically deleted (or update/rename) by simply deleting the corresponding SQL, so please delete them using the normal migration function.

## License

[MIT](LICENSE)
