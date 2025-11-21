import { Code2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { GenericRenderer } from '../generic-renderer';
import type { Renderer } from '../renderer';

export interface CodeRendererOptions {
  /**
   * Enable syntax highlighting for code strings
   * Defaults to true
   */
  enabled?: boolean;

  /**
   * Minimum string length to attempt code detection
   * Defaults to 10
   */
  minLength?: number;

  /**
   * Maximum string length to attempt syntax highlighting
   * (to avoid performance issues with very large strings)
   * Defaults to 10000
   */
  maxLength?: number;
}

type Language =
  | 'json'
  | 'javascript'
  | 'typescript'
  | 'html'
  | 'xml'
  | 'css'
  | 'sql'
  | 'unknown';

interface DetectionResult {
  language: Language;
  confidence: number;
}

/**
 * Detects the programming language of a string based on content patterns
 */
function detectLanguage(value: string): DetectionResult {
  const trimmed = value.trim();

  // JSON detection
  if (
    (trimmed.startsWith('{') || trimmed.startsWith('[')) &&
    (trimmed.endsWith('}') || trimmed.endsWith(']'))
  ) {
    try {
      JSON.parse(trimmed);
      return { language: 'json', confidence: 1.0 };
    } catch {
      // Could be JavaScript/TypeScript object notation
    }
  }

  // HTML/XML detection
  if (trimmed.startsWith('<') && trimmed.includes('>')) {
    const hasClosingTags = /<\/\w+>/.test(trimmed);
    const hasDoctype = /<!DOCTYPE/i.test(trimmed);
    const hasHtmlTags = /<(html|head|body|div|span|p|a|img|script|style)/i.test(
      trimmed,
    );

    if (hasDoctype || hasHtmlTags) {
      return { language: 'html', confidence: 0.9 };
    }
    if (hasClosingTags) {
      return { language: 'xml', confidence: 0.8 };
    }
  }

  // SQL detection
  const sqlKeywords =
    /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN|CREATE|DROP|ALTER|TABLE)\b/i;
  if (sqlKeywords.test(trimmed)) {
    const sqlScore = (
      trimmed.match(
        /\b(SELECT|FROM|WHERE|JOIN|AND|OR|ORDER BY|GROUP BY)\b/gi,
      ) || []
    ).length;
    if (sqlScore >= 2) {
      return { language: 'sql', confidence: 0.85 };
    }
  }

  // CSS detection
  if (/[.#]?[\w-]+\s*\{[^}]*:[^}]*\}/.test(trimmed)) {
    const cssProps = (trimmed.match(/[\w-]+\s*:\s*[^;]+;/g) || []).length;
    if (cssProps >= 2) {
      return { language: 'css', confidence: 0.85 };
    }
  }

  // TypeScript detection (more specific patterns)
  const tsPatterns = [
    /:\s*(string|number|boolean|any|void|never|unknown)\b/,
    /interface\s+\w+/,
    /<\w+>/, // Generic types
    /as\s+\w+/,
  ];
  const tsMatches = tsPatterns.filter((p) => p.test(trimmed)).length;
  if (tsMatches >= 2) {
    return { language: 'typescript', confidence: 0.85 };
  }

  // JavaScript detection
  const jsPatterns = [
    /\b(function|const|let|var|return|if|else|for|while|class|extends|import|export|async|await)\b/,
    /=>/, // Arrow functions
    /\.\w+\(/, // Method calls
    /\bconsole\.(log|error|warn)/,
  ];
  const jsMatches = jsPatterns.filter((p) => p.test(trimmed)).length;
  if (jsMatches >= 2) {
    return { language: 'javascript', confidence: 0.8 };
  }

  return { language: 'unknown', confidence: 0 };
}

/**
 * Syntax highlighting tokens
 */
interface Token {
  type:
    | 'keyword'
    | 'string'
    | 'number'
    | 'comment'
    | 'tag'
    | 'attribute'
    | 'operator'
    | 'plain';
  value: string;
}

/**
 * Tokenizes and highlights JSON
 */
function highlightJSON(code: string): ReactNode {
  const tokens: Token[] = [];
  let i = 0;

  while (i < code.length) {
    const char = code[i];

    // Strings
    if (char === '"') {
      let str = '"';
      i++;
      while (i < code.length) {
        if (code[i] === '\\' && i + 1 < code.length) {
          str += code[i] + code[i + 1];
          i += 2;
        } else if (code[i] === '"') {
          str += '"';
          i++;
          break;
        } else {
          str += code[i];
          i++;
        }
      }
      tokens.push({ type: 'string', value: str });
      continue;
    }

    // Numbers
    if (/[-\d]/.test(char)) {
      let num = '';
      while (i < code.length && /[-\d.eE+]/.test(code[i])) {
        num += code[i];
        i++;
      }
      if (/^-?\d+(\.\d+)?(e[+-]?\d+)?$/i.test(num)) {
        tokens.push({ type: 'number', value: num });
        continue;
      }
      tokens.push({ type: 'plain', value: num });
      continue;
    }

    // Keywords
    if (/[a-z]/.test(char)) {
      let word = '';
      while (i < code.length && /[a-z]/.test(code[i])) {
        word += code[i];
        i++;
      }
      if (['true', 'false', 'null'].includes(word)) {
        tokens.push({ type: 'keyword', value: word });
      } else {
        tokens.push({ type: 'plain', value: word });
      }
      continue;
    }

    // Plain characters
    tokens.push({ type: 'plain', value: char });
    i++;
  }

  return renderTokens(tokens);
}

/**
 * Tokenizes and highlights JavaScript/TypeScript
 */
function highlightJavaScript(code: string, isTypeScript = false): ReactNode {
  const keywords = [
    'function',
    'const',
    'let',
    'var',
    'return',
    'if',
    'else',
    'for',
    'while',
    'do',
    'switch',
    'case',
    'break',
    'continue',
    'class',
    'extends',
    'implements',
    'import',
    'export',
    'from',
    'default',
    'async',
    'await',
    'try',
    'catch',
    'finally',
    'throw',
    'new',
    'this',
    'super',
    'static',
    'public',
    'private',
    'protected',
    'readonly',
    'true',
    'false',
    'null',
    'undefined',
    'typeof',
    'instanceof',
    'void',
    'delete',
  ];

  if (isTypeScript) {
    keywords.push(
      'interface',
      'type',
      'enum',
      'namespace',
      'abstract',
      'as',
      'any',
      'unknown',
      'never',
    );
  }

  const tokens: Token[] = [];
  let i = 0;

  while (i < code.length) {
    const char = code[i];
    const remaining = code.slice(i);

    // Comments
    if (remaining.startsWith('//')) {
      const end = code.indexOf('\n', i);
      const comment = end === -1 ? remaining : code.slice(i, end);
      tokens.push({ type: 'comment', value: comment });
      i += comment.length;
      continue;
    }

    if (remaining.startsWith('/*')) {
      const end = code.indexOf('*/', i + 2);
      const comment = end === -1 ? remaining : code.slice(i, end + 2);
      tokens.push({ type: 'comment', value: comment });
      i += comment.length;
      continue;
    }

    // Strings
    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      let str = quote;
      i++;
      while (i < code.length) {
        if (code[i] === '\\' && i + 1 < code.length) {
          str += code[i] + code[i + 1];
          i += 2;
        } else if (code[i] === quote) {
          str += quote;
          i++;
          break;
        } else {
          str += code[i];
          i++;
        }
      }
      tokens.push({ type: 'string', value: str });
      continue;
    }

    // Numbers
    if (/\d/.test(char)) {
      let num = '';
      while (i < code.length && /[\d.xXoObBeE_]/.test(code[i])) {
        num += code[i];
        i++;
      }
      tokens.push({ type: 'number', value: num });
      continue;
    }

    // Keywords and identifiers
    if (/[a-zA-Z_$]/.test(char)) {
      let word = '';
      while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) {
        word += code[i];
        i++;
      }
      if (keywords.includes(word)) {
        tokens.push({ type: 'keyword', value: word });
      } else {
        tokens.push({ type: 'plain', value: word });
      }
      continue;
    }

    // Operators
    if (/[+\-*/%=<>!&|^~?:]/.test(char)) {
      tokens.push({ type: 'operator', value: char });
      i++;
      continue;
    }

    // Plain characters
    tokens.push({ type: 'plain', value: char });
    i++;
  }

  return renderTokens(tokens);
}

