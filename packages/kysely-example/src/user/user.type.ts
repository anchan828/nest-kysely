import { Selectable } from "kysely";

export interface UserDatabase {
  user: UserTable;
}

export interface UserTable {
  id: string;
  name: string;
}

export type User = Selectable<UserTable>;

export interface UserRoleDatabase {
  userRole: UserRoleTable;
}

export type UserRoleType = "admin" | "user";

export interface UserRoleTable {
  userId: string;
  role: UserRoleType;
}
export type UserRole = Selectable<UserRoleTable>;
