// This is a patched version of path-to-regexp to fix the Missing parameter name error
export interface TokensToRegexpOptions {
  sensitive?: boolean;
  strict?: boolean;
  end?: boolean;
  start?: boolean;
  delimiter?: string;
  encode?: (value: string) => string;
  endsWith?: string | string[];
}

export interface ParseOptions {
  delimiter?: string;
  prefixes?: string;
}

export interface TokensToFunctionOptions {
  encode?: (value: string) => string;
  validate?: boolean;
}

export interface RegexpToFunctionOptions {
  decode?: (value: string) => string;
}

export interface Key {
  name: string | number;
  prefix: string;
  suffix: string;
  pattern: string;
  modifier: string;
}

/**
 * Tokenize input string.
 */
function lexer(str: string) {
  const tokens = [];
  let i = 0;

  while (i < str.length) {
    const char = str[i];

    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }

    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }

    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }

    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }

    if (char === ":") {
      let name = "";
      let j = i + 1;

      while (j < str.length) {
        const code = str.charCodeAt(j);

        if (
          // `0-9`
          (code >= 48 && code <= 57) ||
          // `A-Z`
          (code >= 65 && code <= 90) ||
          // `a-z`
          (code >= 97 && code <= 122) ||
          // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }

        break;
      }

      if (!name) {
        // PATCHED: Handle URLs by converting any URLs to escaped chars
        if (str.substring(i, i+3) === "://") {
          tokens.push({ type: "ESCAPED_CHAR", index: i, value: str[i++] });
          continue;
        }
        
        // Handle the case for `:` without a parameter name by escaping it
        tokens.push({ type: "ESCAPED_CHAR", index: i, value: str[i++] });
        continue;
      }

      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }

    if (char === "(") {
      let count = 1;
      let pattern = "";
      let j = i + 1;

      if (str[j] === "?") {
        throw new TypeError(`Pattern cannot start with "?" at ${j}`);
      }

      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }

        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError(`Capturing groups are not allowed at ${j}`);
          }
        }

        pattern += str[j++];
      }

      if (count) throw new TypeError(`Unbalanced pattern at ${i}`);
      if (!pattern) throw new TypeError(`Missing pattern at ${i}`);

      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }

    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }

  tokens.push({ type: "END", index: i, value: "" });

  return tokens;
}

export function parse(str: string, options: ParseOptions = {}): Key[] {
  const tokens = lexer(str);
  const { prefixes = "./" } = options;
  const defaultPattern = `[^${escapeString(options.delimiter || "/#?")}]+?`;
  const result: Key[] = [];
  let key = 0;
  let i = 0;
  let path = "";

  const tryConsume = (type: string): string | undefined => {
    if (i < tokens.length && tokens[i].type === type) return tokens[i++].value;
  };

  const mustConsume = (type: string): string => {
    const value = tryConsume(type);
    if (value !== undefined) return value;
    const { type: nextType, index } = tokens[i];
    throw new TypeError(`Unexpected ${nextType} at ${index}, expected ${type}`);
  };

  const consumeText = (): string => {
    let result = "";
    let value: string | undefined;
    while ((value = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR"))) {
      result += value;
    }
    return result;
  };

  while (i < tokens.length) {
    const char = tryConsume("CHAR");
    const name = tryConsume("NAME");
    const pattern = tryConsume("PATTERN");

    if (name || pattern) {
      let prefix = char || "";

      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }

      if (path) {
        result.push({ name: key++, prefix: "", suffix: "", pattern: "", modifier: "" });
        path = "";
      }

      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || defaultPattern,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }

    const value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }

    if (path) {
      result.push({ name: key++, prefix: "", suffix: "", pattern: "", modifier: "" });
      path = "";
    }

    const open = tryConsume("OPEN");
    if (open) {
      const prefix = consumeText();
      const name = tryConsume("NAME") || "";
      const pattern = tryConsume("PATTERN") || "";
      const suffix = consumeText();

      mustConsume("CLOSE");

      result.push({
        name: name || (pattern ? key++ : ""),
        prefix,
        suffix,
        pattern: name && !pattern ? defaultPattern : pattern,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }

    mustConsume("END");
  }

  return result;
}

/**
 * Escape a regular expression string.
 */
function escapeString(str: string) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}

/**
 * Create path match function from `path-to-regexp` spec.
 */
export function match(str: string, options?: TokensToFunctionOptions) {
  const keys: Key[] = [];
  const re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}

/**
 * Create a path match function from `path-to-regexp` output.
 */
export function regexpToFunction(
  re: RegExp,
  keys: Key[],
  options: RegexpToFunctionOptions = {}
) {
  const { decode = (x: string) => x } = options;

  return function(pathname: string) {
    const m = re.exec(pathname);
    if (!m) return false;

    const { 0: path, index } = m;
    const params: Record<string, any> = {};

    for (let i = 1; i < m.length; i++) {
      if (m[i] === undefined) continue;

      const key = keys[i - 1];

      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i].split(key.prefix + key.suffix).map(value => {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i], key);
      }
    }

    return { path, index, params };
  };
}

