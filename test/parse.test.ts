import { describe, it, expect } from 'vitest';
import { TRON } from '../src/index.js';

describe('TRON parse', () => {
  it('should parse primitives', () => {
    expect(TRON.parse('123')).toBe(123);
    expect(TRON.parse('"hello"')).toBe('hello');
    expect(TRON.parse('true')).toBe(true);
    expect(TRON.parse('false')).toBe(false);
    expect(TRON.parse('null')).toBe(null);
  });

  it('should parse arrays', () => {
    expect(TRON.parse('[1,2,3]')).toEqual([1, 2, 3]);
  });

  it('should parse empty object', () => {
    expect(TRON.parse('{}')).toEqual({});
  });

  it('should parse json object', () => {
    expect(TRON.parse('{"a": 1, "b": 2}')).toEqual({ a: 1, b: 2 });
  });

  it('should parse object with class', () => {
    const tron = `
class Point: x, y
Point(1, 2)
`;
    expect(TRON.parse(tron)).toEqual({ x: 1, y: 2 });
  });

  it('should parse class with newline-delimited properties', () => {
    const tron = `
class Point: 
  x
  y
Point(1, 2)
`;
    expect(TRON.parse(tron)).toEqual({ x: 1, y: 2 });
  });

  it('should parse nested objects', () => {
    const tron = `
class Outer: inner
class Inner: val
{"test1": Outer({"test2": Inner(1)})}
`;
    expect(TRON.parse(tron)).toEqual({ test1: { inner: { test2: { val: 1 } } } });
  });

  it('should parse semicolons', () => {
    const tron = `
class Inner: val; class Outer: inner; Outer(Inner(1))
`;
    expect(TRON.parse(tron)).toEqual({ inner: { val: 1 } });
  });

  it('should ignore trailing commas and semicolons', () => {
    const tron = `
class Outer: inner,;
class Inner: 
  val1,
  val2,;

Outer(Inner([1,2,], {"key": "value",},),)
`;
    expect(TRON.parse(tron)).toEqual({ inner: { val1: [1,2], val2: {"key": "value"} } });
  });

  it('should parse example from spec', () => {
    const tron = `
class Order:
  index,items,total

class Product:
  index,name,price,quantity

Order(
  "ord-123",
  [
    Product(1,"Widget",19.99,2),
    Product(2,"Gadget",29.99,1),
    Product(3,"Gizmo",39.99,1)
  ],
  109.96
)
`;
    const expected = {
      index: "ord-123",
      items: [
        { index: 1, name: "Widget", price: 19.99, quantity: 2 },
        { index: 2, name: "Gadget", price: 29.99, quantity: 1 },
        { index: 3, name: "Gizmo", price: 39.99, quantity: 1 }
      ],
      total: 109.96
    };
    expect(TRON.parse(tron)).toEqual(expected);
  });
});

