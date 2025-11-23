import { describe, it, expect } from 'vitest';
import { TRON } from '../src/index.js';

describe('TRON stringify', () => {
  it('should stringify primitives', () => {
    expect(TRON.stringify(123)).toBe('123');
    expect(TRON.stringify('hello')).toBe('"hello"');
    expect(TRON.stringify(true)).toBe('true');
    expect(TRON.stringify(false)).toBe('false');
    expect(TRON.stringify(null)).toBe('null');
  });

  it('should stringify arrays', () => {
    expect(TRON.stringify([1, 2, 3])).toBe('[1,2,3]');
    expect(TRON.stringify(['a', 'b'])).toBe('["a","b"]');
  });

  it('should stringify empty object', () => {
    expect(TRON.stringify({})).toBe('{}');
  });

  it('should stringify object with class generation', () => {
    const obj = { x: 1, y: 2 };
    const tron = TRON.stringify(obj);
    // Expect class definition and instantiation
    expect(tron).toBe('class Object1: x,y\n\nObject1(1,2)');
  });

  it('should reuse classes for same structure', () => {
    const obj = [{ x: 1, y: 2 }, { x: 3, y: 4 }];
    const tron = TRON.stringify(obj);
    expect(tron).toBe('class Object1: x,y\n\n[Object1(1,2),Object1(3,4)]');
  });

  it('should handle nested objects', () => {
    const obj = { a: { x: 1, y: 2 }, b: { y: 4, x: 3 } };
    const tron = TRON.stringify(obj);
    expect(tron).toBe('class Object1: a,b\nclass Object2: x,y\n\nObject1(Object2(1,2),Object2(3,4))');
  });

  it('should handle undefined the same as JSON.stringify', () => {
    expect(TRON.stringify(undefined)).toBe('null'); // This is intentionally different from JSON.stringify, which returns undefined instead
    expect(TRON.stringify([undefined])).toBe('[null]');
    expect(TRON.stringify({ a: undefined })).toBe('{}');

    const tron = TRON.stringify({ a: undefined, b: 1 });
    expect(tron).toBe('class Object1: b\n\nObject1(1)');
  });

  it('should throw TypeError on circular reference', () => {
    const obj: any = { a: {} };
    obj.a.parent = obj;
    expect(() => TRON.stringify(obj)).toThrow(TypeError);
    expect(() => TRON.stringify(obj)).toThrow(/circular/i);
  });

  it('should throw on BigInt', () => {
     expect(() => TRON.stringify(1n)).toThrow(TypeError);
  });
});
