import { Logger } from "@nestjs/common";
import { Kysely, Migration } from "kysely";

export class CreateUserRoleTable implements Migration {
  public async up(db: Kysely<any>): Promise<void> {
    await db.schema
      .createTable("userRole")
      .addColumn("userId", "varchar(36)", (cb) => cb.primaryKey().notNull())
      .addColumn("role", "varchar(255)", (cb) => cb.notNull())
      .addForeignKeyConstraint("userRole_createdById_FK", ["userId"], "user", ["id"])
      .execute();

    Logger.debug("CreateUserRoleTable migration completed", "KyselyMigrator");
  }
}
