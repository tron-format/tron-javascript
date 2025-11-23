import { describe, it, expect } from 'vitest';
import { TRON } from '../src/index.js';

describe('TRON round trip', () => {
  it('should preserve data', () => {
    const data = {
      users: [
        { id: 1, name: 'Alice', active: true },
        { id: 2, name: 'Bob', active: false }
      ],
      meta: { page: 1, total: 2 }
    };
    const tron = TRON.stringify(data);
    const parsed = TRON.parse(tron);
    expect(parsed).toEqual(data);
  });
});

