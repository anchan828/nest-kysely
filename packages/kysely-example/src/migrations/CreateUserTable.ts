import { Logger } from "@nestjs/common";
import { Kysely, Migration, sql } from "kysely";

export class CreateUserTable implements Migration {
  public async up(db: Kysely<any>): Promise<void> {
    await db.schema
      .createTable("user")
      .addColumn("id", "varchar(36)", (cb) => cb.primaryKey().notNull())
      .addColumn("name", "varchar(255)", (cb) => cb.notNull())
      .addCheckConstraint("user_id_length", sql`CHAR_LENGTH(id) = 36`)
      .execute();

    Logger.debug("CreateUserTable migration completed", "KyselyMigrator");
  }
}
