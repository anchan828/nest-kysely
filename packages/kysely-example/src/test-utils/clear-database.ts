import { KyselyService } from "@anchan828/nest-kysely";
import { INestApplication } from "@nestjs/common";
import { sql } from "kysely";

export async function clearDatabase(app: INestApplication) {
  const db = app.get(KyselyService).db;
  const tables = await sql`SHOW TABLES`.$castTo<{ Tables_in_test: string }>().execute(db);
  for (const tableRow of tables.rows) {
    const tableName = tableRow["Tables_in_test"];
    await sql`DROP TABLE ${sql.table(tableName)}`.execute(db);
  }
}
