import { KyselyService } from "@anchan828/nest-kysely";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "../app.module";
import { clearDatabase } from "../test-utils/clear-database";
import { UserDatabase, UserRoleDatabase } from "./user.type";

describe("UserController", () => {
  let app: INestApplication;
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await clearDatabase(app);
    await app.close();
  });

  describe("POST /users", () => {
    it("should create user", async () => {
      await request(app.getHttpServer())
        .post(`/users`)
        .send({ name: "test", role: "user" })
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({
            id: expect.anything(),
            name: "test",
            role: "user",
          });
        });
    });
  });

  describe("POST /users/error", () => {
    it("should create user", async () => {
      await request(app.getHttpServer()).post(`/users/error`).send({ name: "test", role: "user" }).expect(400).expect({
        message: "error",
        error: "Bad Request",
        statusCode: 400,
      });
      await expect(
        app
          .get(KyselyService<UserDatabase>)
          .db.selectFrom("user")
          .selectAll()
          .execute(),
      ).resolves.toEqual([]);

      await expect(
        app
          .get(KyselyService<UserRoleDatabase>)
          .db.selectFrom("userRole")
          .selectAll()
          .execute(),
      ).resolves.toEqual([]);
    });
  });

  describe("GET /users/:userId", () => {
    it("should get 404", async () => {
      await request(app.getHttpServer()).get(`/users/user1234`).expect(404).expect({
        message: "User not found",
        error: "Not Found",
        statusCode: 404,
      });
    });

    it("should get user", async () => {
      const res = await request(app.getHttpServer()).post(`/users`).send({ name: "test", role: "user" }).expect(201);

      await request(app.getHttpServer()).get(`/users/${res.body.id}`).expect(200).expect({
        id: res.body.id,
        name: "test",
        role: "user",
      });
    });
  });
});
