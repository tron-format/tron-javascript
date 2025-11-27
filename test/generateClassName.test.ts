import { describe, it, expect } from 'vitest';
import { exportedForUnitTesting } from '../src/stringify.js';

const { generateClassName } = exportedForUnitTesting;

describe('generateClassName', () => {
  describe('single letter range (0-25)', () => {
    it('should generate all single letters correctly', () => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (let i = 0; i < 26; i++) {
        expect(generateClassName(i)).toBe(letters[i]);
      }
    });
  });

  describe('first cycle with suffix (26-51)', () => {
    it('should generate all letters with 1 suffix correctly', () => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (let i = 0; i < 26; i++) {
        expect(generateClassName(26 + i)).toBe(letters[i] + '1');
      }
    });
  });

  describe('second cycle with suffix (52-77)', () => {
    it('should generate A2-Z2 for indices 52-77', () => {
      expect(generateClassName(52)).toBe('A2');
      expect(generateClassName(53)).toBe('B2');
      expect(generateClassName(77)).toBe('Z2');
    });

    it('should generate all letters with 2 suffix correctly', () => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (let i = 0; i < 26; i++) {
        expect(generateClassName(52 + i)).toBe(letters[i] + '2');
      }
    });
  });
});