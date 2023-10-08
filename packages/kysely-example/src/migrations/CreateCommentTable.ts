import { Logger } from "@nestjs/common";
import { Kysely, Migration } from "kysely";

export class CreateCommentTable implements Migration {
  public async up(db: Kysely<any>): Promise<void> {
    await db.schema
      .createTable("comment")
      .addColumn("id", "varchar(255)", (col) => col.primaryKey().notNull())
      .addColumn("comment", "varchar(255)", (col) => col.notNull())
      .addColumn("createdById", "varchar(255)", (col) => col.references("user.id").notNull())
      .addColumn("createdAt", "datetime(6)", (col) => col.notNull())
      .addForeignKeyConstraint("commentCreatedByIdFK", ["createdById"], "user", ["id"])
      .execute();

    Logger.debug("CreateCommentTable migration completed", "KyselyMigrator");
  }
}
