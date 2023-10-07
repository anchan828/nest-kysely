import { KyselyMigrationProvider, KyselyModule } from "@anchan828/nest-kysely";
import { Module } from "@nestjs/common";
import * as SQLite from "better-sqlite3";
import { SqliteDialect } from "kysely";
import { migrations } from "./migrations";
import { UserModule } from "./user/user.module";

@Module({
  imports: [
    KyselyModule.register({
      dialect: new SqliteDialect({
        database: async () => new SQLite(":memory:"),
      }),
      migrations: {
        migrationsRun: true,
        throwMigrationError: true,
        migratorProps: {
          provider: new KyselyMigrationProvider(migrations),
        },
      },
    }),
    UserModule,
  ],
})
export class AppModule {}
