import { Generated, Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";
import { createDriverMock } from "./create-mock-driver";

describe("createMockDriver", () => {
  it("should create driver and connection", async () => {
    const dialect = new MysqlDialect({
      pool: createPool({
        database: "test",
        user: "root",
        password: "root",
      }),
    });

    const { connection } = createDriverMock(dialect);

    const kysely = new Kysely<{
      user: {
        id: Generated<number>;
        name: string;
      };
    }>({
      dialect,
    });

    connection.executeQuery.mockResolvedValueOnce({ rows: [{ id: 1, name: "name" }] });

    await expect(kysely.selectFrom("user").where("id", "=", 1).selectAll().execute()).resolves.toEqual([
      { id: 1, name: "name" },
    ]);

    expect(connection.executeQuery).toHaveBeenCalledTimes(1);
    expect(connection.executeQuery.mock.calls).toEqual([
      [
        {
          parameters: [1],
          query: {
            from: {
              froms: [
                {
                  kind: "TableNode",
                  table: {
                    identifier: {
                      kind: "IdentifierNode",
                      name: "user",
                    },
                    kind: "SchemableIdentifierNode",
                  },
                },
              ],
              kind: "FromNode",
            },
            kind: "SelectQueryNode",
            selections: [
              {
                kind: "SelectionNode",
                selection: {
                  kind: "SelectAllNode",
                },
              },
            ],
            where: {
              kind: "WhereNode",
              where: {
                kind: "BinaryOperationNode",
                leftOperand: {
                  column: {
                    column: {
                      kind: "IdentifierNode",
                      name: "id",
                    },
                    kind: "ColumnNode",
                  },
                  kind: "ReferenceNode",
                  table: undefined,
                },
                operator: {
                  kind: "OperatorNode",
                  operator: "=",
                },
                rightOperand: {
                  kind: "ValueNode",
                  value: 1,
                },
              },
            },
          },
          sql: "select * from `user` where `id` = ?",
        },
      ],
    ]);
  });

  it("transaction", async () => {
    const dialect = new MysqlDialect({
      pool: createPool({
        database: "test",
        user: "root",
        password: "root",
      }),
    });

    const { connection } = createDriverMock(dialect);

    const kysely = new Kysely<{
      user: {
        id: Generated<number>;
        name: string;
      };
    }>({
      dialect,
    });

    connection.executeQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 1, name: "name" }] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(
      kysely.transaction().execute(async (trx) => {
        return trx.selectFrom("user").where("id", "=", 1).selectAll().executeTakeFirstOrThrow();
      }),
    ).resolves.toEqual({ id: 1, name: "name" });

    expect(connection.executeQuery).toHaveBeenCalledTimes(3);
    expect(connection.executeQuery.mock.calls).toEqual([
      [
        {
          parameters: [],
          query: {
            kind: "RawNode",
            parameters: [],
            sqlFragments: ["begin"],
          },
          sql: "begin",
        },
      ],
      [
        {
          parameters: [1],
          query: {
            from: {
              froms: [
                {
                  kind: "TableNode",
                  table: {
                    identifier: {
                      kind: "IdentifierNode",
                      name: "user",
                    },
                    kind: "SchemableIdentifierNode",
                  },
                },
              ],
              kind: "FromNode",
            },
            kind: "SelectQueryNode",
            selections: [
              {
                kind: "SelectionNode",
                selection: {
                  kind: "SelectAllNode",
                },
              },
            ],
            where: {
              kind: "WhereNode",
              where: {
                kind: "BinaryOperationNode",
                leftOperand: {
                  column: {
                    column: {
                      kind: "IdentifierNode",
                      name: "id",
                    },
                    kind: "ColumnNode",
                  },
                  kind: "ReferenceNode",
                  table: undefined,
                },
                operator: {
                  kind: "OperatorNode",
                  operator: "=",
                },
                rightOperand: {
                  kind: "ValueNode",
                  value: 1,
                },
              },
            },
          },
          sql: "select * from `user` where `id` = ?",
        },
      ],
      [
        {
          parameters: [],
          query: {
            kind: "RawNode",
            parameters: [],
            sqlFragments: ["commit"],
          },
          sql: "commit",
        },
      ],
    ]);
  });
});
