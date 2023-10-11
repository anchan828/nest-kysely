import { KyselyService } from "@anchan828/nest-kysely";
import { Kysely } from "kysely";
import { MysqlTestDialect } from "../test-utils/mysql-test-driver";
import { UserDatabase } from "../user/user.type";
import { CommentRepository } from "./comment.repository";
import { CommentDatabase } from "./comment.type";

describe("CommentRepository", () => {
  let dialect: MysqlTestDialect;
  let repository: CommentRepository;
  beforeEach(() => {
    dialect = new MysqlTestDialect();
    const db = new Kysely<CommentDatabase & UserDatabase>({ dialect });
    const service = new KyselyService<CommentDatabase & UserDatabase>(db);
    repository = new CommentRepository(service);
  });
  describe("create", () => {
    it("should call create", async () => {
      dialect.connection.executeQuery.mockResolvedValueOnce({
        rows: [],
        numAffectedRows: 1n,
      });

      await repository.create("comment", "userId");

      expect(dialect.connection.executeQuery.mock.calls).toEqual([
        [
          {
            parameters: [expect.any(String), "comment", "userId", expect.any(Date)],
            query: expect.anything(),
            sql: "insert into `comment` (`id`, `comment`, `createdById`, `createdAt`) values (?, ?, ?, ?)",
          },
        ],
      ]);
    });
  });

  describe("get", () => {
    it("should call get", async () => {
      const row = {
        comment: "comment",
        createdAt: new Date(),
        id: "commentId",
        createdById: "userId",
        createdByName: "username",
      };

      dialect.connection.executeQuery.mockResolvedValueOnce({
        rows: [row],
      });

      await expect(repository.get("commentId")).resolves.toEqual({
        id: row.id,
        comment: row.comment,
        createdAt: row.createdAt,
        createdBy: {
          id: row.createdById,
          name: row.createdByName,
        },
      });

      expect(dialect.connection.executeQuery.mock.calls).toEqual([
        [
          {
            parameters: ["commentId"],
            query: expect.anything(),
            sql: "select `comment`.`comment`, `comment`.`createdAt`, `comment`.`id`, `comment`.`createdById`, `user`.`name` as `createdByName` from `comment` inner join `user` on `user`.`id` = `comment`.`createdById` where `comment`.`id` = ?",
          },
        ],
      ]);
    });
  });

  describe("list", () => {
    it("should call list", async () => {
      const rows = [
        {
          comment: "comment1",
          createdAt: new Date(),
          id: "commentId1",
          createdById: "userId",
          createdByName: "username",
        },
        {
          comment: "comment2",
          createdAt: new Date(),
          id: "commentId2",
          createdById: "userId",
          createdByName: "username",
        },
      ];

      dialect.connection.executeQuery.mockResolvedValueOnce({
        rows,
      });

      await expect(repository.list()).resolves.toEqual(
        rows.map((row) => ({
          id: row.id,
          comment: row.comment,
          createdAt: row.createdAt,
          createdBy: {
            id: row.createdById,
            name: row.createdByName,
          },
        })),
      );

      expect(dialect.connection.executeQuery.mock.calls).toEqual([
        [
          {
            parameters: [],
            query: expect.anything(),
            sql: "select `comment`.`comment`, `comment`.`createdAt`, `comment`.`id`, `comment`.`createdById`, `user`.`name` as `createdByName` from `comment` inner join `user` on `user`.`id` = `comment`.`createdById`",
          },
        ],
      ]);
    });
  });

  describe("delete", () => {
    it("should call delete", async () => {
      dialect.connection.executeQuery.mockResolvedValueOnce({
        rows: [],
        numAffectedRows: 1n,
      });

      await repository.delete("commentId");

      expect(dialect.connection.executeQuery.mock.calls).toEqual([
        [
          {
            parameters: ["commentId"],
            query: expect.anything(),
            sql: "delete from `comment` where `id` = ?",
          },
        ],
      ]);
    });
  });
});