/**
 * Tokenizes and highlights HTML/XML
 */
function highlightHTML(code: string): ReactNode {
  const tokens: Token[] = [];
  let i = 0;

  while (i < code.length) {
    const char = code[i];
    const remaining = code.slice(i);

    // Comments
    if (remaining.startsWith('<!--')) {
      const end = code.indexOf('-->', i + 4);
      const comment = end === -1 ? remaining : code.slice(i, end + 3);
      tokens.push({ type: 'comment', value: comment });
      i += comment.length;
      continue;
    }

    // Tags
    if (char === '<') {
      let tag = '<';
      i++;
      let attributeName = '';

      while (i < code.length && code[i] !== '>') {
        if (code[i] === '=' && attributeName) {
          tokens.push({ type: 'tag', value: tag });
          tokens.push({ type: 'attribute', value: attributeName });
          tokens.push({ type: 'operator', value: '=' });
          tag = '';
          attributeName = '';
          i++;

          // Handle attribute value
          if (code[i] === '"' || code[i] === "'") {
            const quote = code[i];
            let value = quote;
            i++;
            while (i < code.length && code[i] !== quote) {
              value += code[i];
              i++;
            }
            if (i < code.length) {
              value += code[i];
              i++;
            }
            tokens.push({ type: 'string', value });
          }
          continue;
        }

        if (/\s/.test(code[i])) {
          if (tag) {
            tokens.push({ type: 'tag', value: tag });
            tag = '';
          }
          if (attributeName) {
            tokens.push({ type: 'attribute', value: attributeName });
            attributeName = '';
          }
          tokens.push({ type: 'plain', value: code[i] });
          i++;
          continue;
        }

        if (tag && /[a-zA-Z0-9-]/.test(code[i])) {
          attributeName += code[i];
        } else {
          tag += code[i];
        }
        i++;
      }

      if (tag) {
        tokens.push({ type: 'tag', value: tag });
      }
      if (attributeName) {
        tokens.push({ type: 'attribute', value: attributeName });
      }
      if (i < code.length) {
        tokens.push({ type: 'tag', value: '>' });
        i++;
      }
      continue;
    }

    // Plain text
    tokens.push({ type: 'plain', value: char });
    i++;
  }

  return renderTokens(tokens);
}

