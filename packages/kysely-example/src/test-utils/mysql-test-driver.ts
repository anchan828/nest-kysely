import { DeepMockProxy, mockDeep } from "jest-mock-extended";
import {
  CompiledQuery,
  DatabaseConnection,
  DatabaseIntrospector,
  Dialect,
  DialectAdapter,
  Driver,
  Kysely,
  MysqlAdapter,
  MysqlIntrospector,
  MysqlQueryCompiler,
  QueryCompiler,
  TransactionSettings,
} from "kysely";

/**
 * This is for verifying queries without communicating with the database by mocking the driver class and connection class in a jest test.
 */
export class MysqlTestDialect implements Dialect {
  public connection: DeepMockProxy<DatabaseConnection> = mockDeep<DatabaseConnection>();

  public createDriver(): DeepMockProxy<Driver> {
    return mockDeep<Driver>(
      { funcPropSupport: true },
      {
        acquireConnection: async () => this.connection,
        beginTransaction: async (_, settings: TransactionSettings) => {
          if (settings.isolationLevel) {
            await this.connection.executeQuery(
              CompiledQuery.raw(`set transaction isolation level ${settings.isolationLevel}`),
            );
          }

          await this.connection.executeQuery(CompiledQuery.raw("begin"));
        },
        commitTransaction: async () => {
          await this.connection.executeQuery(CompiledQuery.raw("commit"));
        },
        destroy: async () => {},
        init: async () => {},
        releaseConnection: async () => {},
        rollbackTransaction: async () => {
          await this.connection.executeQuery(CompiledQuery.raw("rollback"));
        },
      },
    );
  }

  public createQueryCompiler(): QueryCompiler {
    return new MysqlQueryCompiler();
  }

  public createAdapter(): DialectAdapter {
    return new MysqlAdapter();
  }

  public createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return new MysqlIntrospector(db);
  }
}
