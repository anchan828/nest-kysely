import { Injectable } from "@nestjs/common";
import { Kysely, Transaction } from "kysely";
import { KYSELY_TRANSACTION_ASYNC_LOCAL_STORAGE } from "./kysely.async-storage";

@Injectable()
export class KyselyService<DB = any> {
  constructor(private readonly kysely: Kysely<DB>) {}

  public get db(): Kysely<DB> | Transaction<DB> {
    const transaction = KYSELY_TRANSACTION_ASYNC_LOCAL_STORAGE.getStore();
    return transaction || this.kysely;
  }
}
