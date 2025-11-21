/**
 * Transformer type - a function that can modify a value before rendering
 */
export interface TransformProps {
  value: unknown;
  path: string[];
}

export type Transformer = (props: TransformProps) => unknown;

/**
 * Creates a transformer that only applies to specific paths
 */
export function createPathTransformer(
  pathPattern: string | RegExp,
  transform: (value: unknown) => unknown,
): Transformer {
  return ({ value, path }) => {
    const pathString = path.join('.');
    const matches =
      typeof pathPattern === 'string'
        ? pathString === pathPattern
        : pathPattern.test(pathString);

    return matches ? transform(value) : value;
  };
}

/**
 * Creates a transformer that only applies to specific types
 */
export function createTypeTransformer(
  type: 'string' | 'number' | 'boolean' | 'object' | 'array',
  transform: (value: unknown) => unknown,
): Transformer {
  return ({ value }) => {
    const matches =
      (type === 'string' && typeof value === 'string') ||
      (type === 'number' && typeof value === 'number') ||
      (type === 'boolean' && typeof value === 'boolean') ||
      (type === 'array' && Array.isArray(value)) ||
      (type === 'object' &&
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value));

    return matches ? transform(value) : value;
  };
}

/**
 * Chains multiple transformers together
 */
export function chainTransformers(...transformers: Transformer[]): Transformer {
  return (props: TransformProps) => {
    let currentValue = props.value;
    for (const transformer of transformers) {
      currentValue = transformer({ ...props, value: currentValue });
    }
    return currentValue;
  };
}

// ============================================================================
// Built-in String Transformers
// ============================================================================

/**
 * Converts string values to uppercase
 */
export function createUppercaseTransformer(
  pathPattern?: string | RegExp,
): Transformer {
  const transform = (value: unknown) =>
    typeof value === 'string' ? value.toUpperCase() : value;

  return pathPattern
    ? createPathTransformer(pathPattern, transform)
    : createTypeTransformer('string', transform);
}

/**
 * Converts string values to lowercase
 */
export function createLowercaseTransformer(
  pathPattern?: string | RegExp,
): Transformer {
  const transform = (value: unknown) =>
    typeof value === 'string' ? value.toLowerCase() : value;

  return pathPattern
    ? createPathTransformer(pathPattern, transform)
    : createTypeTransformer('string', transform);
}

/**
 * Trims whitespace from string values
 */
export function createTrimTransformer(
  pathPattern?: string | RegExp,
): Transformer {
  const transform = (value: unknown) =>
    typeof value === 'string' ? value.trim() : value;

  return pathPattern
    ? createPathTransformer(pathPattern, transform)
    : createTypeTransformer('string', transform);
}

/**
 * Truncates string values to a maximum length
 */
export function createTruncateTransformer(
  maxLength: number,
  suffix = '...',
  pathPattern?: string | RegExp,
): Transformer {
  const transform = (value: unknown) => {
    if (typeof value !== 'string') return value;
    return value.length > maxLength
      ? value.slice(0, maxLength) + suffix
      : value;
  };

  return pathPattern
    ? createPathTransformer(pathPattern, transform)
    : createTypeTransformer('string', transform);
}

/**
 * Formats string values using a custom format function
 */
export function createStringFormatTransformer(
  formatter: (value: string) => string,
  pathPattern?: string | RegExp,
): Transformer {
  const transform = (value: unknown) =>
    typeof value === 'string' ? formatter(value) : value;

  return pathPattern
    ? createPathTransformer(pathPattern, transform)
    : createTypeTransformer('string', transform);
}

// ============================================================================
// Built-in Number Transformers
// ============================================================================

/**
 * Rounds number values to a specified number of decimal places
 */
export function createRoundTransformer(
  decimals = 0,
  pathPattern?: string | RegExp,
): Transformer {
  const transform = (value: unknown) => {
    if (typeof value !== 'number') return value;
    const multiplier = 10 ** decimals;
    return Math.round(value * multiplier) / multiplier;
  };

  return pathPattern
    ? createPathTransformer(pathPattern, transform)
    : createTypeTransformer('number', transform);
}

/**
 * Formats number values as currency
 */
