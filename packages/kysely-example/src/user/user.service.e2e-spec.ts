import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../app.module";
import { UserService } from "./user.service";

describe("UserService", () => {
  let app: INestApplication;
  let service: UserService;
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    service = app.get(UserService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe("getById", () => {
    it("should throw exception(Not found)", async () => {
      await expect(service.getById("userId")).rejects.toThrow("User not found");
    });

    it("should get user", async () => {
      const user = await service.create("test");
      await expect(service.getById(user.id)).resolves.toEqual(user);
    });
  });

  describe("create", () => {
    it("should create user", async () => {
      await expect(service.create("test")).resolves.toEqual({ id: expect.anything(), name: "test" });
    });
  });
});
