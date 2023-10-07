import { KyselyService } from "@anchan828/nest-kysely";
import * as SQLite from "better-sqlite3";
import { DeepMockProxy } from "jest-mock-extended";
import { DatabaseConnection, Kysely, SqliteDialect } from "kysely";
import { createDriverMock } from "../test-utils/create-mock-driver";
import { UserRoleRepository } from "./user-role.repository";
import { UserRoleDatabase } from "./user.type";

describe("UserRoleRepository", () => {
  let connectionMock: DeepMockProxy<DatabaseConnection>;
  let repository: UserRoleRepository;
  beforeEach(() => {
    const dialect = new SqliteDialect({
      database: new SQLite(":memory:"),
    });
    const { connection } = createDriverMock(dialect);
    connectionMock = connection;
    repository = new UserRoleRepository(new KyselyService<UserRoleDatabase>(new Kysely({ dialect })));
  });

  describe("getByUserId", () => {
    it("should return undefined", async () => {
      connectionMock.executeQuery.mockResolvedValueOnce({ rows: [] });
      await expect(repository.getByUserId("userId")).resolves.toBeUndefined();

      expect(connectionMock.executeQuery.mock.calls).toEqual([
        [
          {
            parameters: ["userId"],
            query: expect.anything(),
            sql: 'select * from "userRole" where "userId" = ?',
          },
        ],
      ]);
    });

    it("should return user role", async () => {
      connectionMock.executeQuery.mockResolvedValueOnce({ rows: [{ userId: "userId", role: "admin" }] });
      await expect(repository.getByUserId("userId")).resolves.toEqual({ userId: "userId", role: "admin" });

      expect(connectionMock.executeQuery.mock.calls).toEqual([
        [
          {
            parameters: ["userId"],
            query: expect.anything(),
            sql: 'select * from "userRole" where "userId" = ?',
          },
        ],
      ]);
    });
  });

  describe("create", () => {
    it("should create user role", async () => {
      connectionMock.executeQuery.mockResolvedValueOnce({ rows: [] });
      await expect(repository.create("userId", "admin")).resolves.toEqual({ userId: "userId", role: "admin" });

      expect(connectionMock.executeQuery.mock.calls).toEqual([
        [
          {
            parameters: ["userId", "admin"],
            query: expect.anything(),
            sql: 'insert into "userRole" ("userId", "role") values (?, ?)',
          },
        ],
      ]);
    });
  });
});
