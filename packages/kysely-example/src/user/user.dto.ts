import { User, UserRole, UserRoleType } from "./user.type";

export class UserDto implements User, Pick<UserRole, "role"> {
  id!: string;

  name!: string;

  role!: UserRoleType;
}

export class CreateUserDto {
  name!: string;

  role!: UserRoleType;
}
