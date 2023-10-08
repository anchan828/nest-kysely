import { Inject } from "@nestjs/common";
import { Kysely } from "kysely";
import { KYSELY_TRANSACTION_ASYNC_LOCAL_STORAGE } from "./kysely.async-storage";
import { KYSELY, KYSELY_TRANSACTIONAL_DECORATOR_SYMBOL } from "./kysely.constant";
import { KyselyTransactionalOptions } from "./kysely.interface";

export function KyselyTransactional(options: KyselyTransactionalOptions = {}): MethodDecorator {
  const kyselyInjection = Inject(KYSELY);

  return (target: Object, propertyName: string | symbol, descriptor: PropertyDescriptor) => {
    kyselyInjection(target, KYSELY_TRANSACTIONAL_DECORATOR_SYMBOL);
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]): any {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const descriptorThis = this;
      const defaultkysely = (this as any)[KYSELY_TRANSACTIONAL_DECORATOR_SYMBOL] as Kysely<any>;

      const transaction = KYSELY_TRANSACTION_ASYNC_LOCAL_STORAGE.getStore();

      if (!defaultkysely || transaction) {
        return originalMethod.apply(descriptorThis, args);
      }

      let transactionBuilder = defaultkysely.transaction();

      if (options.isolationLevel) {
        transactionBuilder = transactionBuilder.setIsolationLevel(options.isolationLevel);
      }

      return transactionBuilder.execute((trx) =>
        KYSELY_TRANSACTION_ASYNC_LOCAL_STORAGE.run(trx, () => originalMethod.apply(descriptorThis, args)),
      );
    };
  };
}
