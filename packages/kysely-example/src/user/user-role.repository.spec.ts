import { KyselyService } from "@anchan828/nest-kysely";
import { Kysely } from "kysely";
import { MysqlTestDialect } from "../test-utils/mysql-test-driver";
import { UserRoleRepository } from "./user-role.repository";
import { UserRoleDatabase } from "./user.type";

describe("UserRoleRepository", () => {
  let dialect: MysqlTestDialect;
  let repository: UserRoleRepository;
  beforeEach(() => {
    dialect = new MysqlTestDialect();
    repository = new UserRoleRepository(new KyselyService<UserRoleDatabase>(new Kysely({ dialect })));
  });

  describe("getByUserId", () => {
    it("should return undefined", async () => {
      dialect.connection.executeQuery.mockResolvedValueOnce({ rows: [] });
      await expect(repository.getByUserId("userId")).resolves.toBeUndefined();

      expect(dialect.connection.executeQuery.mock.calls).toEqual([
        [
          {
            parameters: ["userId"],
            query: expect.anything(),
            sql: "select * from `userRole` where `userId` = ?",
          },
        ],
      ]);
    });

    it("should return user role", async () => {
      dialect.connection.executeQuery.mockResolvedValueOnce({ rows: [{ userId: "userId", role: "admin" }] });
      await expect(repository.getByUserId("userId")).resolves.toEqual({ userId: "userId", role: "admin" });

      expect(dialect.connection.executeQuery.mock.calls).toEqual([
        [
          {
            parameters: ["userId"],
            query: expect.anything(),
            sql: "select * from `userRole` where `userId` = ?",
          },
        ],
      ]);
    });
  });

  describe("create", () => {
    it("should create user role", async () => {
      dialect.connection.executeQuery.mockResolvedValueOnce({ rows: [] });
      await expect(repository.create("userId", "admin")).resolves.toEqual({ userId: "userId", role: "admin" });

      expect(dialect.connection.executeQuery.mock.calls).toEqual([
        [
          {
            parameters: ["userId", "admin"],
            query: expect.anything(),
            sql: "insert into `userRole` (`userId`, `role`) values (?, ?)",
          },
        ],
      ]);
    });
  });
});
