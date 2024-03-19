#!/usr/bin/env node

const { basename, dirname, relative, join } = require("node:path");
const { writeFileSync, mkdirSync } = require("node:fs");
const args = process.argv.slice(2);

var redColor = "\u001b[31m";
var reset = "\u001b[0m";

function errorText(text) {
  return `${redColor}${text}${reset}`;
}

const migrationCommandName = "migration:create";

const usage = `Usage: nest-kysely ${migrationCommandName} <migration-filename>`;

if (args[0] !== migrationCommandName) {
  console.error(errorText(`Invalid command: ${args[0]}`));
  console.error(errorText(`Currently only ${migrationCommandName} is supported.`));
  console.info(usage);
  process.exit(1);
}

if (typeof args[1] !== "string") {
  console.log(errorText(`Migration filename is required.`));
  console.info(usage);
  process.exit(1);
}

const timestamp = Date.now();
const migrationDir = dirname(args[1]);
const migrationName = basename(args[1]).replace(/\s+/g, "");

const migrationFilePath = join(migrationDir, `${timestamp}-${migrationName}.ts`);

const migrationFileContent = [
  `import { Kysely, Migration } from "kysely";`,
  ``,
  `export class ${migrationName}${timestamp} implements Migration {`,
  `  public async up(db: Kysely<any>): Promise<void> {`,
  `  }`,
  `  public async down(db: Kysely<any>): Promise<void> {`,
  `  }`,
  `}`,
];

mkdirSync(migrationDir, { recursive: true });
writeFileSync(migrationFilePath, migrationFileContent.join("\n"));
console.info(`Created migration file: ${relative(process.cwd(), migrationFilePath)}`);
