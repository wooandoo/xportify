# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Xportify is a CLI tool that automatically generates and manages the `exports` field in package.json files for ESM packages. It scans distribution directories for JavaScript/TypeScript files and creates proper export mappings with both import and types paths.

## Development Commands

```bash
# Install dependencies
pnpm install

# Run in development mode (uses tsx for hot reload)
pnpm dev

# Build the project (compiles TypeScript to dist/)
pnpm build

# Run compiled version
pnpm start

# Run tests
pnpm test          # Run once
pnpm test:watch    # Watch mode

# Code quality
pnpm check         # Check code style and linting
pnpm fix           # Auto-fix code style issues
```

## Architecture

The codebase follows a simple CLI application structure:

- **`/bin/xportify.js`**: CLI entry point
- **`/src/index.ts`**: Main CLI setup using Commander.js
- **`/src/commands/extract_exports.ts`**: Core logic for scanning files and generating exports
- **`/dist/`**: Compiled JavaScript output (ESM)

### Key Design Patterns

1. **Validation-First**: All operations validate inputs before execution using `ValidationResult<T>` types
2. **Snake_case naming**: Functions and variables use snake_case (e.g., `extract_exports`, `validate_project_path`)
3. **Type definitions**: Use `type` not `interface`
4. **ESM-only**: Project uses pure ESM modules (`"type": "module"`)
5. **ASCII art dividers**: Large ASCII comments separate logical sections in code

## Working with the CLI

When developing CLI features:

1. The main command runs without subcommands: `xportify --project <path>`
2. Default behavior is dry-run (shows output without modifying files)
3. Use `--write` flag to actually modify package.json
4. All error messages should use chalk for colored output
5. Validation errors should be descriptive and actionable

## Testing New Features

Currently, the test directory is empty. When adding tests:
- Use Vitest framework (already configured)
- Test files should use `.test.ts` or `.spec.ts` extensions
- Run tests with `pnpm test` or `pnpm test:watch`

## Important Implementation Details

1. **Export Generation Logic** (`src/commands/extract_exports.ts`):
   - Uses fast-glob to scan for `.js`, `.mjs`, and `.d.ts` files
   - Generates relative paths starting with `./`
   - Groups import and types paths for each export
   - Validates that distribution directory exists and contains files

2. **CLI Options**:
   - `-p, --project <path>`: Required, path to project
   - `-d, --dist <directory>`: Optional, defaults to "./dist"
   - `-w, --write`: Optional, updates package.json when provided

3. **Build Process**:
   - Uses tsdown for TypeScript compilation
   - Targets ES2016 with ESNext modules
   - Outputs to `/dist` directory

## Common Development Tasks

When modifying the export generation logic:
1. Check `extract_exports` function in `src/commands/extract_exports.ts`
2. Test with a local project using `pnpm dev -p <project-path>`
3. Verify generated exports format matches ESM subpath exports specification
4. Ensure both `.js` and `.d.ts` files are properly paired

When adding new CLI options:
1. Update command definition in `src/index.ts`
2. Add validation in `extract_exports.ts` if needed
3. Update README.md with new option documentation