/**
 * Tokenizes and highlights CSS
 */
function highlightCSS(code: string): ReactNode {
  const tokens: Token[] = [];
  let i = 0;

  while (i < code.length) {
    const char = code[i];
    const remaining = code.slice(i);

    // Comments
    if (remaining.startsWith('/*')) {
      const end = code.indexOf('*/', i + 2);
      const comment = end === -1 ? remaining : code.slice(i, end + 2);
      tokens.push({ type: 'comment', value: comment });
      i += comment.length;
      continue;
    }

    // Strings
    if (char === '"' || char === "'") {
      const quote = char;
      let str = quote;
      i++;
      while (i < code.length && code[i] !== quote) {
        if (code[i] === '\\' && i + 1 < code.length) {
          str += code[i] + code[i + 1];
          i += 2;
        } else {
          str += code[i];
          i++;
        }
      }
      if (i < code.length) {
        str += code[i];
        i++;
      }
      tokens.push({ type: 'string', value: str });
      continue;
    }

    // Selectors (class and id)
    if ((char === '.' || char === '#') && /[a-zA-Z_-]/.test(code[i + 1])) {
      let selector = char;
      i++;
      while (i < code.length && /[a-zA-Z0-9_-]/.test(code[i])) {
        selector += code[i];
        i++;
      }
      tokens.push({ type: 'keyword', value: selector });
      continue;
    }

    // Property values (colors, numbers)
    if (char === '#' && /[0-9a-fA-F]/.test(code[i + 1])) {
      let color = '#';
      i++;
      while (i < code.length && /[0-9a-fA-F]/.test(code[i])) {
        color += code[i];
        i++;
      }
      tokens.push({ type: 'number', value: color });
      continue;
    }

    if (/\d/.test(char)) {
      let num = '';
      while (i < code.length && /[\d.]/.test(code[i])) {
        num += code[i];
        i++;
      }
      // Include unit
      while (i < code.length && /[a-z%]/.test(code[i])) {
        num += code[i];
        i++;
      }
      tokens.push({ type: 'number', value: num });
      continue;
    }

    // Keywords (property names)
    if (/[a-zA-Z-]/.test(char)) {
      let word = '';
      while (i < code.length && /[a-zA-Z-]/.test(code[i])) {
        word += code[i];
        i++;
      }
      // Check if it's before a colon (property name)
      let j = i;
      while (j < code.length && /\s/.test(code[j])) j++;
      if (code[j] === ':') {
        tokens.push({ type: 'attribute', value: word });
      } else {
        tokens.push({ type: 'plain', value: word });
      }
      continue;
    }

    // Operators
    if (/[:;,{}()]/.test(char)) {
      tokens.push({ type: 'operator', value: char });
      i++;
      continue;
    }

    // Plain characters
    tokens.push({ type: 'plain', value: char });
    i++;
  }

  return renderTokens(tokens);
}

