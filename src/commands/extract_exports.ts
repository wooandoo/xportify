import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import type { Command } from "commander";
import glob from "fast-glob";

//  ██████╗ ██████╗ ███╗   ███╗███╗   ███╗ █████╗ ███╗   ██╗██████╗
// ██╔════╝██╔═══██╗████╗ ████║████╗ ████║██╔══██╗████╗  ██║██╔══██╗
// ██║     ██║   ██║██╔████╔██║██╔████╔██║███████║██╔██╗ ██║██║  ██║
// ██║     ██║   ██║██║╚██╔╝██║██║╚██╔╝██║██╔══██║██║╚██╗██║██║  ██║
// ╚██████╗╚██████╔╝██║ ╚═╝ ██║██║ ╚═╝ ██║██║  ██║██║ ╚████║██████╔╝
//  ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝

type ExtractExportsOptions = {
	project: string;
	src: string;
	dist: string;
	write: boolean;
};

export function extract_exports(program: Command) {
	return (options: ExtractExportsOptions) => {
		const absolute_project_path = check_validation(
			validate_project_path(options),
			"📁 Project path:",
		);

		// check if the package.json file exists
		const package_json_path = check_validation(
			validate_package_json(absolute_project_path),
			"📦 Package JSON path:",
		);

		const source_path = check_validation(
			validate_source_path(absolute_project_path, options),
			"📁 Source path:",
		);

		const destination_path = check_validation(
			validate_destination_path(absolute_project_path, options),
			"📁 Destination path:",
		);

		// use fast-glob to find all JavaScript and TypeScript files
		const all_source_file_pathes = glob.sync(
			["**/*.ts", "**/*.tsx", "**/*.js", "**/*.d.ts"],
			{
				cwd: source_path,
				absolute: false,
				ignore: ["**/node_modules/**", "**/dist/**", "**/*.stories.*", "**/stories/**", "**/vite-env.d.ts", "**/*.css"],
			},
		).filter(file => !file.includes('stories'));


		if (all_source_file_pathes.length === 0) {
			console.log(
				chalk.red(
					"No JavaScript/TypeScript files found in the source directory.",
				),
			);

			return;
		}

		const package_exports = generate_exports_object(
			all_source_file_pathes,
			source_path,
			destination_path,
		);

		// display the exports object
		console.log(chalk.green("\n🛠️Generated exports object:"));
		console.log(JSON.stringify({ exports: package_exports }, null, 2));
		console.log(chalk.green(`${Object.keys(package_exports).length} exports`));

		// Write to package.json if --write flag is provided
		if (options.write) {
			update_package_json_exports(package_json_path, package_exports);
		}
	};
}

// ██╗   ██╗ █████╗ ██╗     ██╗██████╗  █████╗ ████████╗██╗ ██████╗ ███╗   ██╗
// ██║   ██║██╔══██╗██║     ██║██╔══██╗██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║
// ██║   ██║███████║██║     ██║██║  ██║███████║   ██║   ██║██║   ██║██╔██╗ ██║
// ╚██╗ ██╔╝██╔══██║██║     ██║██║  ██║██╔══██║   ██║   ██║██║   ██║██║╚██╗██║
//  ╚████╔╝ ██║  ██║███████╗██║██████╔╝██║  ██║   ██║   ██║╚██████╔╝██║ ╚████║
//   ╚═══╝  ╚═╝  ╚═╝╚══════╝╚═╝╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝

/**
 * Result of a validation
 */
export type ValidationResult<TValue> =
	| { validated: true; data: TValue }
	| { validated: false; error: string };

/**
 * Check if the validation is valid
 */
const check_validation = <TResult>(
	validation: ValidationResult<TResult>,
	prefix_message?: string,
) => {
	if (!validation.validated) {
		console.log(chalk.red(`💥 ${validation.error}`));
		process.exit(1);
	}

	if (prefix_message !== undefined) {
		console.log(chalk.blue(prefix_message), validation.data);
	}
	return validation.data;
};

/**
 * Validate the project path
 */
function validate_project_path(
	options: ExtractExportsOptions,
): ValidationResult<string> {
	const project_path = options.project;

	if (!project_path) {
		return {
			validated: false,
			error: "No project path provided. Use --project option.",
		};
	}

	// absolute project path
	const absolute_project_path = path.resolve(process.cwd(), project_path);

	if (!fs.existsSync(absolute_project_path)) {
		return {
			validated: false,
			error: `Project directory "${absolute_project_path}" does not exist.`,
		};
	}

	return { validated: true, data: absolute_project_path };
}

/**
 * Validate the project path
 */
function validate_package_json(
	absolute_project_path: string,
): ValidationResult<string> {
	const package_json_path = path.join(absolute_project_path, "package.json");

	if (!fs.existsSync(package_json_path)) {
		return { validated: false, error: "package.json file not found." };
	}

	return { validated: true, data: package_json_path };
}

/**
 * Validate the source path
 */
function validate_source_path(
	absolute_project_path: string,
	options: ExtractExportsOptions,
): ValidationResult<string> {
	const source_path = path.resolve(absolute_project_path, options.src);

	if (!fs.existsSync(source_path)) {
		return { validated: false, error: "Source directory does not exist." };
	}

	return { validated: true, data: source_path };
}

/**
 * Validate the destination path
 */
function validate_destination_path(
	absolute_project_path: string,
	options: ExtractExportsOptions,
): ValidationResult<string> {
	const destination_path = path.resolve(absolute_project_path, options.dist);

	if (!fs.existsSync(destination_path)) {
		return { validated: false, error: "Destination directory does not exist." };
	}

	return { validated: true, data: destination_path };
}

