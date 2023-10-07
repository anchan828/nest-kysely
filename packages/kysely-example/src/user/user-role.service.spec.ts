import { DeepMockProxy, mockDeep } from "jest-mock-extended";
import { UserRoleRepository } from "./user-role.repository";
import { UserRoleService } from "./user-role.service";

describe("UserRoleService", () => {
  let repository: DeepMockProxy<UserRoleRepository>;
  let service: UserRoleService;
  beforeEach(() => {
    repository = mockDeep<UserRoleRepository>();
    service = new UserRoleService(repository);
  });

  describe("getByUserId", () => {
    it("should throw exception(Not found)", async () => {
      repository.getByUserId.mockResolvedValueOnce(undefined);
      await expect(service.getByUserId("userId")).rejects.toThrow("User role not found");
      expect(repository.getByUserId.mock.calls).toEqual([["userId"]]);
    });

    it("should return user role", async () => {
      repository.getByUserId.mockResolvedValueOnce({ userId: "userId", role: "admin" });
      await expect(service.getByUserId("userId")).resolves.toEqual({ userId: "userId", role: "admin" });
      expect(repository.getByUserId.mock.calls).toEqual([["userId"]]);
    });
  });

  describe("create", () => {
    it("should create user role", async () => {
      await expect(service.create("userId", "admin")).resolves.toBeUndefined();
      expect(repository.create.mock.calls).toEqual([["userId", "admin"]]);
    });
  });
});
