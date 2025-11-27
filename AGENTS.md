# AGENTS.md

## Project Overview

This is a JavaScript/TypeScript library for **TRON (Token Reduced Object Notation)**, a data serialization format extended from JSON with token efficiency features. TRON reduces token count for LLMs by defining reusable class schemas for objects with repeated structures.

For complete TRON specification, see: https://tron-format.github.io/

### Key Features
- Parse TRON format strings into JavaScript objects
- Stringify JavaScript objects into TRON format
- Automatically discovers and creates class definitions for repeated object structures
- Significantly reduces token count compared to JSON (e.g., 592 tokens vs 776 tokens for weather API example)

### Core API
- `TRON.stringify(value)` - Convert JavaScript value to TRON format string
- `TRON.parse(tron)` - Convert TRON format string back to JavaScript value

## Setup Commands

### Install Dependencies
```bash
pnpm install
```

### Build Project
```bash
pnpm run build
```
This compiles TypeScript source files from `src/` to JavaScript in `dist/`.

### Run Tests
```bash
pnpm test
```
Uses Vitest to run all test files in the `test/` directory.

## Code Style & Standards

### TypeScript Configuration
- **Strict mode enabled**: All strict type checking options are on
- **Target**: ES2020
- **Module system**: NodeNext (ES modules)
- **Declaration files**: Generated automatically in `dist/`

### Code Conventions
- Use ES modules (`import`/`export`) syntax
- Use `.js` extensions in relative imports (for ESM compatibility)
- Prefer explicit types over `any` where possible
- Use `const` for immutable values, avoid `var`

### File Naming
- Source files: `*.ts`
- Test files: `*.test.ts`
- Type definitions: Use `types.ts` for shared types

## Development Guidelines

### Making Changes to Core Functions

When modifying `stringify.ts`:
- The function uses BFS to discover all object schemas first
- Class definitions are created for each unique object structure (based on sorted keys)
- Cycle detection prevents infinite loops during serialization
- Handle `undefined` values: top-level `undefined` returns `"null"`, object properties with `undefined` are omitted (like JSON)

When modifying `parse.ts`:
- Parser expects two main sections: class definitions header, then data
- Uses a tokenizer (`tokenizer.ts`) to convert text to tokens first
- Maintains a map of class names to their property definitions
- Handles both class instances (e.g., `A(...)`) and plain values

When modifying `tokenizer.ts`:
- Tokenizes TRON text into tokens (identifiers, strings, numbers, brackets, comments, etc.)
- Preserves line and column information for error reporting

### Testing Requirements

- **Run tests before committing**: Always run `pnpm test`
- **Add tests for new features**: Place them in the `test/` directory. Changes for `stringify` should create new tests in the `stringify.test.ts` file, and changes for `parse` should create new tests in the `parse.test.ts` file.
- **Create roundtrip tests if needed**: Roundtrip tests can be created in the `roundtrip.test.ts` file.

### Common Testing Scenarios
- Round-trip testing (stringify → parse → should equal original)
- Edge cases: empty objects, empty arrays, nested structures
- Primitive types: strings, numbers, booleans, null
- Arrays of objects with same structure (should use same class)
- Mixed data types within arrays

## Important Implementation Details

### `undefined` Handling
- Top-level: `TRON.stringify(undefined)` returns `"null"` (differs from JSON which returns `undefined`)
- In arrays: `TRON.stringify([undefined])` returns `"[null]"` (same as JSON)
- In objects: `TRON.stringify({a: undefined})` returns `"{}"` (same as JSON - property omitted)

This behavior is documented in README.md and is intentional for TypeScript type safety.

### Class Definition Schema
- Objects with identical property sets share the same class definition
- Keys are sorted for signature comparison (so `{b:2, a:1}` and `{a:1, b:2}` use same class)
- Original key order from first occurrence is preserved in class definition
- Class names are auto-generated as `A`, `B`, etc.

## Contributing Guidelines

### Before Submitting Changes
1. Run `pnpm build` - ensure code compiles without errors
2. Run `pnpm test` - ensure all tests pass
3. Add tests for new functionality
4. Update README.md if API changes
5. Update this AGENTS.md if development workflow changes

## Performance Considerations

### Token Efficiency
- TRON excels with repeated object structures (API responses, data arrays)
- Minimal benefit for single objects or highly variable structures
- Best for LLM context where token count matters

### Runtime Performance
- BFS traversal during stringify to discover all schemas
- Visited set prevents redundant traversal of shared references
- Parser uses single-pass tokenization then recursive descent parsing

## Security Notes

- TRON.parse() creates objects from text - same trust considerations as JSON.parse()
- No code execution during parsing (unlike eval)
- Circular references in input data will cause errors (not supported)

## Resources

- TRON Specification: https://tron-format.github.io/
- Repository: https://github.com/tron-format/tron-javascript
- Package Manager: pnpm (https://pnpm.io/)
- Test Framework: Vitest (https://vitest.dev/)
