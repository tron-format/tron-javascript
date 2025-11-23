import { describe, it, expect } from 'vitest';
import { TRON } from '../src/index.js';
import fs from 'fs';
import path from 'path';

const EXAMPLES_DIR = path.join(__dirname, '../examples/weather_api_response');

function readFile(filename: string): string {
  return fs.readFileSync(path.join(EXAMPLES_DIR, filename), 'utf-8');
}

describe('Weather API Response Examples', () => {
  const jsonContent = readFile('json_original.json');
  const originalObj = JSON.parse(jsonContent);

  const tronReadable = readFile('tron_readable.tron');
  const tronCompact = readFile('tron_compact.tron');
  const tronTokenEfficient = readFile('tron_token_efficient.tron');

  it('should parse json_original.json and all 3 tron files to the same object', () => {
    const parsedReadable = TRON.parse(tronReadable);
    const parsedCompact = TRON.parse(tronCompact);
    const parsedEfficient = TRON.parse(tronTokenEfficient);

    expect(parsedReadable).toEqual(originalObj);
    expect(parsedCompact).toEqual(originalObj);
    expect(parsedEfficient).toEqual(originalObj);
  });

  it('should stringify json_original.json to match tron_token_efficient.tron', () => {
    const stringified = TRON.stringify(originalObj);
    
    // Normalize newlines to avoid cross-platform issues or trailing newline differences
    const normalize = (str: string) => str.replace(/\r\n/g, '\n').trim();
    
    expect(normalize(stringified)).toBe(normalize(tronTokenEfficient));
  });
});

