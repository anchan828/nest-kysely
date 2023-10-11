import { KyselyService } from "@anchan828/nest-kysely";
import { Kysely } from "kysely";
import { MysqlTestDialect } from "../test-utils/mysql-test-driver";
import { UserRepository } from "./user.repository";
import { UserDatabase } from "./user.type";

describe("UserRepository", () => {
  let dialect: MysqlTestDialect;
  let repository: UserRepository;
  beforeEach(() => {
    dialect = new MysqlTestDialect();

    const db = new Kysely<UserDatabase>({ dialect });
    const service = new KyselyService<UserDatabase>(db);
    repository = new UserRepository(service);
  });

  describe("getById", () => {
    it("should return undefined", async () => {
      dialect.connection.executeQuery.mockResolvedValueOnce({ rows: [] });
      await expect(repository.getById("userId")).resolves.toBeUndefined();

      expect(dialect.connection.executeQuery.mock.calls).toEqual([
        [
          {
            parameters: ["userId"],
            query: expect.anything(),
            sql: "select * from `user` where `id` = ?",
          },
        ],
      ]);
    });

    it("should return user", async () => {
      dialect.connection.executeQuery.mockResolvedValueOnce({ rows: [{ id: "userId", name: "test" }] });
      await expect(repository.getById("userId")).resolves.toEqual({ id: "userId", name: "test" });

      expect(dialect.connection.executeQuery.mock.calls).toEqual([
        [
          {
            parameters: ["userId"],
            query: expect.anything(),
            sql: "select * from `user` where `id` = ?",
          },
        ],
      ]);
    });
  });

  describe("create", () => {
    it("should create user", async () => {
      dialect.connection.executeQuery.mockResolvedValueOnce({ rows: [] });
      await expect(repository.create("test")).resolves.toEqual({ id: expect.anything(), name: "test" });

      expect(dialect.connection.executeQuery.mock.calls).toEqual([
        [
          {
            parameters: ["test", expect.anything()],
            query: expect.anything(),
            sql: "insert into `user` (`name`, `id`) values (?, ?)",
          },
        ],
      ]);
    });
  });
});
