import { KyselyService } from "@anchan828/nest-kysely";
import * as SQLite from "better-sqlite3";
import { DeepMockProxy } from "jest-mock-extended";
import { DatabaseConnection, Kysely, SqliteDialect } from "kysely";
import { createDriverMock } from "../test-utils/create-mock-driver";
import { UserDatabase } from "../user/user.type";
import { CommentRepository } from "./comment.repository";
import { CommentDatabase } from "./comment.type";

describe("CommentRepository", () => {
  let connectionMock: DeepMockProxy<DatabaseConnection>;
  let repository: CommentRepository;
  beforeEach(() => {
    const dialect = new SqliteDialect({
      database: new SQLite(":memory:"),
    });
    const { connection } = createDriverMock(dialect);
    connectionMock = connection;

    const db = new Kysely<CommentDatabase & UserDatabase>({ dialect });
    const service = new KyselyService<CommentDatabase & UserDatabase>(db);
    repository = new CommentRepository(service);
  });
  describe("create", () => {
    it("should call create", async () => {
      connectionMock.executeQuery.mockResolvedValueOnce({
        rows: [],
        numAffectedRows: 1n,
      });

      await repository.create("comment", "userId");

      expect(connectionMock.executeQuery.mock.calls).toEqual([
        [
          {
            parameters: [expect.any(String), "comment", "userId", expect.any(Date)],
            query: expect.anything(),
            sql: 'insert into "comment" ("id", "comment", "createdById", "createdAt") values (?, ?, ?, ?)',
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

      connectionMock.executeQuery.mockResolvedValueOnce({
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

      expect(connectionMock.executeQuery.mock.calls).toEqual([
        [
          {
            parameters: ["commentId"],
            query: expect.anything(),
            sql: 'select "comment"."comment", "comment"."createdAt", "comment"."id", "comment"."createdById", "user"."name" as "createdByName" from "comment" inner join "user" on "user"."id" = "comment"."createdById" where "comment"."id" = ?',
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

      connectionMock.executeQuery.mockResolvedValueOnce({
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

      expect(connectionMock.executeQuery.mock.calls).toEqual([
        [
          {
            parameters: [],
            query: expect.anything(),
            sql: 'select "comment"."comment", "comment"."createdAt", "comment"."id", "comment"."createdById", "user"."name" as "createdByName" from "comment" inner join "user" on "user"."id" = "comment"."createdById"',
          },
        ],
      ]);
    });
  });

  describe("delete", () => {
    it("should call delete", async () => {
      connectionMock.executeQuery.mockResolvedValueOnce({
        rows: [],
        numAffectedRows: 1n,
      });

      await repository.delete("commentId");

      expect(connectionMock.executeQuery.mock.calls).toEqual([
        [
          {
            parameters: ["commentId"],
            query: expect.anything(),
            sql: 'delete from "comment" where "id" = ?',
          },
        ],
      ]);
    });
  });
});
