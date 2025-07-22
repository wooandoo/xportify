import fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __tests__ } from "./extract_exports";

const { generate_exports_object, update_package_json_exports } = __tests__;

// Utility function to create temporary directory structure
const create_temp_directory = () => {
	const temp_dir = fs.mkdtempSync(path.join(tmpdir(), "xportify-test-"));
	return temp_dir;
};

// Utility function to create file with directory structure
const create_file = (
	base_path: string,
	relative_path: string,
	content = "",
) => {
	const full_path = path.join(base_path, relative_path);
	const dir = path.dirname(full_path);
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(full_path, content);
};

describe("generate_exports_object", () => {
	let temp_dir: string;
	let source_path: string;
	let destination_path: string;

	beforeEach(() => {
		temp_dir = create_temp_directory();
		source_path = path.join(temp_dir, "src");
		destination_path = path.join(temp_dir, "dist");
		fs.mkdirSync(source_path, { recursive: true });
		fs.mkdirSync(destination_path, { recursive: true });
	});

	afterEach(() => {
		fs.rmSync(temp_dir, { recursive: true, force: true });
	});

	describe("index files handling", () => {
		it("should export root index.ts as '.'", () => {
			// Create source and compiled files
			create_file(source_path, "index.ts");
			create_file(destination_path, "index.js");
			create_file(destination_path, "index.d.ts");

			const result = generate_exports_object(
				["index.ts"],
				[], // no CSS files
				destination_path,
			);

			expect(result).toEqual({
				".": {
					import: "./dist/index.js",
					types: "./dist/index.d.ts",
				},
			});
		});

		it("should export root index.tsx as '.'", () => {
			create_file(source_path, "index.tsx");
			create_file(destination_path, "index.js");
			create_file(destination_path, "index.d.ts");

			const result = generate_exports_object(
				["index.tsx"],
				[], // no CSS files
				destination_path,
			);

			expect(result).toEqual({
				".": {
					import: "./dist/index.js",
					types: "./dist/index.d.ts",
				},
			});
		});

		it("should export nested index files without /index suffix", () => {
			create_file(source_path, "components/Button/index.tsx");
			create_file(destination_path, "components/Button/index.js");
			create_file(destination_path, "components/Button/index.d.ts");

			const result = generate_exports_object(
				["components/Button/index.tsx"],
				[], // no CSS files
				destination_path,
			);

			expect(result).toEqual({
				"./components/Button": {
					import: "./dist/components/Button/index.js",
					types: "./dist/components/Button/index.d.ts",
				},
			});
		});
	});

	describe("regular files handling", () => {
		it("should export regular TypeScript files with both js and d.ts", () => {
			create_file(source_path, "utils/helper.ts");
			create_file(destination_path, "utils/helper.js");
			create_file(destination_path, "utils/helper.d.ts");

			const result = generate_exports_object(
				["utils/helper.ts"],
				[], // no CSS files
				destination_path,
			);

			expect(result).toEqual({
				"./utils/helper": {
					import: "./dist/utils/helper.js",
					types: "./dist/utils/helper.d.ts",
				},
			});
		});

		it("should not export files with only d.ts (no js output)", () => {
			create_file(source_path, "types/definitions.ts");
			create_file(destination_path, "types/definitions.d.ts");
			// No .js file created

			const result = generate_exports_object(
				["types/definitions.ts"],
				[], // no CSS files
				destination_path,
			);

			expect(result).toEqual({});
		});

		it("should export type-only index files even without js", () => {
			create_file(source_path, "types/index.ts");
			create_file(destination_path, "types/index.d.ts");
			// No .js file created

			const result = generate_exports_object(
				["types/index.ts"],
				[], // no CSS files
				destination_path,
			);

			expect(result).toEqual({
				"./types": {
					types: "./dist/types/index.d.ts",
					import: undefined,
				},
			});
		});
	});

	describe("CSS files handling", () => {
		it("should export CSS files with .css extension in export path", () => {
			create_file(destination_path, "styles.css");

			const result = generate_exports_object(
				[], // no TS files
				["styles.css"], // CSS files from destination
				destination_path,
			);

			expect(result).toEqual({
				"./styles.css": {
					import: "./dist/styles.css",
				},
			});
		});

		it("should handle nested CSS files with .css extension", () => {
			create_file(destination_path, "theme/dark.css");

			const result = generate_exports_object(
				[],
				["theme/dark.css"],
				destination_path,
			);

			expect(result).toEqual({
				"./theme/dark.css": {
					import: "./dist/theme/dark.css",
				},
			});
		});

		it("should merge CSS with TypeScript exports when same base name", () => {
			// TypeScript component files
			create_file(source_path, "components/button.ts");
			create_file(destination_path, "components/button.js");
			create_file(destination_path, "components/button.d.ts");

			// CSS file in destination
			create_file(destination_path, "components/button.css");

			const result = generate_exports_object(
				["components/button.ts"], // TS from source
				["components/button.css"], // CSS from destination
				destination_path,
			);

			expect(result).toEqual({
				"./components/button": {
					import: "./dist/components/button.js",
					types: "./dist/components/button.d.ts",
				},
				"./components/button.css": {
					import: "./dist/components/button.css",
				},
			});
		});

		it("should handle index.css files", () => {
			create_file(destination_path, "index.css");

			const result = generate_exports_object(
				[],
				["index.css"],
				destination_path,
			);

			expect(result).toEqual({
				"./index.css": {
					import: "./dist/index.css",
				},
			});
		});
	});

	describe("file filtering", () => {
		it("should skip non-TypeScript and non-CSS files", () => {
			const result = generate_exports_object(
				["README.md", "config.json"], // non-TS files
				[], // no CSS files
				destination_path,
			);

			expect(result).toEqual({});
		});

		it("should skip files without any compiled output", () => {
			create_file(source_path, "unused.ts");
			// No compiled files created

			const result = generate_exports_object(
				["unused.ts"],
				[], // no CSS files
				destination_path,
			);

			expect(result).toEqual({});
		});
	});

	describe("complex scenarios", () => {
		it("should handle multiple files with mixed output types", () => {
			// Root index
			create_file(source_path, "index.ts");
			create_file(destination_path, "index.js");
			create_file(destination_path, "index.d.ts");

			// Component with both outputs
			create_file(source_path, "components/Button/index.tsx");
			create_file(destination_path, "components/Button/index.js");
			create_file(destination_path, "components/Button/index.d.ts");

			// Utility with both outputs
			create_file(source_path, "utils/format.ts");
			create_file(destination_path, "utils/format.js");
			create_file(destination_path, "utils/format.d.ts");

			// Type-only file (not index)
			create_file(source_path, "types/common.ts");
			create_file(destination_path, "types/common.d.ts");

			// Type-only index file
			create_file(source_path, "types/index.ts");
			create_file(destination_path, "types/index.d.ts");

			const result = generate_exports_object(
				[
					"index.ts",
					"components/Button/index.tsx",
					"utils/format.ts",
					"types/common.ts",
					"types/index.ts",
				],
				[], // no CSS files
				destination_path,
			);

			expect(result).toEqual({
				".": {
					import: "./dist/index.js",
					types: "./dist/index.d.ts",
				},
				"./components/Button": {
					import: "./dist/components/Button/index.js",
					types: "./dist/components/Button/index.d.ts",
				},
				"./utils/format": {
					import: "./dist/utils/format.js",
					types: "./dist/utils/format.d.ts",
				},
				"./types": {
					import: undefined,
					types: "./dist/types/index.d.ts",
				},
			});
		});

		it("should handle mixed TypeScript and CSS files", () => {
			// Root index
			create_file(source_path, "index.ts");
			create_file(destination_path, "index.js");
			create_file(destination_path, "index.d.ts");

			// Global styles (in destination only)
			create_file(destination_path, "styles.css");

			// Component with JS/TS and CSS
			create_file(source_path, "components/Button.tsx");
			create_file(destination_path, "components/Button.js");
			create_file(destination_path, "components/Button.d.ts");
			create_file(destination_path, "components/Button.css");

			// Theme CSS files (in destination only)
			create_file(destination_path, "theme/dark.css");
			create_file(destination_path, "theme/light.css");

			const result = generate_exports_object(
				["index.ts", "components/Button.tsx"], // TS files from source
				[
					"styles.css",
					"components/Button.css",
					"theme/dark.css",
					"theme/light.css",
				], // CSS files from destination
				destination_path,
			);

			expect(result).toEqual({
				".": {
					import: "./dist/index.js",
					types: "./dist/index.d.ts",
				},
				"./components/Button": {
					import: "./dist/components/Button.js",
					types: "./dist/components/Button.d.ts",
				},
				"./styles.css": {
					import: "./dist/styles.css",
				},
				"./components/Button.css": {
					import: "./dist/components/Button.css",
				},
				"./theme/dark.css": {
					import: "./dist/theme/dark.css",
				},
				"./theme/light.css": {
					import: "./dist/theme/light.css",
				},
			});
		});

		it("should handle deeply nested structures", () => {
			create_file(source_path, "features/auth/components/LoginForm/index.tsx");
			create_file(
				destination_path,
				"features/auth/components/LoginForm/index.js",
			);
			create_file(
				destination_path,
				"features/auth/components/LoginForm/index.d.ts",
			);

			const result = generate_exports_object(
				["features/auth/components/LoginForm/index.tsx"],
				[], // no CSS files
				destination_path,
			);

			expect(result).toEqual({
				"./features/auth/components/LoginForm": {
					import: "./dist/features/auth/components/LoginForm/index.js",
					types: "./dist/features/auth/components/LoginForm/index.d.ts",
				},
			});
		});
	});
});

