# Xportify

A TypeScript CLI tool that automatically generates and manages the `exports` field in your package.json file for ESM packages.

## Features

- Scans your distribution directory for JavaScript and TypeScript declaration files
- Automatically generates a proper `exports` object with import and types paths
- Validates project structure and required files
- Provides colorized console output for better readability
- Supports writing directly to your package.json file

## Installation

```bash
# Using npm
npm install -g xportify

# Using yarn
yarn global add xportify

# Using pnpm
pnpm add -g xportify
```

Or install it locally in your project:

```bash
# Using npm
npm install --save-dev xportify

# Using yarn
yarn add --dev xportify

# Using pnpm
pnpm add -D xportify
```

## Usage

```bash
xportify --project <project-path> [options]
```

### Required Arguments

- `-p, --project <path>`: Path to your project directory (required)

### Optional Arguments

- `-d, --dist <directory>`: Path to your distribution directory (default: "./dist")
- `-w, --write`: Write the generated exports to package.json (default: false)
- `-h, --help`: Display help information
- `-V, --version`: Display version information

## Examples

### Generate exports object without modifying package.json

```bash
xportify --project .
```

This will scan the default "./dist" directory and display the generated exports object in the console.

### Generate exports and write to package.json

```bash
xportify --project . --write
```

This will generate the exports object and update your package.json file.

### Specify a custom distribution directory

```bash
xportify --project . --dist ./build --write
```

This will scan the "./build" directory and update your package.json file.

## How It Works

1. Xportify scans your distribution directory for JavaScript (.js, .mjs) and TypeScript declaration (.d.ts) files
2. It generates an exports object with proper import and types paths for each file
3. If the `--write` flag is provided, it updates your package.json file with the generated exports

## Example Output

```json
{
  "exports": {
    "./utils": {
      "import": "./dist/utils.js",
      "types": "./dist/utils.d.ts"
    },
    "./helpers": {
      "import": "./dist/helpers.js",
      "types": "./dist/helpers.d.ts"
    }
  }
}
```

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build the project
pnpm build

# Run linting
pnpm check

# Fix linting issues
pnpm fix
```

## Requirements

- Node.js 16 or higher
- Package using ESM modules (type: "module" in package.json)

## License

MIT
