import { Selectable } from "kysely";
import { User } from "../user/user.type";

export interface CommentDatabase {
  comment: CommentTable;
}

export interface CommentTable {
  id: string;
  comment: string;
  createdAt: Date;
  createdById: string;
}

export type Comment = Selectable<Omit<CommentTable, "createdById">> & { createdBy: User };
