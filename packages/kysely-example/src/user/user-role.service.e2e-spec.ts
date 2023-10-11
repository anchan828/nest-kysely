import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../app.module";
import { clearDatabase } from "../test-utils/clear-database";
import { UserRoleService } from "./user-role.service";
import { UserService } from "./user.service";
describe("UserRoleService", () => {
  let app: INestApplication;
  let userService: UserService;
  let userRoleService: UserRoleService;
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    userService = app.get(UserService);
    userRoleService = app.get(UserRoleService);
  });

  afterEach(async () => {
    await clearDatabase(app);
    await app.close();
  });

  describe("getById", () => {
    it("should throw exception(Not found)", async () => {
      const user = await userService.create("test");
      await expect(userRoleService.getByUserId(user.id)).rejects.toThrow("User role not found");
    });

    it("should get user", async () => {
      const user = await userService.create("test");
      await userRoleService.create(user.id, "user");
      await expect(userRoleService.getByUserId(user.id)).resolves.toEqual({ role: "user", userId: user.id });
    });
  });

  describe("create", () => {
    it("should create user", async () => {
      const user = await userService.create("test");
      await expect(userRoleService.create(user.id, "user")).resolves.toBeUndefined();
    });
  });
});
