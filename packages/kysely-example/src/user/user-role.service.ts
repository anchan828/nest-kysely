import { Injectable, NotFoundException } from "@nestjs/common";
import { UserRoleRepository } from "./user-role.repository";
import { UserRole, UserRoleType } from "./user.type";

@Injectable()
export class UserRoleService {
  constructor(private readonly repository: UserRoleRepository) {}

  public async getByUserId(userId: string): Promise<UserRole> {
    const role = await this.repository.getByUserId(userId);

    if (role === undefined) {
      throw new NotFoundException("User role not found");
    }
    return role;
  }

  public async create(userId: string, role: UserRoleType): Promise<void> {
    await this.repository.create(userId, role);
  }
}
