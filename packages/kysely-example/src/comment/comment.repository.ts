import { KyselyService } from "@anchan828/nest-kysely";
import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { UserDatabase } from "../user/user.type";
import { Comment, CommentDatabase } from "./comment.type";

@Injectable()
export class CommentRepository {
  constructor(private readonly kyselyService: KyselyService<CommentDatabase & UserDatabase>) {}

  public async create(comment: string, userId: string): Promise<string> {
    const commentId = randomUUID();
    await this.kyselyService.db
      .insertInto("comment")
      .values({
        id: commentId,
        comment,
        createdById: userId,
        createdAt: new Date(),
      })
      .execute();

    return commentId;
  }

  public async get(commentId: string): Promise<Comment | undefined> {
    const row = await this.kyselyService.db
      .selectFrom("comment")
      .innerJoin("user", "user.id", "comment.createdById")
      .select([
        "comment.comment",
        "comment.createdAt",
        "comment.id",
        "comment.createdById",
        "user.name as createdByName",
      ])
      .where("comment.id", "=", commentId)
      .executeTakeFirst();

    if (row) {
      return {
        id: row.id,
        comment: row.comment,
        createdAt: row.createdAt,
        createdBy: {
          id: row.createdById,
          name: row.createdByName,
        },
      };
    }
  }

  public async list(): Promise<Comment[]> {
    const rows = await this.kyselyService.db
      .selectFrom("comment")
      .innerJoin("user", "user.id", "comment.createdById")
      .select([
        "comment.comment",
        "comment.createdAt",
        "comment.id",
        "comment.createdById",
        "user.name as createdByName",
      ])
      .execute();

    return rows.map((row) => ({
      id: row.id,
      comment: row.comment,
      createdAt: row.createdAt,
      createdBy: {
        id: row.createdById,
        name: row.createdByName,
      },
    }));
  }

  public async delete(commentId: string): Promise<void> {
    await this.kyselyService.db.deleteFrom("comment").where("id", "=", commentId).execute();
  }
}
