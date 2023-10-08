import { Module } from "@nestjs/common";
import { CommentRepository } from "./comment.repository";

@Module({
  imports: [],
  providers: [CommentRepository],
})
export class CommentModule {}
