import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { Command } from "commander";
import glob from "fast-glob";

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize the CLI program
const program = new Command();

// Setup CLI configuration
program
	.name("xportify")
	.description("CLI to handle file paths")
	.version("1.0.0");

// Define the command
program
	.option("-i, --input <path>", "Path to resolve to absolute")
	.option("-d, --dist <directory>", "Destination directory", "./dist")
	.option("-w, --write", "Write exports to package.json", false)
	.action((options) => {
		const input_path = options.input;

		if (!input_path) {
			console.log(
				chalk.red("Error: No input path provided. Use --input option."),
			);
			program.help();
			return;
		}

		// Resolve the relative path to absolute
		const project_path = path.resolve(process.cwd(), input_path);

		// Resolve the combined path (src + input)
		const destination_path = path.resolve(
			process.cwd(),
			project_path,
			options.dist,
		);

		console.log(chalk.blue("📁 Project path:"), project_path);

		// Check if the project directory exists
		if (!fs.existsSync(project_path)) {
			console.log(chalk.red("Error: Project directory does not exist."));
			program.help();
			process.exit(1);
		}

		// Check if the package.json file exists
		const package_json_path = path.join(project_path, "package.json");

		if (!fs.existsSync(package_json_path)) {
			console.log(chalk.red("Error: package.json file not found."));
			program.help();
			process.exit(1);
		}

		console.log(chalk.green("✅  validated"));

		console.log(chalk.blue("\n📁 Destination path:"), destination_path);

		// Check if the destination directory exists
		if (!fs.existsSync(destination_path)) {
			console.log(chalk.red("Error: Destination directory does not exist."));
			program.help();
			process.exit(1);
		}

		console.log(chalk.green("✅  validated"));

		// Use fast-glob to find all JavaScript and TypeScript files
		const all_source_file_pathes = glob.sync(
			["**/*.js", "**/*.mjs", "**/*.d.ts"],
			{
				cwd: destination_path,
				absolute: false,
				ignore: ["**/node_modules/**", "**/dist/**"],
			},
		);

		if (all_source_file_pathes.length > 0) {
			// Generate exports object
			const generate_exports_object = () => {
				const all_exports = {} as Record<
					string,
					{ import: string; types: string }
				>;

				console.log(all_source_file_pathes);

				all_source_file_pathes.forEach((file_path) => {
					// Remove file extension
					const file_key = file_path
						.replace(/\.(js|mjs|d.ts)$/, "")
						.replace(/\/index$/, "");

					// Create the export entry
					const file_entry = all_exports[`./${file_key}`] ?? {};

					console.log(file_path);
					if (file_path.endsWith(".d.ts")) {
						file_entry.types = `./${file_path}`;
					} else {
						file_entry.import = `./${file_path}`;
					}

					all_exports[`./${file_key}`] = file_entry;
				});

				return all_exports;
			};

			const package_exports = generate_exports_object();

			// Display the exports object
			console.log(chalk.green("\n🛠️Generated exports object:"));
			console.log(JSON.stringify({ exports: package_exports }, null, 2));

			// Write to package.json if --write flag is provided
			if (options.write) {
				update_package_json_exports(package_json_path, package_exports);
			}
		} else {
			console.log(
				chalk.red(
					"No JavaScript/TypeScript files found in the source directory.",
				),
			);
		}
	});

// Parse command line arguments
program.parse(process.argv);

const update_package_json_exports = (
	package_json_path: string,
	package_exports: Record<string, { import: string; types: string }>,
) => {
	try {
		// Read the existing package.json
		const package_json_content = fs.readFileSync(package_json_path, "utf8");
		const package_json = JSON.parse(package_json_content);

		// Update the exports field
		package_json.exports = package_exports;

		// Write back to package.json
		fs.writeFileSync(
			package_json_path,
			JSON.stringify(package_json, null, 2),
			"utf8",
		);

		console.log(
			chalk.green(
				"\nSuccessfully updated package.json with exports configuration.",
			),
		);
	} catch (error) {
		// @ts-ignore
		console.log(chalk.red(`\nError updating package.json: ${error.message}`));
		process.exit(1);
	}
};
