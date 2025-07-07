// Get package.json for version
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { Command } from "commander";
import { extract_exports } from "./commands/extract_exports.js";

const package_json = JSON.parse(
	readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize the CLI program
const program = new Command();

// Setup CLI configuration
program
	.name("xportify")
	.description("CLI to handle file paths")
	.version(package_json.version);

// Define the default command
program
	.option("-p, --project <path>", "Path to resolve to absolute")
	.option("-s, --src <directory>", "Relative source directory", "./src")
	.option("-d, --dist <directory>", "Relative destination directory", "./dist")
	.option("-w, --write", "Write exports to package.json", false)
	.action(extract_exports(program));

// Define version command
program.command("version").action(() => {
	console.log(`Version: ${chalk.green(program.version())}`);
});

// Parse command line arguments
program.parse(process.argv);
