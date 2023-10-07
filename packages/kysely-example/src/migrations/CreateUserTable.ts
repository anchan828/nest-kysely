import { Logger } from "@nestjs/common";
import { Kysely, Migration } from "kysely";

export class CreateUserTable implements Migration {
  public async up(db: Kysely<any>): Promise<void> {
    await db.schema
      .createTable("user")
      .addColumn("id", "uuid", (cb) => cb.primaryKey().notNull())
      .addColumn("name", "varchar(255)", (cb) => cb.notNull())
      .execute();

    Logger.debug("CreateUserTable migration completed", "KyselyMigration");
  }
}
