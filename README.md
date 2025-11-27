# tron-format

A JavaScript library for converting data to and from the TRON (Token Reduced Object Notation) format.

See full specification for the TRON format here: https://tron-format.github.io/

## Installation

```bash
npm i @tron-format/tron
```

## Usage

```typescript
import { TRON } from '@tron-format/tron';

const value = { a: 1, b: 2 };
const tron = TRON.stringify(value);
console.log(tron);
// Output: 
// class A: a,b
// 
// A(1,2)

const parsed = TRON.parse(tron);
console.log(parsed);
// Output:
// { a: 1, b: 2 }
```

## Considerations

### Using stringify with undefined

In JavaScript, calling `JSON.stringify(undefined)` returns `undefined`. However, calling `TRON.stringify(undefined)` returns `'null'` instead. This is intentional to better align with the function's return type (string only) for TypeScript.

Other cases of stringifying undefined are handled the same way as JSON.stringify. For example:
- `TRON.stringify([undefined])` returns `'[null]'` (same behavior as `JSON.stringify([undefined])`)
- `TRON.stringify({ a: undefined })` returns `'{}'` (same behavior as `JSON.stringify({ a: undefined })`)