/**
 * Tokenizes and highlights SQL
 */
function highlightSQL(code: string): ReactNode {
  const keywords = [
    'SELECT',
    'INSERT',
    'UPDATE',
    'DELETE',
    'FROM',
    'WHERE',
    'JOIN',
    'INNER',
    'LEFT',
    'RIGHT',
    'OUTER',
    'ON',
    'AND',
    'OR',
    'NOT',
    'IN',
    'LIKE',
    'BETWEEN',
    'ORDER',
    'BY',
    'GROUP',
    'HAVING',
    'LIMIT',
    'OFFSET',
    'AS',
    'DISTINCT',
    'COUNT',
    'SUM',
    'AVG',
    'MIN',
    'MAX',
    'CREATE',
    'DROP',
    'ALTER',
    'TABLE',
    'INDEX',
    'VIEW',
    'DATABASE',
    'SCHEMA',
    'PRIMARY',
    'KEY',
    'FOREIGN',
    'REFERENCES',
    'NULL',
    'DEFAULT',
    'AUTO_INCREMENT',
    'CONSTRAINT',
    'UNIQUE',
    'CHECK',
  ];

  const tokens: Token[] = [];
  let i = 0;

  while (i < code.length) {
    const char = code[i];
    const remaining = code.slice(i);

    // Comments
    if (remaining.startsWith('--')) {
      const end = code.indexOf('\n', i);
      const comment = end === -1 ? remaining : code.slice(i, end);
      tokens.push({ type: 'comment', value: comment });
      i += comment.length;
      continue;
    }

    if (remaining.startsWith('/*')) {
      const end = code.indexOf('*/', i + 2);
      const comment = end === -1 ? remaining : code.slice(i, end + 2);
      tokens.push({ type: 'comment', value: comment });
      i += comment.length;
      continue;
    }

    // Strings
    if (char === "'" || char === '"') {
      const quote = char;
      let str = quote;
      i++;
      while (i < code.length && code[i] !== quote) {
        if (code[i] === '\\' && i + 1 < code.length) {
          str += code[i] + code[i + 1];
          i += 2;
        } else {
          str += code[i];
          i++;
        }
      }
      if (i < code.length) {
        str += code[i];
        i++;
      }
      tokens.push({ type: 'string', value: str });
      continue;
    }

    // Numbers
    if (/\d/.test(char)) {
      let num = '';
      while (i < code.length && /[\d.]/.test(code[i])) {
        num += code[i];
        i++;
      }
      tokens.push({ type: 'number', value: num });
      continue;
    }

    // Keywords
    if (/[a-zA-Z]/.test(char)) {
      let word = '';
      while (i < code.length && /[a-zA-Z_]/.test(code[i])) {
        word += code[i];
        i++;
      }
      if (keywords.includes(word.toUpperCase())) {
        tokens.push({ type: 'keyword', value: word });
      } else {
        tokens.push({ type: 'plain', value: word });
      }
      continue;
    }

    // Operators
    if (/[=<>!+\-*/%,;().]/.test(char)) {
      tokens.push({ type: 'operator', value: char });
      i++;
      continue;
    }

    // Plain characters
    tokens.push({ type: 'plain', value: char });
    i++;
  }

  return renderTokens(tokens);
}

