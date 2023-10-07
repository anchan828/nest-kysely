import { KyselyService } from "@anchan828/nest-kysely";
import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { User, UserDatabase } from "./user.type";

@Injectable()
export class UserRepository {
  constructor(private readonly kysely: KyselyService<UserDatabase>) {}

  public async getById(id: string): Promise<User | undefined> {
    return await this.kysely.db.selectFrom("user").where("id", "=", id).selectAll().executeTakeFirst();
  }

  public async create(name: string): Promise<User> {
    const user: User = { name, id: randomUUID() };
    await this.kysely.db.insertInto("user").values(user).execute();
    return user;
  }
}
