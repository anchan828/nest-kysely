import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../app.module";
import { clearDatabase } from "../test-utils/clear-database";
import { UserRepository } from "./user.repository";

describe("UserRepository", () => {
  let app: INestApplication;
  let repository: UserRepository;
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    repository = app.get(UserRepository);
  });

  afterEach(async () => {
    await clearDatabase(app);
    await app.close();
  });

  describe("getById", () => {
    it("should return undefined", async () => {
      await expect(repository.getById("userId")).resolves.toBeUndefined();
    });

    it("should get user", async () => {
      const user = await repository.create("test");
      await expect(repository.getById(user.id)).resolves.toEqual(user);
    });
  });

  describe("create", () => {
    it("should create user", async () => {
      await expect(repository.create("test")).resolves.toEqual({ id: expect.anything(), name: "test" });
    });
  });
});
