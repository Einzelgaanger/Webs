/**
 * Path-to-RegExp Fix Module
 * 
 * This is a modified version of the path-to-regexp module that properly handles URLs with protocols
 * such as http:// and https:// which were causing errors in the original module.
 */

interface TokensToRegexpOptions {
  sensitive?: boolean;
  strict?: boolean;
  end?: boolean;
  start?: boolean;
  delimiter?: string;
  encode?: (value: string) => string;
  endsWith?: string | string[];
}

interface ParseOptions {
  delimiter?: string;
  prefixes?: string;
}

interface Token {
  name: string | number;
  prefix: string;
  suffix: string;
  pattern: string;
  modifier: string;
}

interface RegexpToFunctionOptions {
  decode?: (value: string, token: string) => string;
}

interface TokensToFunctionOptions {
  encode?: (value: string, token: string) => string;
  validate?: boolean;
}

// Safe URL detection regex to identify URLs with protocols
const URL_PROTOCOL_REGEX = /^(https?|ftp|file):\/\//;

// Escape a regular expression string.
function escapeString(str: string) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}

// Escape the capturing group by escaping special characters and meaning.
function escapeGroup(group: string) {
  return group.replace(/([=!:$/()])/g, "\\$1");
}

// Parse a string for the raw tokens.
function parse(str: string, options: ParseOptions = {}) {
  const tokens = [];
  let key = 0;
  let index = 0;
  let path = "";
  const defaultDelimiter = options.delimiter || "/";
  const delimiters = options.delimiters || "./";
  let pathEscaped = false;
  let isURL = false;
  
  // Check if the string is a URL with a protocol
  if (URL_PROTOCOL_REGEX.test(str)) {
    isURL = true;
    // For URLs, we'll treat the entire protocol part as a literal
    const protocolParts = str.split('//');
    if (protocolParts.length > 1) {
      const protocol = protocolParts[0] + '//';
      tokens.push({
        type: 'LITERAL',
        index: 0,
        value: protocol
      });
      
      // Adjust the input string to start after the protocol
      str = str.substring(protocol.length);
      index = protocol.length;
    }
  }

  // Main parse loop
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    
    // Skip processing colon if it's part of a URL
    if (char === ":" && isURL && i > 0 && str[i-1] !== '/') {
      // This is likely part of a URL protocol or port, treat as literal
      continue;
    }
    
    // Standard path-to-regexp parsing logic
    if (char === ":" && !pathEscaped) {
      const name = str.slice(index, i);
      path += name;
      
      let j = i + 1;
      let paramName = "";
      
      // Parameter name extraction
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
          paramName += str[j++];
          continue;
        }
        
        break;
      }
      
      if (!paramName) {
        // For URLs with colons not followed by a parameter name,
        // treat the colon as a literal character
        if (isURL) {
          path += ":";
          index = i + 1;
          continue;
        } else {
          throw new TypeError(`Missing parameter name at ${i}: ${str}`);
        }
      }
      
      // Process parameter
      tokens.push({
        type: 'NAME',
        index: i,
        value: paramName
      });
      
      index = j;
      i = j - 1;
    } else if (char === "(") {
      const count = 1;
      let pattern = "";
      const j = i + 1;
      
      if (str[j] === "?") {
        throw new TypeError(`Pattern cannot start with "?" at ${j}: ${str}`);
      }
      
      // Add to pattern until matching parenthesis
      // Handle nested parentheses
      let k = j;
      while (k < str.length) {
        if (str[k] === "\\") {
          pattern += str[k++] + str[k++];
          continue;
        }
        
        if (str[k] === ")") {
          tokens.push({
            type: 'PATTERN',
            index: i,
            value: pattern
          });
          
          path += str.slice(index, i);
          index = k + 1;
          i = k;
          break;
        }
        
        pattern += str[k++];
      }
      
      if (k === str.length) {
        throw new TypeError(`Unbalanced pattern at ${i}: ${str}`);
      }
    } else if (char === "\\") {
      path += str.slice(index, i);
      path += str[++i];
      index = i + 1;
    } else {
      if (char === "[") pathEscaped = true;
      if (char === "]") pathEscaped = false;
      path += str.slice(index, i + 1);
      index = i + 1;
    }
  }
  
  // Add any remaining part of the string
  if (index < str.length) {
    path += str.slice(index);
  }
  
  return tokens;
}

// Compile a string to a template function for the path.
function compile(str: string) {
  return tokensToFunction(parse(str));
}

// Create path match function from path-to-regexp tokens
function tokensToFunction(tokens: any[]) {
  // Special case for URLs with protocols
  const hasURLProtocol = tokens.length > 0 && tokens[0]?.type === 'LITERAL' && 
                         URL_PROTOCOL_REGEX.test(tokens[0]?.value);
  
  return function(data: Record<string, any> = {}) {
    let path = "";
    
    // Handle URL protocol part if present
    if (hasURLProtocol) {
      path += tokens[0].value;
      tokens = tokens.slice(1);
    }
    
    // Rest of function remains same as original
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      if (token.type === 'LITERAL') {
        path += token.value;
        continue;
      }
      
      const value = data[token.value];
      
      if (value == null) {
        throw new TypeError(`Missing required parameter '${token.value}'`);
      }
      
      path += encodeURIComponent(String(value));
    }
    
    return path;
  };
}

// Export the patched functions
export {
  parse,
  compile,
  tokensToFunction
};