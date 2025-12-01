# @tron-format/tron

[![CI](https://github.com/tron-format/tron-javascript/actions/workflows/ci.yml/badge.svg)](https://github.com/tron-format/tron-javascript)
[![License: MIT](https://img.shields.io/badge/license-MIT-fef3c0?labelColor=1b1b1f)](./LICENSE)

A JavaScript library for converting data to and from the TRON (Token Reduced Object Notation) format.

See full specification for the TRON format at: https://tron-format.github.io/

## Installation

```bash
npm i @tron-format/tron
```

## Usage

```typescript
import { TRON } from '@tron-format/tron';

const value = [{ a: 1, b: 2 }, { a: 3, b: 4 }];
const tron = TRON.stringify(value);
console.log(tron);
// Output: 
// class A: a,b
// 
// [A(1,2), A(3,4)]

const parsed = TRON.parse(tron);
console.log(parsed);
// Output:
// [{ a: 1, b: 2 }, { a: 3, b: 4 }]
```

## Considerations

### Using stringify with undefined

In JavaScript, calling `JSON.stringify(undefined)` returns `undefined`. However, calling `TRON.stringify(undefined)` returns `'null'` instead. This is intentional to better align with the function's return type (string only) for TypeScript.

Other cases of stringifying undefined are handled the same way as JSON.stringify. For example:
- `TRON.stringify([undefined])` returns `'[null]'` (same behavior as `JSON.stringify([undefined])`)
- `TRON.stringify({ a: undefined })` returns `'{}'` (same behavior as `JSON.stringify({ a: undefined })`)

## Playground

Want to try out TRON with your own JSON data?

Go to https://tron-format.github.io/#/playground and select "Custom Data".

Paste in your data to see TRON's token efficiency compared to other data formats!

## License

[MIT](./LICENSE) License © 2025-PRESENT Tim Huang