describe("update_package_json_exports", () => {
	let temp_dir: string;
	let package_json_path: string;

	beforeEach(() => {
		temp_dir = create_temp_directory();
		package_json_path = path.join(temp_dir, "package.json");
	});

	afterEach(() => {
		fs.rmSync(temp_dir, { recursive: true, force: true });
	});

	it("should update package.json with exports field", () => {
		// Create initial package.json
		const initial_package_json = {
			name: "test-package",
			version: "1.0.0",
			description: "Test package",
		};
		fs.writeFileSync(
			package_json_path,
			JSON.stringify(initial_package_json, null, 2),
		);

		const exports_to_add = {
			".": {
				import: "./dist/index.js",
				types: "./dist/index.d.ts",
			},
			"./utils": {
				import: "./dist/utils/index.js",
				types: "./dist/utils/index.d.ts",
			},
		};

		update_package_json_exports(package_json_path, exports_to_add);

		// Read and verify updated package.json
		const updated_content = fs.readFileSync(package_json_path, "utf8");
		const updated_package_json = JSON.parse(updated_content);

		expect(updated_package_json).toEqual({
			name: "test-package",
			version: "1.0.0",
			description: "Test package",
			exports: exports_to_add,
		});
	});

	it("should overwrite existing exports field", () => {
		// Create package.json with existing exports
		const initial_package_json = {
			name: "test-package",
			version: "1.0.0",
			exports: {
				".": "./old/path.js",
			},
		};
		fs.writeFileSync(
			package_json_path,
			JSON.stringify(initial_package_json, null, 2),
		);

		const new_exports = {
			".": {
				import: "./dist/index.js",
				types: "./dist/index.d.ts",
			},
		};

		update_package_json_exports(package_json_path, new_exports);

		const updated_content = fs.readFileSync(package_json_path, "utf8");
		const updated_package_json = JSON.parse(updated_content);

		expect(updated_package_json.exports).toEqual(new_exports);
	});

	it("should preserve package.json formatting (2 spaces)", () => {
		const initial_package_json = {
			name: "test-package",
			version: "1.0.0",
		};
		fs.writeFileSync(
			package_json_path,
			JSON.stringify(initial_package_json, null, 2),
		);

		update_package_json_exports(package_json_path, {
			".": { import: "./dist/index.js" },
		});

		const updated_content = fs.readFileSync(package_json_path, "utf8");
		// Check that content uses 2-space indentation
		expect(updated_content).toContain('  "name":');
		expect(updated_content).toContain('  "exports":');
	});

	it("should handle package.json with complex structure", () => {
		const complex_package_json = {
			name: "complex-package",
			version: "2.0.0",
			description: "A complex package",
			main: "./dist/index.js",
			types: "./dist/index.d.ts",
			scripts: {
				build: "tsdown",
				test: "vitest",
			},
			dependencies: {
				chalk: "^5.0.0",
			},
			devDependencies: {
				vitest: "^1.0.0",
			},
		};
		fs.writeFileSync(
			package_json_path,
			JSON.stringify(complex_package_json, null, 2),
		);

		const exports_to_add = {
			".": {
				import: "./dist/index.js",
				types: "./dist/index.d.ts",
			},
		};

		update_package_json_exports(package_json_path, exports_to_add);

		const updated_content = fs.readFileSync(package_json_path, "utf8");
		const updated_package_json = JSON.parse(updated_content);

		// Verify all original fields are preserved
		expect(updated_package_json.name).toBe("complex-package");
		expect(updated_package_json.scripts).toEqual(complex_package_json.scripts);
		expect(updated_package_json.dependencies).toEqual(
			complex_package_json.dependencies,
		);
		expect(updated_package_json.exports).toEqual(exports_to_add);
	});

	it("should handle errors gracefully", () => {
		// Mock console.log to capture error output
		const console_spy = vi.spyOn(console, "log").mockImplementation(() => {});

		// Try to update non-existent file
		update_package_json_exports("/non/existent/package.json", {});

		// Verify error was logged
		expect(console_spy).toHaveBeenCalled();
		const error_call = console_spy.mock.calls.find((call) =>
			call[0]?.includes?.("Error updating package.json"),
		);
		expect(error_call).toBeTruthy();

		console_spy.mockRestore();
	});
});

