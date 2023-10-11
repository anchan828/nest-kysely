import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { randomUUID } from "crypto";
import { AppModule } from "../app.module";
import { clearDatabase } from "../test-utils/clear-database";
import { UserRoleRepository } from "./user-role.repository";
import { UserRepository } from "./user.repository";
describe("UserRoleService", () => {
  let app: INestApplication;
  let userRepository: UserRepository;
  let userRoleReposiroty: UserRoleRepository;
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    userRepository = app.get(UserRepository);
    userRoleReposiroty = app.get(UserRoleRepository);
  });

  afterEach(async () => {
    await clearDatabase(app);
    await app.close();
  });

  describe("getById", () => {
    it("should return undefined", async () => {
      const userId = randomUUID();
      await expect(userRoleReposiroty.getByUserId(userId)).resolves.toBeUndefined();
    });

    it("should get user", async () => {
      const user = await userRepository.create("test");
      await userRoleReposiroty.create(user.id, "user");
      await expect(userRoleReposiroty.getByUserId(user.id)).resolves.toEqual({ role: "user", userId: user.id });
    });
  });

  describe("create", () => {
    it("should create user", async () => {
      const user = await userRepository.create("test");
      await expect(userRoleReposiroty.create(user.id, "user")).resolves.toEqual({ role: "user", userId: user.id });
    });
  });
});
