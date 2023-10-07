import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../app.module";
import { UserRoleRepository } from "./user-role.repository";
describe("UserRoleService", () => {
  let app: INestApplication;
  let reposiroty: UserRoleRepository;
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    reposiroty = app.get(UserRoleRepository);
  });

  afterEach(async () => {
    await app.close();
  });

  describe("getById", () => {
    it("should return undefined", async () => {
      await expect(reposiroty.getByUserId("userId")).resolves.toBeUndefined();
    });

    it("should get user", async () => {
      await reposiroty.create("userId", "user");
      await expect(reposiroty.getByUserId("userId")).resolves.toEqual({ role: "user", userId: "userId" });
    });
  });

  describe("create", () => {
    it("should create user", async () => {
      await expect(reposiroty.create("userId", "user")).resolves.toEqual({ role: "user", userId: "userId" });
    });
  });
});
