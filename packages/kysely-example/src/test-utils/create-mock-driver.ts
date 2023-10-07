import { DeepMockProxy, mockDeep } from "jest-mock-extended";
import { CompiledQuery, DatabaseConnection, Dialect, Driver } from "kysely";

/**
 * This is for verifying queries without communicating with the database by mocking the driver class and connection class in a jest test.
 */
export function createDriverMock(dialect: Dialect): {
  driver: DeepMockProxy<Driver>;
  connection: DeepMockProxy<DatabaseConnection>;
} {
  const connection = mockDeep<DatabaseConnection>();
  const driver = mockDeep<Driver>(
    { funcPropSupport: true },
    {
      init: async () => {},
      beginTransaction: async () => {
        // If you are using a database that supports transaction isolation levels, you can set the isolation level here.
        // if (settings.isolationLevel) {
        //   await connection.executeQuery(
        //     CompiledQuery.raw(`set transaction isolation level ${settings.isolationLevel}`),
        //   );
        // }

        await connection.executeQuery(CompiledQuery.raw("begin"));
      },
      commitTransaction: async () => {
        await connection.executeQuery(CompiledQuery.raw("commit"));
      },
      rollbackTransaction: async () => {
        await connection.executeQuery(CompiledQuery.raw("rollback"));
      },
      releaseConnection: async () => {},
      destroy: async () => {},
      acquireConnection: async () => connection,
    },
  );
  jest.spyOn(dialect, "createDriver").mockReturnValue(driver);
  return { driver, connection };
}
