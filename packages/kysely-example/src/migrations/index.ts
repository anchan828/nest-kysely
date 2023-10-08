import { CreateCommentTable } from "./CreateCommentTable";
import { CreateUserRoleTable } from "./CreateUserRoleTable";
import { CreateUserTable } from "./CreateUserTable";

export const migrations = [CreateUserTable, CreateUserRoleTable, CreateCommentTable];