/**
 * Compile a string to a template function for the path.
 */
export function compile<P extends object = object>(
  str: string,
  options?: TokensToFunctionOptions
) {
  return tokensToFunction<P>(parse(str, options), options);
}

/**
 * Expose a method for transforming tokens into the path function.
 */
export function tokensToFunction<P extends object = object>(
  tokens: Key[],
  options: TokensToFunctionOptions = {}
) {
  const reFlags = options.sensitive ? "" : "i";
  const { encode = (x: string) => x, validate = true } = options;

  // Compile all the tokens into regexps.
  const matches = tokens.map(token => {
    if (token.pattern) {
      return new RegExp(`^(?:${token.pattern})$`, reFlags);
    }
    return null;
  });

  return function(data: Record<string | number, any> = {}) {
    let path = "";

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (typeof token.name === "number") {
        path += token.prefix + token.suffix;
        continue;
      }

      const value = data[token.name];
      const optional = token.modifier === "?" || token.modifier === "*";
      const repeat = token.modifier === "*" || token.modifier === "+";

      if (Array.isArray(value)) {
        if (!repeat) {
          throw new TypeError(
            `Expected "${token.name}" to not repeat, but got an array`
          );
        }

        if (value.length === 0) {
          if (optional) continue;

          throw new TypeError(`Expected "${token.name}" to not be empty`);
        }

        for (let j = 0; j < value.length; j++) {
          const segment = encode(value[j], token);

          if (validate && !matches[i]?.test(segment)) {
            throw new TypeError(
              `Expected all "${token.name}" to match "${token.pattern}", but got "${segment}"`
            );
          }

          path += token.prefix + segment + token.suffix;
        }

        continue;
      }

      if (typeof value === "string" || typeof value === "number") {
        const segment = encode(String(value), token);

        if (validate && !matches[i]?.test(segment)) {
          throw new TypeError(
            `Expected "${token.name}" to match "${token.pattern}", but got "${segment}"`
          );
        }

        path += token.prefix + segment + token.suffix;
        continue;
      }

      if (optional) continue;

      const typeOfMessage = repeat ? "an array" : "a string";
      throw new TypeError(`Expected "${token.name}" to be ${typeOfMessage}`);
    }

    return path;
  };
}

/**
 * Transform an array of tokens into a regular expression.
 */
export function tokensToRegexp(
  tokens: Key[],
  keys?: Key[],
  options?: TokensToRegexpOptions
) {
  const {
    strict = false,
    start = true,
    end = true,
    encode = (x: string) => x,
    delimiter = "/#?",
    endsWith = "",
  } = options || {};
  const endsWithRe = `[${escapeString(endsWith)}]|$`;
  const delimiterRe = `[${escapeString(delimiter)}]`;
  let route = start ? "^" : "";

  // Iterate over the tokens and create our regexp string.
  for (const token of tokens) {
    if (typeof token.name === "number") {
      route += token.prefix + token.suffix;
      continue;
    }

    const prefix = escapeString(token.prefix);
    const suffix = escapeString(token.suffix);

    if (token.pattern) {
      if (keys) keys.push(token);

      if (prefix || suffix) {
        if (token.modifier === "+" || token.modifier === "*") {
          const mod = token.modifier === "*" ? "?" : "";
          route += `(?:${prefix}((?:${token.pattern})(?:${suffix}${prefix}(?:${token.pattern}))*)${suffix})${mod}`;
        } else {
          route += `(?:${prefix}(${token.pattern})${suffix})${token.modifier}`;
        }
      } else {
        if (token.modifier === "+" || token.modifier === "*") {
          route += `((?:${token.pattern})${token.modifier})`;
        } else {
          route += `(${token.pattern})${token.modifier}`;
        }
      }
    } else {
      route += `(?:${prefix}${suffix})${token.modifier}`;
    }
  }

  if (end) {
    if (!strict) route += `${delimiterRe}?`;

    route += !options?.endsWith ? "$" : `(?=${endsWithRe})`;
  } else {
    const endToken = tokens[tokens.length - 1];
    const isEndDelimited =
      typeof endToken === "string"
        ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1
        : endToken === undefined;

    if (!strict) {
      route += `(?:${delimiterRe}(?=${endsWithRe}))?`;
    }

    if (!isEndDelimited) {
      route += `(?=${delimiterRe}|${endsWithRe})`;
    }
  }

  return new RegExp(route, options?.sensitive ? "" : "i");
}

/**
 * Create path match function from `path-to-regexp` spec.
 */
export function pathToRegexp(
  path: string,
  keys?: Key[],
  options?: TokensToRegexpOptions
) {
  if (path instanceof RegExp) return path;
  if (Array.isArray(path)) return tokensToRegexp(path, keys, options);
  
  // PATCH: Fix for URLs with protocol (https://, http://, etc)
  if (typeof path === 'string' && path.includes('://')) {
    // Escape the colon in the protocol part of URLs
    path = path.replace(/(https?):\/\//g, '$1\\:\\/\\/');
  }
  
  return tokensToRegexp(parse(path, options), keys, options);
}

export default pathToRegexp;