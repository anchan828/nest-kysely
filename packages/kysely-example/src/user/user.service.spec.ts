import { DeepMockProxy, mockDeep } from "jest-mock-extended";
import { UserRepository } from "./user.repository";
import { UserService } from "./user.service";

describe("UserService", () => {
  let repository: DeepMockProxy<UserRepository>;
  let service: UserService;
  beforeEach(() => {
    repository = mockDeep<UserRepository>();
    service = new UserService(repository);
  });

  describe("getById", () => {
    it("should throw exception(Not found)", async () => {
      repository.getById.mockResolvedValueOnce(undefined);
      await expect(service.getById("userId")).rejects.toThrow("User not found");
      expect(repository.getById.mock.calls).toEqual([["userId"]]);
    });

    it("should return user", async () => {
      repository.getById.mockResolvedValueOnce({ id: "userId", name: "test" });
      await expect(service.getById("userId")).resolves.toEqual({ id: "userId", name: "test" });
      expect(repository.getById.mock.calls).toEqual([["userId"]]);
    });
  });

  describe("create", () => {
    it("should create user", async () => {
      repository.create.mockResolvedValueOnce({ id: "userId", name: "test" });
      await expect(service.create("test")).resolves.toEqual({ id: "userId", name: "test" });
      expect(repository.create.mock.calls).toEqual([["test"]]);
    });
  });
});