/**
 * Renders tokens with appropriate Tailwind CSS classes
 */
function renderTokens(tokens: Token[]): ReactNode {
  return (
    <code className="block whitespace-pre-wrap break-words">
      {tokens.map((token, index) => {
        const key = `${token.type}-${index}`;
        switch (token.type) {
          case 'keyword':
            return (
              <span
                key={key}
                className="font-semibold text-purple-600 dark:text-purple-400"
              >
                {token.value}
              </span>
            );
          case 'string':
            return (
              <span key={key} className="text-green-600 dark:text-green-400">
                {token.value}
              </span>
            );
          case 'number':
            return (
              <span key={key} className="text-blue-600 dark:text-blue-400">
                {token.value}
              </span>
            );
          case 'comment':
            return (
              <span
                key={key}
                className="text-gray-500 italic dark:text-gray-500"
              >
                {token.value}
              </span>
            );
          case 'tag':
            return (
              <span key={key} className="text-red-600 dark:text-red-400">
                {token.value}
              </span>
            );
          case 'attribute':
            return (
              <span key={key} className="text-orange-600 dark:text-orange-400">
                {token.value}
              </span>
            );
          case 'operator':
            return (
              <span key={key} className="text-gray-700 dark:text-gray-300">
                {token.value}
              </span>
            );
          default:
            return <span key={key}>{token.value}</span>;
        }
      })}
    </code>
  );
}

/**
 * Highlights code based on detected language
 */
function highlightCode(code: string, language: Language): ReactNode {
  switch (language) {
    case 'json':
      return highlightJSON(code);
    case 'javascript':
      return highlightJavaScript(code, false);
    case 'typescript':
      return highlightJavaScript(code, true);
    case 'html':
    case 'xml':
      return highlightHTML(code);
    case 'css':
      return highlightCSS(code);
    case 'sql':
      return highlightSQL(code);
    default:
      return (
        <code className="block whitespace-pre-wrap break-words">{code}</code>
      );
  }
}

/**
 * Creates a code renderer with syntax highlighting
 */
export const createCodeRenderer = (
  options: CodeRendererOptions = {},
): Renderer => {
  const enabled = options.enabled !== false;
  const minLength = options.minLength || 10;
  const maxLength = options.maxLength || 10000;

  return ({ value }) => {
    // Only process strings
    if (typeof value !== 'string') return null;

    // Check length constraints
    if (value.length < minLength || value.length > maxLength) return null;

    // Skip if not enabled
    if (!enabled) return null;

    // Detect language
    const detection = detectLanguage(value);

    // Only render if we have reasonable confidence
    if (detection.confidence < 0.7) return null;

    const languageLabel = detection.language.toUpperCase();

    return (
      <GenericRenderer icon={Code2} type={languageLabel} value={value}>
        <div className="rounded-md bg-muted/50 px-3 py-2 font-mono text-sm">
          {highlightCode(value, detection.language)}
        </div>
      </GenericRenderer>
    );
  };
};
