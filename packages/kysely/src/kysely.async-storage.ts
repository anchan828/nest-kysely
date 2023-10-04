import { AsyncLocalStorage } from "async_hooks";
import { Transaction } from "kysely";

export const KYSELY_TRANSACTION_ASYNC_LOCAL_STORAGE = new AsyncLocalStorage<Transaction<any>>();
