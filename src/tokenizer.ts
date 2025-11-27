export enum TokenType {
  CLASS,
  IDENTIFIER,
  STRING,
  NUMBER,
  TRUE,
  FALSE,
  NULL,
  LPAREN,
  RPAREN,
  LBRACKET,
  RBRACKET,
  LBRACE,
  RBRACE,
  COMMA,
  COLON,
  SEMICOLON,
  EQUALS,
  NEWLINE,
  EOF
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let cursor = 0;
  let line = 1;
  let column = 1;

  while (cursor < input.length) {
    const char = input[cursor];

    // Handle whitespace
    if (char === ' ' || char === '\t' || char === '\r') {
      cursor++;
      column++;
      continue;
    }

    // Handle Newline
    if (char === '\n') {
      tokens.push({ type: TokenType.NEWLINE, value: '\n', line, column });
      cursor++;
      line++;
      column = 1;
      continue;
    }

    // Handle Comments
    if (char === '#') {
      while (cursor < input.length && input[cursor] !== '\n') {
        cursor++;
      }
      // Don't consume newline here, let the next iteration handle it
      continue;
    }

    // Handle Symbols
    if (char === '(') { tokens.push({ type: TokenType.LPAREN, value: '(', line, column }); cursor++; column++; continue; }
    if (char === ')') { tokens.push({ type: TokenType.RPAREN, value: ')', line, column }); cursor++; column++; continue; }
    if (char === '[') { tokens.push({ type: TokenType.LBRACKET, value: '[', line, column }); cursor++; column++; continue; }
    if (char === ']') { tokens.push({ type: TokenType.RBRACKET, value: ']', line, column }); cursor++; column++; continue; }
    if (char === '{') { tokens.push({ type: TokenType.LBRACE, value: '{', line, column }); cursor++; column++; continue; }
    if (char === '}') { tokens.push({ type: TokenType.RBRACE, value: '}', line, column }); cursor++; column++; continue; }
    if (char === ',') { tokens.push({ type: TokenType.COMMA, value: ',', line, column }); cursor++; column++; continue; }
    if (char === ':') { tokens.push({ type: TokenType.COLON, value: ':', line, column }); cursor++; column++; continue; }
    if (char === ';') { tokens.push({ type: TokenType.SEMICOLON, value: ';', line, column }); cursor++; column++; continue; }
    if (char === '=') { tokens.push({ type: TokenType.EQUALS, value: '=', line, column }); cursor++; column++; continue; }

    // Handle Strings
    if (char === '"') {
      let value = '';
      const startColumn = column;
      cursor++; // skip opening quote
      column++;

      while (cursor < input.length) {
        const c = input[cursor];
        if (c === '"') {
          cursor++;
          column++;
          break;
        }
        if (c === '\\') {
          cursor++;
          column++;
          if (cursor >= input.length) throw new SyntaxError(`Unexpected end of input in string at ${line}:${column}`);
          const escaped = input[cursor];
          // Simple escape handling for now, similar to JSON
          if (escaped === '"') value += '"';
          else if (escaped === '\\') value += '\\';
          else if (escaped === '/') value += '/';
          else if (escaped === 'b') value += '\b';
          else if (escaped === 'f') value += '\f';
          else if (escaped === 'n') value += '\n';
          else if (escaped === 'r') value += '\r';
          else if (escaped === 't') value += '\t';
          else if (escaped === 'u') {
            // Handle unicode?
            const hex = input.substr(cursor + 1, 4);
            if (/^[0-9a-fA-F]{4}$/.test(hex)) {
              value += String.fromCharCode(parseInt(hex, 16));
              cursor += 4;
              column += 4;
            } else {
              value += 'u'; // invalid escape, just keep it? or error? JSON throws.
            }
          }
          else value += escaped;

          cursor++;
          column++;
        } else {
          value += c;
          cursor++;
          column++;
        }
      }
      tokens.push({ type: TokenType.STRING, value, line, column: startColumn });
      continue;
    }

    // Handle Numbers
    if (char === '-' || (char >= '0' && char <= '9')) {
      let value = char;
      const startColumn = column;
      cursor++;
      column++;

      while (cursor < input.length) {
        const c = input[cursor];
        if ((c >= '0' && c <= '9') || c === '.' || c === 'e' || c === 'E' || c === '+' || c === '-') {
          value += c;
          cursor++;
          column++;
        } else {
          break;
        }
      }
      tokens.push({ type: TokenType.NUMBER, value, line, column: startColumn });
      continue;
    }

    // Handle Identifiers and Keywords
    if (/[a-zA-Z_]/.test(char)) {
      let value = char;
      const startColumn = column;
      cursor++;
      column++;

      while (cursor < input.length && /[a-zA-Z0-9_]/.test(input[cursor])) {
        value += input[cursor];
        cursor++;
        column++;
      }

      if (value === 'class') tokens.push({ type: TokenType.CLASS, value, line, column: startColumn });
      else if (value === 'true') tokens.push({ type: TokenType.TRUE, value, line, column: startColumn });
      else if (value === 'false') tokens.push({ type: TokenType.FALSE, value, line, column: startColumn });
      else if (value === 'null') tokens.push({ type: TokenType.NULL, value, line, column: startColumn });
      else tokens.push({ type: TokenType.IDENTIFIER, value, line, column: startColumn });
      continue;
    }

    throw new SyntaxError(`Unexpected character '${char}' at ${line}:${column}`);
  }

  tokens.push({ type: TokenType.EOF, value: '', line, column });
  return tokens;
}
