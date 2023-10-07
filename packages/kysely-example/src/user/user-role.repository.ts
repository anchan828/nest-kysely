import { KyselyService } from "@anchan828/nest-kysely";
import { Injectable } from "@nestjs/common";
import { UserRole, UserRoleDatabase, UserRoleType } from "./user.type";

@Injectable()
export class UserRoleRepository {
  constructor(private readonly kysely: KyselyService<UserRoleDatabase>) {}

  public async getByUserId(userId: string): Promise<UserRole | undefined> {
    return await this.kysely.db.selectFrom("userRole").where("userId", "=", userId).selectAll().executeTakeFirst();
  }

  public async create(userId: string, role: UserRoleType): Promise<UserRole> {
    const userRole: UserRole = { userId, role };
    await this.kysely.db.insertInto("userRole").values(userRole).execute();
    return userRole;
  }
}
