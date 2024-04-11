import {
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
  QueryResult,
  RootOperationNode,
  UnknownRow,
} from "kysely";

/**
 * Remove properties with null value from the result.
 *
 * ```json
 * {
 *   "id": 1,
 *   "name": "John",
 *   "nullableColumn": null
 * }
 * ```
 * will be transformed to:
 *
 * ```json
 * {
 *    "id": 1,
 *    "name": "John"
 * }
 * ```
 */
export class RemoveNullPropertyPlugin implements KyselyPlugin {
  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return args.node;
  }

  async transformResult(args: PluginTransformResultArgs): Promise<QueryResult<UnknownRow>> {
    if (args.result.rows && Array.isArray(args.result.rows)) {
      const rows = args.result.rows.map((row) => {
        const newRow: UnknownRow = {};
        for (const key in row) {
          if (row[key] !== null) {
            newRow[key] = row[key];
          }
        }
        return newRow;
      });

      return {
        ...args.result,
        rows,
      };
    }

    return args.result;
  }
}
