import { KyselyMigrationClassProvider, KyselyModule } from "@anchan828/nest-kysely";
import { Module } from "@nestjs/common";
import { MysqlDialect } from "kysely";
import { createPool } from "mysql2";
import { CommentModule } from "./comment/comment.module";
import { migrations } from "./migrations";
import { UserModule } from "./user/user.module";

@Module({
  imports: [
    KyselyModule.register({
      dialect: new MysqlDialect({
        pool: async () =>
          createPool({
            database: "test",
            host: "localhost",
            user: "root",
            password: "root",
            port: 3307,
          }),
      }),
      migrations: {
        migrationsRun: true,
        throwMigrationError: true,
        migratorProps: {
          provider: new KyselyMigrationClassProvider(migrations),
        },
      },
    }),
    UserModule,
    CommentModule,
  ],
})
export class AppModule {}
