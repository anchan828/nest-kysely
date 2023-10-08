import { Inject, Injectable } from "@nestjs/common";
import { Kysely, Transaction } from "kysely";
import { KYSELY_TRANSACTION_ASYNC_LOCAL_STORAGE } from "./kysely.async-storage";
import { KYSELY } from "./kysely.constant";
import { KyselyTransactionalOptions } from "./kysely.interface";
@Injectable()
export class KyselyService<DB = any> {
  constructor(@Inject(KYSELY) private readonly kysely: Kysely<DB>) {}

  public get db(): Kysely<DB> | Transaction<DB> {
    const transaction = KYSELY_TRANSACTION_ASYNC_LOCAL_STORAGE.getStore();
    return transaction || this.kysely;
  }

  public startTransaction<T>(
    callback: (trx: Transaction<DB>) => Promise<T>,
    options: KyselyTransactionalOptions = {},
  ): Promise<T> {
    let transaction = this.kysely.transaction();

    if (options.isolationLevel) {
      transaction = transaction.setIsolationLevel(options.isolationLevel);
    }

    return transaction.execute((trx) => KYSELY_TRANSACTION_ASYNC_LOCAL_STORAGE.run(trx, () => callback(trx)));
  }
}
