import { TRON } from './src/index.js';

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