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
    const obj = { x: 1, y: 2, z: 3 };
    const tron = TRON.stringify(obj);
    // Expect class definition and instantiation
    expect(tron).toBe('class A: x,y,z\n\nA(1,2,3)');
  });

  it('should reuse classes for same structure', () => {
    const obj = [{ x: 1, y: 2, z: 3 }, { x: 3, y: 4, z: 5 }];
    const tron = TRON.stringify(obj);
    expect(tron).toBe('class A: x,y,z\n\n[A(1,2,3),A(3,4,5)]');
  });

  it('should handle nested objects', () => {
    const obj = { a: { x: 1, y: 2, z: 3 }, b: { y: 4, x: 3, z: 5 }, c: { x: 2, y: 4, z: 6 } };
    const tron = TRON.stringify(obj);
    expect(tron).toBe('class A: a,b,c\nclass B: x,y,z\n\nA(B(1,2,3),B(3,4,5),B(2,4,6))');
  });

  it('should handle undefined the same as JSON.stringify', () => {
    expect(TRON.stringify(undefined)).toBe('null'); // This is intentionally different from JSON.stringify, which returns undefined instead
    expect(TRON.stringify([undefined])).toBe('[null]');
    expect(TRON.stringify({ a: undefined })).toBe('{}');

    const tron = TRON.stringify({ a: undefined, b: 1, c: 2, d: 3 });
    expect(tron).toBe('class A: b,c,d\n\nA(1,2,3)');
  });

  it('should throw TypeError on circular reference', () => {
    const obj: any = { a: {} };
    obj.a.parent = obj;
    expect(() => TRON.stringify(obj)).toThrow(TypeError);
  });

  it('should throw on BigInt', () => {
     expect(() => TRON.stringify(1n)).toThrow(TypeError);
  });

  it('should quote property names with special characters', () => {
    const obj = { "1a": 1, "a1": 2, "valid_name": 3, "foo-bar": 4 };
    const tron = TRON.stringify(obj);
    
    // Check that the class definition quotes "foo-bar"
    expect(tron).toContain('class A: "1a",a1,valid_name,"foo-bar"');
  });

  describe('conditional class definition', () => {
    it('should use JSON syntax for single-property objects (single occurrence)', () => {
      const obj = { x: 1 };
      const tron = TRON.stringify(obj);
      expect(tron).toBe('{"x":1}');
    });

    it('should use JSON syntax for single-property objects (multiple occurrences)', () => {
      const obj = [{ x: 1 }, { x: 2 }, { x: 3 }];
      const tron = TRON.stringify(obj);
      expect(tron).toBe('[{"x":1},{"x":2},{"x":3}]');
    });

    it('should use JSON syntax for 2-property objects appearing once', () => {
      const obj = { x: 1, y: 2 };
      const tron = TRON.stringify(obj);
      expect(tron).toBe('{"x":1,"y":2}');
    });

    it('should define class for 2-property objects appearing twice', () => {
      const obj = [{ x: 1, y: 2 }, { x: 3, y: 4 }];
      const tron = TRON.stringify(obj);
      expect(tron).toBe('class A: x,y\n\n[A(1,2),A(3,4)]');
    });

    it('should define class for 3-property objects appearing once', () => {
      const obj = { x: 1, y: 2, z: 3 };
      const tron = TRON.stringify(obj);
      expect(tron).toBe('class A: x,y,z\n\nA(1,2,3)');
    });

    it('should handle mixed scenarios with different property counts', () => {
      const obj = {
        single: { a: 1 },
        twoOnce: { b: 2, c: 3 },
        twoTwice: [{ d: 4, e: 5 }, { d: 6, e: 7 }],
        three: { f: 8, g: 9, h: 10 }
      };
      const tron = TRON.stringify(obj);
      // Outer object has 4 properties, so it gets a class definition
      // single: JSON (1 property) - should be {"a":1}
      // twoOnce: JSON (2 properties, occurs once) - should be {"b":2,"c":3}
      // twoTwice: class (2 properties, occurs twice) - should use class B (DFS visits before three)
      // three: class (3+ properties) - should use class C
      expect(tron).toBe('class A: single,twoOnce,twoTwice,three\nclass B: d,e\nclass C: f,g,h\n\nA({"a":1},{"b":2,"c":3},[B(4,5),B(6,7)],C(8,9,10))');
    });

    it('should handle nested objects with conditional class definition', () => {
      const obj = {
        outer: { a: 1, b: 2, c: 3 },
        inner: [{ x: 1 }, { x: 2 }]
      };
      const tron = TRON.stringify(obj);
      // Outer object has 2 properties, but occurs once, so uses JSON
      // outer: class (3 properties)
      // inner: array of JSON objects (1 property each)
      expect(tron).toContain('class A: a,b,c');
      expect(tron).toContain('A(1,2,3)');
      expect(tron).toContain('"inner":[{"x":1},{"x":2}]');
    });
  });
});
