import { tokenize, Token, TokenType } from './tokenizer.js';
import { ClassDefinition } from './types.js';

export function parse(text: string): any {
  const tokens = tokenize(text);
  const parser = new Parser(tokens);
  return parser.parse();
}

class Parser {
  private tokens: Token[];
  private current: number = 0;
  private classes: Map<string, ClassDefinition> = new Map();

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): any {
    // 0. Skip leading newlines/semicolons
    while (this.match(TokenType.SEMICOLON) || this.match(TokenType.NEWLINE)) {
      // consume
    }

    // 1. Parse Header (Class Definitions)
    while (this.match(TokenType.CLASS)) {
      this.parseClassDefinition();
      // Optional separators between classes
      while (this.match(TokenType.SEMICOLON) || this.match(TokenType.NEWLINE)) {
        // consume
      }
    }

    // Skip any remaining newlines/semicolons before data
    while (this.match(TokenType.SEMICOLON) || this.match(TokenType.NEWLINE)) {
      // consume
    }

    // 2. Parse Data
    if (this.isAtEnd()) {
      throw new SyntaxError("Unexpected end of input: No data section found");
    }

    const data = this.parseValue();

    // Ensure no extra data (except whitespace/comments which are already handled/ignored)
    while (this.match(TokenType.NEWLINE) || this.match(TokenType.SEMICOLON)) {
      // consume
    }

    if (!this.isAtEnd()) {
      throw new SyntaxError(`Unexpected token after data: ${this.peek().value} at ${this.peek().line}:${this.peek().column}`);
    }

    return data;
  }

  private parseClassDefinition() {
    // Expect Identifier (ClassName)
    const nameToken = this.consume(TokenType.IDENTIFIER, "Expect class name.");
    const className = nameToken.value;

    // Check for class inheritance: class ChildClass(ParentClass): ...
    let parentProperties: string[] = [];
    if (this.match(TokenType.LPAREN)) {
      const parentNameToken = this.consume(TokenType.IDENTIFIER, "Expect parent class name.");
      const parentClassName = parentNameToken.value;
      
      const parentClassDef = this.classes.get(parentClassName);
      if (!parentClassDef) {
        throw new SyntaxError(`Undefined parent class: ${parentClassName} at ${parentNameToken.line}:${parentNameToken.column}`);
      }
      
      parentProperties = [...parentClassDef.properties];
      this.consume(TokenType.RPAREN, "Expect ')' after parent class name.");
    }

    // Expect Colon
    this.consume(TokenType.COLON, "Expect ':' after class name.");

    const properties: string[] = [];

    // Parse Properties
    while (!this.check(TokenType.SEMICOLON) && !this.check(TokenType.CLASS) && !this.isAtEnd()) {
      // Check for start of data (heuristic)
      // If we see an Identifier followed by '(', it's likely a class instantiation (Data)

      // The TRON specification recommends that properties separated by newlines should share the same indentation.
      // However, this is not a requirement, and thus properties separated by newlines are allowed to have different indentation.

      if (this.match(TokenType.NEWLINE)) {
        // If next token is CLASS, we are done.
        if (this.check(TokenType.CLASS)) break;
        // If next token is EOF, done.
        if (this.isAtEnd()) break;

        // If next token is Identifier followed by '(', it's Data.
        if (this.check(TokenType.IDENTIFIER) && this.checkNext(TokenType.LPAREN)) break;

        // If next token is NOT Identifier/String, it's likely Data (e.g. '[', '{', 'true').
        if (!this.check(TokenType.IDENTIFIER) && !this.check(TokenType.STRING)) break;

        // Otherwise, it's a property on a new line.
        continue;
      }

      if (this.match(TokenType.COMMA)) {
        continue;
      }

      if (this.check(TokenType.IDENTIFIER) || this.check(TokenType.STRING)) {
        const propToken = this.advance();
        properties.push(propToken.value);
      } else {
        break; // End of properties
      }
    }

    // Combine parent properties (if any) with own properties
    const allProperties = [...parentProperties, ...properties];
    this.classes.set(className, { name: className, properties: allProperties });
  }

  private parseValue(): any {
    if (this.match(TokenType.NULL)) return null;
    if (this.match(TokenType.TRUE)) return true;
    if (this.match(TokenType.FALSE)) return false;

    if (this.check(TokenType.NUMBER)) {
      return parseFloat(this.advance().value);
    }

    if (this.check(TokenType.STRING)) {
      return this.advance().value;
    }

    if (this.match(TokenType.LBRACKET)) {
      return this.parseArray();
    }

    if (this.match(TokenType.LBRACE)) {
      return this.parseObject();
    }

    if (this.check(TokenType.IDENTIFIER)) {
      // Class Instantiation
      return this.parseClassInstantiation();
    }

    throw new SyntaxError(`Unexpected token in value: ${this.peek().value} at ${this.peek().line}:${this.peek().column}`);
  }

  private parseArray(): any[] {
    const arr: any[] = [];
    if (!this.check(TokenType.RBRACKET)) {
      while (true) {
        while (this.match(TokenType.NEWLINE)) {
          // consume
        }

        if (this.check(TokenType.RBRACKET)) break;

        arr.push(this.parseValue());

        while (this.match(TokenType.NEWLINE)) {
          // consume
        }

        if (!this.match(TokenType.COMMA)) break;
      }
    }
    this.consume(TokenType.RBRACKET, "Expect ']' after array.");
    return arr;
  }

  private parseObject(): any {
    const obj: any = {};
    if (!this.check(TokenType.RBRACE)) {
      while (true) {
        while (this.match(TokenType.NEWLINE)) {
          // consume
        }

        if (this.check(TokenType.RBRACE)) break;

        const keyToken = this.consume(TokenType.STRING, "Expect string key in object.");
        const key = keyToken.value;

        this.consume(TokenType.COLON, "Expect ':' after key.");

        const value = this.parseValue();
        obj[key] = value;

        while (this.match(TokenType.NEWLINE)) {
          // consume
        }

        if (!this.match(TokenType.COMMA)) break;
      }
    }
    this.consume(TokenType.RBRACE, "Expect '}' after object.");
    return obj;
  }

  private parseClassInstantiation(): any {
    const classNameToken = this.consume(TokenType.IDENTIFIER, "Expect class name.");
    const className = classNameToken.value;

    const classDef = this.classes.get(className);
    if (!classDef) {
      throw new SyntaxError(`Undefined class: ${className} at ${classNameToken.line}:${classNameToken.column}`);
    }

    this.consume(TokenType.LPAREN, "Expect '(' after class name.");

    const obj: any = {};
    const assignedProps = new Set<string>();
    let positionalIndex = 0;
    let seenNamedArg = false;

    if (!this.check(TokenType.RPAREN)) {
      while (true) {
        while (this.match(TokenType.NEWLINE)) {
          // consume
        }

        if (this.check(TokenType.RPAREN)) break;

        // Check if this is a named argument: identifier or string followed by '='
        const isNamedArg = (this.check(TokenType.IDENTIFIER) || this.check(TokenType.STRING)) && this.checkNext(TokenType.EQUALS);
        if (isNamedArg) {
          seenNamedArg = true;
          const propNameToken = this.advance();
          const propName = propNameToken.value;
          
          // Verify property exists in class
          if (!classDef.properties.includes(propName)) {
            throw new SyntaxError(`Unknown property '${propName}' for class ${className} at ${propNameToken.line}:${propNameToken.column}`);
          }
          
          // Verify property hasn't been assigned yet
          if (assignedProps.has(propName)) {
            throw new SyntaxError(`Property '${propName}' already assigned for class ${className} at ${propNameToken.line}:${propNameToken.column}`);
          }
          
          this.consume(TokenType.EQUALS, "Expect '=' after property name.");
          const value = this.parseValue();
          obj[propName] = value;
          assignedProps.add(propName);
        } else {
          // Positional argument
          if (seenNamedArg) {
            throw new SyntaxError(`Positional argument cannot appear after named argument at ${this.peek().line}:${this.peek().column}`);
          }
          
          if (positionalIndex >= classDef.properties.length) {
            throw new SyntaxError(`Too many arguments for class ${className} at ${this.peek().line}:${this.peek().column}`);
          }

          const value = this.parseValue();
          const propName = classDef.properties[positionalIndex];
          obj[propName] = value;
          assignedProps.add(propName);
          positionalIndex++;
        }

        while (this.match(TokenType.NEWLINE)) {
          // consume
        }

        if (!this.match(TokenType.COMMA)) break;
      }
    }

    // Verify all properties are assigned
    if (assignedProps.size < classDef.properties.length) {
      const missingProps = classDef.properties.filter(p => !assignedProps.has(p));
      throw new SyntaxError(`Missing arguments for class ${className}: ${missingProps.join(', ')}`);
    }

    this.consume(TokenType.RPAREN, "Expect ')' after arguments.");
    return obj;
  }

  // Helper methods
  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private checkNext(type: TokenType): boolean {
    if (this.current + 1 >= this.tokens.length) return false;
    return this.tokens[this.current + 1].type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new SyntaxError(`${message} Found ${this.peek().value} at ${this.peek().line}:${this.peek().column}`);
  }
}
