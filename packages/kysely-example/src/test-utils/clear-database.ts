import { KyselyService } from "@anchan828/nest-kysely";
import { INestApplication } from "@nestjs/common";
import { sql } from "kysely";

export async function clearDatabase(app: INestApplication) {
  const db = app.get(KyselyService).db;
  const tables = await sql`SHOW TABLES`.$castTo<{ Tables_in_test: string }>().execute(db);
  await sql`DROP TABLE ${sql.join(tables.rows.map((row) => sql.table(row.Tables_in_test)))}`.execute(db);
}
