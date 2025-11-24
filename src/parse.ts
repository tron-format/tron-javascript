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

    // Expect Colon
    this.consume(TokenType.COLON, "Expect ':' after class name.");

    const properties: string[] = [];

    // Parse Properties
    while (!this.check(TokenType.SEMICOLON) && !this.check(TokenType.CLASS) && !this.isAtEnd()) {
      // Check for start of data (heuristic)
      // If we see an Identifier followed by '(', it's likely a class instantiation (Data)

      // Officially, the spec says that properties separated by newlines should share the same indentation.
      // However, since the current tokenizer doesn't track indentation depth easily (yet), 
      // we secretly allow properties separated by newlines to have different indentation.

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

    this.classes.set(className, { name: className, properties });
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
    let argIndex = 0;

    if (!this.check(TokenType.RPAREN)) {
      while (true) {
        while (this.match(TokenType.NEWLINE)) {
          // consume
        }

        if (this.check(TokenType.RPAREN)) break;

        if (argIndex >= classDef.properties.length) {
          throw new SyntaxError(`Too many arguments for class ${className} at ${this.peek().line}:${this.peek().column}`);
        }

        const value = this.parseValue();
        const propName = classDef.properties[argIndex];
        obj[propName] = value;
        argIndex++;

        while (this.match(TokenType.NEWLINE)) {
          // consume
        }

        if (!this.match(TokenType.COMMA)) break;
      }
    }

    if (argIndex < classDef.properties.length) {
      throw new SyntaxError(`Too few arguments for class ${className}, expected ${classDef.properties.length}, got ${argIndex}`);
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
