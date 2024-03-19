#!/usr/bin/env node

const { relative, join } = require("node:path");
const { writeFileSync, mkdirSync } = require("node:fs");
const args = process.argv.slice(2);

function errorText(text) {
  return `\u001b[31m${text}\u001b[0m`;
}

const migrationCommandName = "migration:create";

const usage = `Usage: nest-kysely ${migrationCommandName} <migration-directory> <migration-filename>`;

const commandName = args[0];
const migrationDir = args[1];
const migrationName = args[2]?.replace(/\s+/g, "");

if (commandName !== migrationCommandName) {
  console.error(errorText(`Invalid command: ${args[0]}`));
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
const migrationFilePath = join(migrationDir, `${timestamp}-${migrationName}.ts`);

const migrationFileContent = [
  `import { Kysely, Migration } from "kysely";`,
  ``,
  `export class ${migrationName}${timestamp} implements Migration {`,
  `  public async up(db: Kysely<unknown>): Promise<void> {`,
  `  }`,
  `  public async down(db: Kysely<unknown>): Promise<void> {`,
  `  }`,
  `}`,
];

mkdirSync(migrationDir, { recursive: true });
writeFileSync(migrationFilePath, migrationFileContent.join("\n"));

console.info(`Created migration file: ${relative(process.cwd(), migrationFilePath)}`);
