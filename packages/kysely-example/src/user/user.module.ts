import { Module } from "@nestjs/common";
import { UserRoleRepository } from "./user-role.repository";
import { UserRoleService } from "./user-role.service";
import { UserController } from "./user.controller";
import { UserRepository } from "./user.repository";
import { UserService } from "./user.service";

@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository, UserRoleService, UserRoleRepository],
})
export class UserModule {}
