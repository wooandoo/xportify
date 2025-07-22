import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
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

export function extract_exports(options: ExtractExportsOptions) {
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

	// use fast-glob to find all JavaScript and TypeScript files in source
	const source_file_paths = glob
		.sync(["**/*.ts", "**/*.tsx", "**/*.js", "**/*.d.ts"], {
			cwd: source_path,
			absolute: false,
			ignore: [
				"**/node_modules/**",
				"**/dist/**",
				"**/*.stories.*",
				"**/stories/**",
				"**/vite-env.d.ts",
			],
		})
		.filter((file) => !file.includes("stories"));

	// Find CSS files in destination directory
	const css_file_paths = glob
		.sync(["**/*.css"], {
			cwd: destination_path,
			absolute: false,
			ignore: ["**/node_modules/**"],
		})
		.filter((file) => !file.includes("stories"));

	const all_file_paths = [...source_file_paths, ...css_file_paths];

	if (all_file_paths.length === 0) {
		console.log(chalk.red("No JavaScript/TypeScript/CSS files found."));

		return;
	}

	const package_exports = generate_exports_object(
		source_file_paths,
		css_file_paths,
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

type ExportEntry = {
	import?: string;
	types?: string;
	style?: string;
};

type ExportMap = Record<string, ExportEntry>;

/**
 * Determines if a source file is an index file (root or nested)
 *
 * @param file_path - The relative path of the source file
 * @returns True if the file is an index file
 * @example
 * is_index_file('index.ts') // true
 * is_index_file('components/Button/index.tsx') // true
 * is_index_file('utils/helper.ts') // false
 */
const is_index_file = (file_path: string): boolean => {
	return (
		file_path === "index.ts" ||
		file_path === "index.tsx" ||
		file_path.endsWith("/index.ts") ||
		file_path.endsWith("/index.tsx")
	);
};

/**
 * Determines if a file should be exported based on compiled outputs
 *
 * @param has_import - Whether the file has a compiled .js file
 * @param has_types - Whether the file has a compiled .d.ts file
 * @param file_path - The relative path of the source file
 * @returns True if the file should be exported
 * @example
 * should_export_file(true, true, 'Button/index.tsx') // true
 * should_export_file(false, true, 'utils/helper.ts') // false
 * should_export_file(false, true, 'types/index.ts') // true
 */
const should_export_file = (
	has_import: boolean,
	has_types: boolean,
	file_path: string,
): boolean => {
	const has_any_output = has_import || has_types;
	if (!has_any_output) {
		return false;
	}

	// Always export index files (they are entry points)
	if (is_index_file(file_path)) {
		return true;
	}

	// For non-index files, only export if they have a JS file (not just types)
	return has_import;
};

/**
 * Generates the export path for a source file
 *
 * @param file_path - The relative path of the source file
 * @returns The export path to use in package.json exports
 * @example
 * generate_export_path('index.ts') // '.'
 * generate_export_path('components/Button/index.tsx') // './components/Button'
 * generate_export_path('utils/helper.ts') // './utils/helper'
 */
const generate_export_path = (file_path: string): string => {
	// Root index file
	if (file_path === "index.ts" || file_path === "index.tsx") {
		return ".";
	}

	// Nested index files - export directory without /index suffix
	if (file_path.endsWith("/index.ts") || file_path.endsWith("/index.tsx")) {
		return `./${path.dirname(file_path)}`;
	}

	// Regular files - remove extension
	const directory = path.dirname(file_path);
	const base_name = path.basename(file_path, path.extname(file_path));

	return directory === "." ? `./${base_name}` : `./${directory}/${base_name}`;
};

/**
 * Processes a single TypeScript file and creates its export entry if applicable
 *
 * @param file_path - The relative path of the source file
 * @param destination_path - The path to the compiled output directory
 * @returns Export entry or null if file should not be exported
 * @example
 * process_typescript_file('components/Button/index.tsx', './dist')
 * // { import: './dist/components/Button/index.js', types: './dist/components/Button/index.d.ts' }
 */
const process_typescript_file = (
	file_path: string,
	destination_path: string,
): { export_path: string; entry: ExportEntry } | null => {
	const import_path = find_compiled_js_file(file_path, destination_path);
	const types_path = find_compiled_types_file(file_path, destination_path);

	const has_import = import_path !== undefined;
	const has_types = types_path !== undefined;

	if (!should_export_file(has_import, has_types, file_path)) {
		return null;
	}

	const export_path = generate_export_path(file_path);
	const export_entry: ExportEntry = {
		types: types_path,
		import: import_path,
	};

	return { export_path, entry: export_entry };
};

/**
 * Generates the complete exports object for package.json
 *
 * @param source_file_paths - Array of relative paths to source files (TS/JS)
 * @param css_file_paths - Array of relative paths to CSS files in destination
 * @param destination_path - The path to the compiled output directory
 * @returns Export map for package.json exports field
 * @example
 * generate_exports_object(['index.ts'], ['styles.css'], './dist')
 * // { '.': { import: './dist/index.js', types: './dist/index.d.ts' }, './styles.css': { style: './dist/styles.css' } }
 */
const generate_exports_object = (
	source_file_paths: string[],
	css_file_paths: string[],
	destination_path: string,
): ExportMap => {
	const exports: ExportMap = {};

	// Process TypeScript/JavaScript files
	for (const file_path of source_file_paths) {
		const is_typescript =
			file_path.endsWith(".ts") || file_path.endsWith(".tsx");

		if (is_typescript) {
			const result = process_typescript_file(file_path, destination_path);

			if (result !== null) {
				exports[result.export_path] = result.entry;
			}
		}
	}

	// Process CSS files from destination directory
	for (const css_path of css_file_paths) {
		const result = process_css_file(css_path, destination_path);

		if (result !== null) {
			// Check if there's already an export with the same base name (without .css extension)
			const base_export_path = result.export_path.replace(/\.css$/, "");
			if (exports[base_export_path]) {
				// Merge CSS with existing TS/JS export
				exports[base_export_path] = {
					...exports[base_export_path],
					...result.entry,
				};
			} else {
				// Create standalone CSS export
				exports[result.export_path] = result.entry;
			}
		}
	}

	return exports;
};

/**
 * Finds the compiled JavaScript file for a TypeScript source file
 *
 * @param source_file_path - The relative path of the source file
 * @param destination_path - The path to the compiled output directory
 * @returns The relative path to the .js file or undefined if not found
 * @example
 * find_compiled_js_file('components/Button/index.tsx', './dist')
 * // './dist/components/Button/index.js'
 */
const find_compiled_js_file = (
	source_file_path: string,
	destination_path: string,
): string | undefined => {
	const base_name = path.basename(
		source_file_path,
		path.extname(source_file_path),
	);
	const directory = path.dirname(source_file_path);

	const compiled_file_path = path.join(
		destination_path,
		directory,
		`${base_name}.js`,
	);

	if (!fs.existsSync(compiled_file_path)) {
		return undefined;
	}

	return `./${path.relative(path.join(destination_path, ".."), compiled_file_path)}`;
};

/**
 * Finds the compiled TypeScript declaration file for a source file
 *
 * @param source_file_path - The relative path of the source file
 * @param destination_path - The path to the compiled output directory
 * @returns The relative path to the .d.ts file or undefined if not found
 * @example
 * find_compiled_types_file('components/Button/index.tsx', './dist')
 * // './dist/components/Button/index.d.ts'
 */
const find_compiled_types_file = (
	source_file_path: string,
	destination_path: string,
): string | undefined => {
	const base_name = path.basename(
		source_file_path,
		path.extname(source_file_path),
	);
	const directory = path.dirname(source_file_path);

	const compiled_types_path = path.join(
		destination_path,
		directory,
		`${base_name}.d.ts`,
	);

	if (!fs.existsSync(compiled_types_path)) {
		return undefined;
	}

	return `./${path.relative(path.join(destination_path, ".."), compiled_types_path)}`;
};

// Note: find_compiled_css_file function is no longer needed since we scan destination directly

/**
 * Processes a single CSS file and creates its export entry if applicable
 *
 * @param file_path - The relative path of the CSS file in destination directory
 * @param destination_path - The path to the compiled output directory
 * @returns Export entry or null if file should not be exported
 * @example
 * process_css_file('styles/main.css', './dist')
 * // { export_path: './styles/main.css', entry: { style: './dist/styles/main.css' } }
 */
const process_css_file = (
	file_path: string,
	destination_path: string,
): { export_path: string; entry: ExportEntry } | null => {
	// CSS file path is already relative to destination, so we can build the style path directly
	const style_path = `./${path.relative(path.join(destination_path, ".."), path.join(destination_path, file_path))}`;

	// Generate export path for CSS files (keep .css extension)
	const export_path =
		file_path === "index.css" ? "./index.css" : `./${file_path}`;

	const export_entry: ExportEntry = {
		style: style_path,
	};

	return { export_path, entry: export_entry };
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
