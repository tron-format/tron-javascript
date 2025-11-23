# tron-format

The official JavaScript library for converting data to and from the TRON (Token Reduced Object Notation) format.

## Installation

```bash
npm add git+https://github.com/tron-format/tron-javascript.git
```

## Usage

```typescript
import { TRON } from '@tron-format/tron';

const value = { a: 1, b: 2 };
const tron = TRON.stringify(value);
console.log(tron);
// Output: 
// class Object1: a,b
// 
// Object1(1,2)

const parsed = TRON.parse(tron);
console.log(parsed);
// Output:
// { a: 1, b: 2 }
```

## Considerations

### Using stringify with undefined

In JavaScript, calling `JSON.stringify(undefined)` returns `undefined`. However, calling `TRON.stringify(undefined)` returns `'null'` instead. This is intentional to better align with the function's return type (string only) for TypeScript.

Other cases of stringifying undefined are handled the same way as JSON.stringify. For example:
- Both `JSON.stringify([undefined])` and `TRON.stringify([undefined])` return `'[null]'`
- Both `JSON.stringify({ a: undefined })` and `TRON.stringify({ a: undefined })` return `'{}'`
