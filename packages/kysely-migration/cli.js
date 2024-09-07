#!/usr/bin/env node

const { relative, join } = require("node:path");
const { writeFileSync, mkdirSync } = require("node:fs");
const { parseArgs } = require("node:util");
const args = process.argv.slice(2);
const parsed = parseArgs({
  args,
  allowPositionals: true,
  options: {
    type: {
      type: "string",
      short: "t",
      default: "ts",
      multiple: false,
    },
    "no-down": {
      type: "boolean",
      default: false,
      multiple: false,
    },
  },
});

function errorText(text) {
  return `\u001b[31m${text}\u001b[0m`;
}

const migrationCommandName = "migration:create";

const usage = `Usage: nest-kysely ${migrationCommandName} [--type {ts,sql}] [--no-down] <migration-directory> <migration-filename>`;

const commandName = parsed.positionals[0];
const migrationDir = parsed.positionals[1];
const migrationName = parsed.positionals[2]?.replace(/\s+/g, "");

if (commandName !== migrationCommandName) {
  console.error(errorText(`Invalid command: ${parsed.positionals[0]}`));
  console.error(errorText(`Currently only ${migrationCommandName} is supported.`));
  console.info(usage);
  process.exit(1);
}

if (typeof migrationDir !== "string") {
  console.log(errorText(`Migration directory is required.`));
  console.info(usage);
  process.exit(1);
}

if (typeof migrationName !== "string") {
  console.log(errorText(`Migration name is required.`));
  console.info(usage);
  process.exit(1);
}

const timestamp = Date.now();
const migrationFilePath = join(migrationDir, `${timestamp}-${migrationName}.${parsed.values.type}`);

mkdirSync(migrationDir, { recursive: true });

if (parsed.values.type === "ts") {
  const migrationFileContent = [
    `import { Kysely, Migration } from "kysely";`,
    ``,
    `export class ${migrationName}${timestamp} implements Migration {`,
    `  public async up(db: Kysely<unknown>): Promise<void> {`,
    `  }`,
    parsed.values["no-down"]
      ? undefined
      : [`  public async down(db: Kysely<unknown>): Promise<void> {`, `  }`].join("\n"),
    `}`,
  ].filter((x) => x);

  writeFileSync(migrationFilePath, migrationFileContent.join("\n"));
}
if (parsed.values.type === "js") {
  const migrationFileContent = [
    `class ${migrationName}${timestamp} {`,
    `  async up(db) {`,
    `  }`,
    parsed.values["no-down"] ? undefined : [`  async down(db) {`, `  }`].join("\n"),
    `}`,
    ``,
    `module.exports = ${migrationName}${timestamp};`,
  ].filter((x) => x);

  writeFileSync(migrationFilePath, migrationFileContent.join("\n"));
} else {
  writeFileSync(migrationFilePath, "");
}

console.info(`Created migration file: ${relative(process.cwd(), migrationFilePath)}`);
