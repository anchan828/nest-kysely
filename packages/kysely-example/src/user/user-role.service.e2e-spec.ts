import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../app.module";
import { clearDatabase } from "../test-utils/clear-database";
import { UserRoleService } from "./user-role.service";
describe("UserRoleService", () => {
  let app: INestApplication;
  let service: UserRoleService;
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    service = app.get(UserRoleService);
  });

  afterEach(async () => {
    await clearDatabase(app);
    await app.close();
  });

  describe("getById", () => {
    it("should throw exception(Not found)", async () => {
      await expect(service.getByUserId("userId")).rejects.toThrow("User role not found");
    });

    it("should get user", async () => {
      await service.create("userId", "user");
      await expect(service.getByUserId("userId")).resolves.toEqual({ role: "user", userId: "userId" });
    });
  });

  describe("create", () => {
    it("should create user", async () => {
      await expect(service.create("userId", "user")).resolves.toBeUndefined();
    });
  });
});
