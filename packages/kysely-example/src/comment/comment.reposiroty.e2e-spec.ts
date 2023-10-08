import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../app.module";
import { clearDatabase } from "../test-utils/clear-database";
import { UserRepository } from "../user/user.repository";
import { CommentRepository } from "./comment.repository";

describe("CommentRepository", () => {
  let app: INestApplication;
  let userRepository: UserRepository;
  let commentRepository: CommentRepository;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    userRepository = app.get(UserRepository);
    commentRepository = app.get(CommentRepository);
  });

  afterEach(async () => {
    await clearDatabase(app);
    await app.close();
  });

  describe("create", () => {
    it("should create comment", async () => {
      const user = await userRepository.create("test");
      await expect(commentRepository.create("comment1", user.id)).resolves.toEqual(expect.any(String));
    });
  });

  describe("list", () => {
    it("should get comments", async () => {
      const user = await userRepository.create("test");

      await commentRepository.create("comment1", user.id);
      await commentRepository.create("comment2", user.id);
      await commentRepository.create("comment3", user.id);

      await expect(commentRepository.list()).resolves.toEqual(
        expect.arrayContaining([
          {
            id: expect.any(String),
            comment: "comment1",
            createdAt: expect.any(Date),
            createdBy: {
              id: user.id,
              name: "test",
            },
          },
          {
            id: expect.any(String),
            comment: "comment2",
            createdAt: expect.any(Date),
            createdBy: {
              id: user.id,
              name: "test",
            },
          },
          {
            id: expect.any(String),
            comment: "comment3",
            createdAt: expect.any(Date),
            createdBy: {
              id: user.id,
              name: "test",
            },
          },
        ]),
      );
    });
  });

  describe("get", () => {
    it("should create comment", async () => {
      const user = await userRepository.create("test");
      const commentId = await commentRepository.create("comment", user.id);
      await expect(commentRepository.get(commentId)).resolves.toEqual({
        id: expect.any(String),
        comment: "comment",
        createdAt: expect.any(Date),
        createdBy: {
          id: user.id,
          name: "test",
        },
      });
    });
  });

  describe("delete", () => {
    it("should delete comment", async () => {
      const user = await userRepository.create("test");
      const commentId = await commentRepository.create("comment", user.id);
      await expect(commentRepository.get(commentId)).resolves.toEqual({
        id: expect.any(String),
        comment: "comment",
        createdAt: expect.any(Date),
        createdBy: {
          id: user.id,
          name: "test",
        },
      });
      await expect(commentRepository.delete(commentId)).resolves.toBeUndefined();
      await expect(commentRepository.get(commentId)).resolves.toBeUndefined();
    });
  });
});