export function createCurrencyTransformer(
  locale = 'en-US',
  currency = 'USD',
  pathPattern?: string | RegExp,
): Transformer {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  });

  const transform = (value: unknown) =>
    typeof value === 'number' ? formatter.format(value) : value;

  return pathPattern
    ? createPathTransformer(pathPattern, transform)
    : createTypeTransformer('number', transform);
}

/**
 * Formats number values as percentages
 */
export function createPercentageTransformer(
  decimals = 0,
  pathPattern?: string | RegExp,
): Transformer {
  const transform = (value: unknown) => {
    if (typeof value !== 'number') return value;
    return `${(value * 100).toFixed(decimals)}%`;
  };

  return pathPattern
    ? createPathTransformer(pathPattern, transform)
    : createTypeTransformer('number', transform);
}

/**
 * Formats number values using a custom format function
 */
export function createNumberFormatTransformer(
  formatter: (value: number) => string | number,
  pathPattern?: string | RegExp,
): Transformer {
  const transform = (value: unknown) =>
    typeof value === 'number' ? formatter(value) : value;

  return pathPattern
    ? createPathTransformer(pathPattern, transform)
    : createTypeTransformer('number', transform);
}

// ============================================================================
// Built-in Date Transformers
// ============================================================================

/**
 * Formats date values (string or number timestamps) using Intl.DateTimeFormat
 */
export function createDateFormatTransformer(
  options?: Intl.DateTimeFormatOptions,
  locale = 'en-US',
  pathPattern?: string | RegExp,
): Transformer {
  const formatter = new Intl.DateTimeFormat(locale, options);

  const transform = (value: unknown) => {
    if (typeof value === 'string') {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? value : formatter.format(date);
    }
    if (typeof value === 'number') {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? value : formatter.format(date);
    }
    return value;
  };

  return pathPattern
    ? createPathTransformer(pathPattern, transform)
    : ({ value }) => transform(value);
}

/**
 * Converts date strings/timestamps to ISO 8601 format
 */
export function createISODateTransformer(
  pathPattern?: string | RegExp,
): Transformer {
  const transform = (value: unknown) => {
    if (typeof value === 'string') {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? value : date.toISOString();
    }
    if (typeof value === 'number') {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? value : date.toISOString();
    }
    return value;
  };

  return pathPattern
    ? createPathTransformer(pathPattern, transform)
    : ({ value }) => transform(value);
}

/**
 * Converts date values to a specific timezone
 */
export function createTimezoneTransformer(
  timezone: string,
  options?: Intl.DateTimeFormatOptions,
  locale = 'en-US',
  pathPattern?: string | RegExp,
): Transformer {
  const formatter = new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: timezone,
  });

  const transform = (value: unknown) => {
    if (typeof value === 'string') {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? value : formatter.format(date);
    }
    if (typeof value === 'number') {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? value : formatter.format(date);
    }
    return value;
  };

  return pathPattern
    ? createPathTransformer(pathPattern, transform)
    : ({ value }) => transform(value);
}

// ============================================================================
// Custom Transformers
// ============================================================================

/**
 * Creates a custom transformer with a user-defined function
 */
export function createCustomTransformer(
  transform: (value: unknown, path: string[]) => unknown,
): Transformer {
  return ({ value, path }) => transform(value, path);
}

/**
 * Creates a conditional transformer that applies one of two transforms based on a condition
 */
export function createConditionalTransformer(
  condition: (value: unknown, path: string[]) => boolean,
  trueTransform: Transformer,
  falseTransform?: Transformer,
): Transformer {
  return (props: TransformProps) => {
    if (condition(props.value, props.path)) {
      return trueTransform(props);
    }
    return falseTransform ? falseTransform(props) : props.value;
  };
}

// ============================================================================
// Helper function to apply transformers
// ============================================================================

/**
 * Applies a list of transformers to a value
 * Returns the transformed value without modifying the original
 */
export function applyTransformers(
  value: unknown,
  path: string[],
  transformers: Transformer[],
): unknown {
  let transformedValue = value;

  for (const transformer of transformers) {
    transformedValue = transformer({ value: transformedValue, path });
  }

  return transformedValue;
}
