# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a TypeScript library starter template that provides a modern development setup for creating publishable JavaScript/TypeScript libraries. The project uses unbuild for library bundling and Vite for the development playground.

## Common Development Commands

### Development & Testing

```bash
# Start development playground with live reload
pnpm dev

# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm coverage

# Run a specific test file
pnpm test tests/unit.test.ts
```

### Building & Distribution

```bash
# Build the library for distribution (outputs to dist/)
pnpm build

# Build the playground for preview/deployment
pnpm generate
```

### Code Quality

```bash
# Lint TypeScript files
pnpm lint

# Auto-fix linting issues
pnpm lint --fix
```

### Release & Publishing

```bash
# Full release process (test, version bump, tag, publish)
pnpm release
```

## Architecture Overview

### Project Structure

- **`src/`** - Library source code (entry point: `index.ts`)
- **`dist/`** - Built library output (CJS and ESM formats)
- **`playground/`** - Vite-powered development environment for testing library
- **`tests/`** - Vitest unit tests

### Build System

- **Unbuild**: Primary library bundler that outputs both CommonJS and ES modules
- **Vite**: Development server for the playground environment
- **TypeScript**: Type checking and compilation
- **Vitest**: Testing framework with Jest-compatible API

### Path Aliases

The project uses consistent path aliases across all configurations:

- `@/*` maps to `./src/*` (library source)
- `~/*` maps to `./playground/*` (playground files)

### Output Formats

The library builds to multiple formats for maximum compatibility:

- **ESM**: `dist/index.mjs` (modern module format)
- **CJS**: `dist/index.cjs` (Node.js compatibility)
- **Types**: `dist/index.d.ts` (TypeScript declarations)

### Development Workflow

1. Write library code in `src/`
2. Test functionality in `playground/` using `pnpm dev`
3. Write unit tests in `tests/`
4. Build with `pnpm build` to generate distribution files
5. Use `pnpm release` for version management and publishing

### Quality Control

- **Husky** pre-commit hooks run lint-staged
- **lint-staged** runs ESLint and Prettier on staged files
- **ESLint** with TypeScript support and Prettier integration
- **Vitest** for unit testing with coverage reporting

### Key Configuration Files

- **`build.config.ts`** - Unbuild configuration for library compilation
- **`vitest.config.ts`** - Test runner configuration
- **`playground/vite.config.ts`** - Development playground configuration
- **`tsconfig.json`** - TypeScript compiler options and path mapping

## Testing Strategy

The project uses Vitest for testing with a simple setup. Tests should be placed in the `tests/` directory and follow the naming pattern `*.test.ts`.

To test library functionality during development:

1. Use the playground (`pnpm dev`) for manual testing and experimentation
2. Write unit tests for automated verification
3. Use coverage reports to ensure adequate test coverage
