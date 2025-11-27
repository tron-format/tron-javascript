interface ClassDef {
  name: string;
  keys: string[];
}

function generateClassName(index: number): string {
  // Index is 0-based
  // 0-25: A-Z
  // 26-51: A1-Z1
  // 52-77: A2-Z2
  // etc.
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const cycle = Math.floor(index / 26);
  const position = index % 26;
  
  if (cycle === 0) {
    return letters[position];
  } else {
    return letters[position] + cycle;
  }
}

export function stringify(value: any): string {
  if (value === undefined) {
    return "null";
  }

  // 1. BFS to discover classes
  const classes: ClassDef[] = [];
  const schemaToClass = new Map<string, ClassDef>();
  let classCounter = 0;

  const visited = new Set<any>();
  const queue: any[] = [value];

  // We need to traverse the entire structure to find all schemas.
  // Note: We track visited objects to prevent infinite loops in case of cycles during schema discovery.
  // Actual cycle detection (throwing error) happens during serialization.

  let head = 0;
  while (head < queue.length) {
    const current = queue[head++];

    if (current && typeof current === 'object') {
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);

      if (Array.isArray(current)) {
        for (const item of current) {
          queue.push(item);
        }
      } else {
        // Plain object
        const keys = Object.keys(current).filter(k => current[k] !== undefined);
        if (keys.length > 0) {
          // Use sorted keys for signature to ensure consistent schema for same structure
          // regardless of key order (e.g. {a:1, b:2} == {b:2, a:1})
          const sortedKeys = [...keys].sort();
          const schemaSignature = sortedKeys.join(',');

          if (!schemaToClass.has(schemaSignature)) {
            const className = generateClassName(classCounter++);
            // Use the original keys order from the first occurrence for the class definition
            // to preserve meaningful ordering (e.g. as seen in JSON)
            const classDef = { name: className, keys: [...keys] };
            classes.push(classDef);
            schemaToClass.set(schemaSignature, classDef);
          }

          // Add values to queue
          for (const key of keys) {
            queue.push(current[key]);
          }
        }
      }
    }
  }

  // 2. Generate Header
  let output = '';
  for (const cls of classes) {
    // "class ClassName: prop1,prop2"
    // Compact output: no spaces
    const keys = cls.keys.map(key => {
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
        return key;
      } else {
        return JSON.stringify(key);
      }
    });
    output += `class ${cls.name}: ${keys.join(',')}\n`;
  }

  if (output.length > 0) {
    output += '\n';
  }

  // 3. Generate Data
  output += serialize(value, schemaToClass, new Set());

  return output;
}

function serialize(value: any, schemaToClass: Map<string, ClassDef>, stack: Set<any>): string {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    if (stack.has(value)) {
      throw new TypeError('Converting circular structure to TRON');
    }
    stack.add(value);
    try {
      const items = value.map(v => serialize(v, schemaToClass, stack)).join(',');
      return `[${items}]`;
    } finally {
      stack.delete(value);
    }
  }

  if (typeof value === 'object') {
    if (stack.has(value)) {
      throw new TypeError('Converting circular structure to TRON');
    }
    stack.add(value);

    try {
      const keys = Object.keys(value).filter(k => value[k] !== undefined);
      if (keys.length === 0) {
        return '{}';
      }

      const sortedKeys = [...keys].sort();
      const schemaSignature = sortedKeys.join(',');
      const classDef = schemaToClass.get(schemaSignature);

      if (classDef) {
        // Use class instantiation
        // ClassName(val1,val2)
        const args = classDef.keys.map(key => serialize(value[key], schemaToClass, stack)).join(',');
        return `${classDef.name}(${args})`;
      } else {
        // Should not happen if BFS worked correctly
        throw new Error(`Unknown schema for object: ${JSON.stringify(value)}`);
      }
    } finally {
      stack.delete(value);
    }
  }

  throw new TypeError(`Unsupported type: ${typeof value}`);
}

export const exportedForUnitTesting = {
  generateClassName,
};
