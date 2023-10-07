import { DeepMockProxy, mockDeep } from "jest-mock-extended";
import { UserRoleService } from "./user-role.service";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

describe("UserController", () => {
  let userService: DeepMockProxy<UserService>;
  let userRoleService: DeepMockProxy<UserRoleService>;
  let controller: UserController;
  beforeEach(() => {
    userService = mockDeep<UserService>();
    userRoleService = mockDeep<UserRoleService>();
    controller = new UserController(userService, userRoleService);
  });

  describe("getById", () => {
    it("should return user", async () => {
      userService.getById.mockResolvedValueOnce({ id: "userId", name: "test" });
      userRoleService.getByUserId.mockResolvedValueOnce({ userId: "userId", role: "admin" });
      await expect(controller.getById("userId")).resolves.toEqual({ id: "userId", name: "test", role: "admin" });
      expect(userService.getById.mock.calls).toEqual([["userId"]]);
      expect(userRoleService.getByUserId.mock.calls).toEqual([["userId"]]);
    });
  });

  describe("create", () => {
    it("should create user", async () => {
      userService.create.mockResolvedValueOnce({ id: "userId", name: "test" });
      userRoleService.create.mockResolvedValueOnce();
      await expect(controller.create({ name: "test", role: "admin" })).resolves.toEqual({
        id: "userId",
        name: "test",
        role: "admin",
      });
      expect(userService.create.mock.calls).toEqual([["test"]]);
      expect(userRoleService.create.mock.calls).toEqual([["userId", "admin"]]);
    });
  });

  describe("createError", () => {
    it("should throw error", async () => {
      userService.create.mockResolvedValueOnce({ id: "userId", name: "test" });
      userRoleService.create.mockResolvedValueOnce();
      await expect(controller.createError({ name: "test", role: "admin" })).rejects.toThrowError("error");
      expect(userService.create.mock.calls).toEqual([["test"]]);
      expect(userRoleService.create.mock.calls).toEqual([["userId", "admin"]]);
    });
  });
});
