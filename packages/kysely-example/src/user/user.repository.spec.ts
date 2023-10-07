import { KyselyService } from "@anchan828/nest-kysely";
import * as SQLite from "better-sqlite3";
import { DeepMockProxy } from "jest-mock-extended";
import { DatabaseConnection, Kysely, SqliteDialect } from "kysely";
import { createDriverMock } from "../test-utils/create-mock-driver";
import { UserRepository } from "./user.repository";
import { UserDatabase } from "./user.type";

describe("UserRepository", () => {
  let connectionMock: DeepMockProxy<DatabaseConnection>;
  let repository: UserRepository;
  beforeEach(() => {
    const dialect = new SqliteDialect({
      database: new SQLite(":memory:"),
    });
    const { connection } = createDriverMock(dialect);
    connectionMock = connection;

    const db = new Kysely<UserDatabase>({ dialect });
    const service = new KyselyService<UserDatabase>(db);
    repository = new UserRepository(service);
  });

  describe("getById", () => {
    it("should return undefined", async () => {
      connectionMock.executeQuery.mockResolvedValueOnce({ rows: [] });
      await expect(repository.getById("userId")).resolves.toBeUndefined();

      expect(connectionMock.executeQuery.mock.calls).toEqual([
        [
          {
            parameters: ["userId"],
            query: expect.anything(),
            sql: 'select * from "user" where "id" = ?',
          },
        ],
      ]);
    });

    it("should return user", async () => {
      connectionMock.executeQuery.mockResolvedValueOnce({ rows: [{ id: "userId", name: "test" }] });
      await expect(repository.getById("userId")).resolves.toEqual({ id: "userId", name: "test" });

      expect(connectionMock.executeQuery.mock.calls).toEqual([
        [
          {
            parameters: ["userId"],
            query: expect.anything(),
            sql: 'select * from "user" where "id" = ?',
          },
        ],
      ]);
    });
  });

  describe("create", () => {
    it("should create user", async () => {
      connectionMock.executeQuery.mockResolvedValueOnce({ rows: [] });
      await expect(repository.create("test")).resolves.toEqual({ id: expect.anything(), name: "test" });

      expect(connectionMock.executeQuery.mock.calls).toEqual([
        [
          {
            parameters: ["test", expect.anything()],
            query: expect.anything(),
            sql: 'insert into "user" ("name", "id") values (?, ?)',
          },
        ],
      ]);
    });
  });
});