describe("Edge cases and error scenarios", () => {
	let temp_dir: string;
	let source_path: string;
	let destination_path: string;

	beforeEach(() => {
		temp_dir = create_temp_directory();
		source_path = path.join(temp_dir, "src");
		destination_path = path.join(temp_dir, "dist");
		fs.mkdirSync(source_path, { recursive: true });
		fs.mkdirSync(destination_path, { recursive: true });
	});

	afterEach(() => {
		fs.rmSync(temp_dir, { recursive: true, force: true });
	});

	it("should handle empty source file list", () => {
		const result = generate_exports_object([], [], destination_path);
		expect(result).toEqual({});
	});

	it("should handle files with special characters in names", () => {
		create_file(source_path, "utils/@special-file.ts");
		create_file(destination_path, "utils/@special-file.js");
		create_file(destination_path, "utils/@special-file.d.ts");

		const result = generate_exports_object(
			["utils/@special-file.ts"],
			[], // no CSS files
			destination_path,
		);

		expect(result).toEqual({
			"./utils/@special-file": {
				import: "./dist/utils/@special-file.js",
				types: "./dist/utils/@special-file.d.ts",
			},
		});
	});

	it("should handle files at root level (not in subdirectories)", () => {
		create_file(source_path, "config.ts");
		create_file(destination_path, "config.js");
		create_file(destination_path, "config.d.ts");

		const result = generate_exports_object(
			["config.ts"],
			[], // no CSS files
			destination_path,
		);

		expect(result).toEqual({
			"./config": {
				import: "./dist/config.js",
				types: "./dist/config.d.ts",
			},
		});
	});
});
