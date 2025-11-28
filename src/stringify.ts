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
  const schemaCounts = new Map<string, number>();
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

          // Track occurrence count
          schemaCounts.set(schemaSignature, (schemaCounts.get(schemaSignature) || 0) + 1);

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

  // Filter classes based on property count and occurrence:
  // - 1 property: never define class (always use JSON)
  // - 2 properties: only define class if occurs more than once
  // - 3+ properties: always define class
  const filteredSchemaToClass = new Map<string, ClassDef>();
  const filteredClasses: ClassDef[] = [];
  let filteredClassCounter = 0;

  for (const [schemaSignature, classDef] of schemaToClass.entries()) {
    const propertyCount = classDef.keys.length;
    const occurrenceCount = schemaCounts.get(schemaSignature) || 0;

    let shouldDefineClass = false;
    if (propertyCount === 1) {
      shouldDefineClass = false; // Never define class for 1 property
    } else if (propertyCount === 2) {
      shouldDefineClass = occurrenceCount > 1; // Only if occurs more than once
    } else {
      shouldDefineClass = true; // Always define class for 3+ properties
    }

    if (shouldDefineClass) {
      // Reassign class names sequentially for filtered classes
      const newClassName = generateClassName(filteredClassCounter++);
      const newClassDef = { name: newClassName, keys: classDef.keys };
      filteredSchemaToClass.set(schemaSignature, newClassDef);
      filteredClasses.push(newClassDef);
    }
  }

  // 2. Generate Header
  let output = '';
  for (const cls of filteredClasses) {
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
  output += serialize(value, filteredSchemaToClass, new Set());

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
        // Use JSON object syntax when no class definition exists
        // Always quote keys to match JSON format
        const pairs = keys.map(key => {
          const keyStr = JSON.stringify(key);
          return `${keyStr}:${serialize(value[key], schemaToClass, stack)}`;
        }).join(',');
        return `{${pairs}}`;
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
