import { Injectable, NotFoundException } from "@nestjs/common";
import { UserRepository } from "./user.repository";
import { User } from "./user.type";

@Injectable()
export class UserService {
  constructor(private readonly repository: UserRepository) {}

  public async getById(id: string): Promise<User> {
    const user = await this.repository.getById(id);

    if (user === undefined) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  public async create(name: string): Promise<User> {
    return await this.repository.create(name);
  }
}