//  ██████╗ ███████╗███╗   ██╗███████╗██████╗  █████╗ ████████╗███████╗    ███████╗██╗  ██╗██████╗  ██████╗ ██████╗ ████████╗███████╗
// ██╔════╝ ██╔════╝████╗  ██║██╔════╝██╔══██╗██╔══██╗╚══██╔══╝██╔════╝    ██╔════╝╚██╗██╔╝██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝
// ██║  ███╗█████╗  ██╔██╗ ██║█████╗  ██████╔╝███████║   ██║   █████╗      █████╗   ╚███╔╝ ██████╔╝██║   ██║██████╔╝   ██║   ███████╗
// ██║   ██║██╔══╝  ██║╚██╗██║██╔══╝  ██╔══██╗██╔══██║   ██║   ██╔══╝      ██╔══╝   ██╔██╗ ██╔═══╝ ██║   ██║██╔══██╗   ██║   ╚════██║
// ╚██████╔╝███████╗██║ ╚████║███████╗██║  ██║██║  ██║   ██║   ███████╗    ███████╗██╔╝ ██╗██║     ╚██████╔╝██║  ██║   ██║   ███████║
//  ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝    ╚══════╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝

const generate_exports_object = (
	all_source_file_pathes: string[],
	source_path: string,
	destination_path: string,
) => {
	return all_source_file_pathes.reduce(
		(exports, relative_file_path) => {
			// check if the file is a TypeScript file
			if (relative_file_path.endsWith(".ts") || relative_file_path.endsWith(".tsx")) {
				const file_import = extract_file_import_path(
					relative_file_path,
					destination_path,
				);

				const file_types = extract_file_types_path(
					relative_file_path,
					destination_path,
				);

				// Only export files that have at least one compiled output (.js or .d.ts)
				if (file_import !== undefined || file_types !== undefined) {
					// For files that only have .d.ts but no .js, we probably don't want to export them
					// unless they're specifically index files (which should be exported as entry points)
					const is_index_file = relative_file_path.endsWith("/index.ts") || 
										  relative_file_path.endsWith("/index.tsx") || 
										  relative_file_path === "index.ts" || 
										  relative_file_path === "index.tsx";
					
					// Skip files that only have types but no import, unless they're index files
					if (!file_import && !is_index_file) {
						return exports;
					}
					// Generate the export path
					let export_path: string;
					if (relative_file_path === "index.ts" || relative_file_path === "index.tsx") {
						// Root index.ts/tsx
						export_path = ".";
					} else if (relative_file_path.endsWith("/index.ts") || relative_file_path.endsWith("/index.tsx")) {
						// Subdirectory index.ts/tsx files
						export_path = `./${path.dirname(relative_file_path)}`;
					} else {
						// Regular files - remove the extension
						const dir = path.dirname(relative_file_path);
						const base = path.basename(relative_file_path, path.extname(relative_file_path));
						export_path = dir === "." ? `./${base}` : `./${dir}/${base}`;
					}

					exports[export_path] = {
						types: file_types,
						import: file_import,
					};
				}
			}

			return exports;
		},
		{} as Record<string, { import?: string; types?: string }>,
	);
};

const extract_file_import_path = (
	file_path: string,
	destination_path: string,
) => {
	const file_import_path = path.join(
		destination_path,
		path.dirname(file_path),
		`${path.basename(file_path, path.extname(file_path))}.js`,
	);

	return fs.existsSync(file_import_path)
		? `./${path.relative(path.join(destination_path, ".."), file_import_path)}`
		: undefined;
};

const extract_file_types_path = (
	file_path: string,
	destination_path: string,
) => {
	const file_types_path = path.join(
		destination_path,
		path.dirname(file_path),
		`${path.basename(file_path, path.extname(file_path))}.d.ts`,
	);

	return fs.existsSync(file_types_path)
		? `./${path.relative(path.join(destination_path, ".."), file_types_path)}`
		: undefined;
};

// ██╗   ██╗██████╗ ██████╗  █████╗ ████████╗███████╗    ███████╗██╗  ██╗██████╗  ██████╗ ██████╗ ████████╗███████╗
// ██║   ██║██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝██╔════╝    ██╔════╝╚██╗██╔╝██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝
// ██║   ██║██████╔╝██║  ██║███████║   ██║   █████╗      █████╗   ╚███╔╝ ██████╔╝██║   ██║██████╔╝   ██║   ███████╗
// ██║   ██║██╔═══╝ ██║  ██║██╔══██║   ██║   ██╔══╝      ██╔══╝   ██╔██╗ ██╔═══╝ ██║   ██║██╔══██╗   ██║   ╚════██║
// ╚██████╔╝██║     ██████╔╝██║  ██║   ██║   ███████╗    ███████╗██╔╝ ██╗██║     ╚██████╔╝██║  ██║   ██║   ███████║
//  ╚═════╝ ╚═╝     ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝    ╚══════╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝

const update_package_json_exports = (
	package_json_path: string,
	package_exports: Record<string, { import?: string; types?: string }>,
) => {
	try {
		// read the existing package.json
		const package_json_content = fs.readFileSync(package_json_path, "utf8");
		const package_json = JSON.parse(package_json_content);

		// Update the exports field
		package_json.exports = package_exports;

		// write back to package.json
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

		return;
	}
};

// Exporter les fonctions pour les tests
export const __tests__ = {
	generate_exports_object,
	update_package_json_exports,
};
