import { DimensionValue } from 'react-native';
import {
  NativeStyle,
  NestedStyle,
  SassyImageStyle,
  SassyTextStyle,
  SassyViewStyle,
} from './types';

/**
 * List of keys that should not be flattened (compound styles).
 */
export const ignoredKeys: string[] = ['shadowOffset'];

/**
 * List of special shorthand keys.
 */
export const specialShorthandKeys: string[] = ['inset', 'margin', 'padding', 'gap'];

/**
 * Capitalizes the first letter of each key segment.
 */
export const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Handles shared styles.
 */
export const handleSharedStyles = (
  key: string,
  parentKey: string,
  value: SassyViewStyle | SassyTextStyle | SassyImageStyle | NestedStyle,
  map: { [key: string]: NestedStyle; }
) => {
  // Handle shared styles for multiple selectors within the current parentKey context
  const selectors = key.split(',').map((s) => s.trim());

  selectors.forEach((selector) => {
    const scopedKey = parentKey ? `${parentKey}${capitalize(selector)}` : selector;

    if (!map[scopedKey]) map[scopedKey] = {};

    for (const prop in value as any) {
      if (specialShorthandKeys.includes(prop)) {
        const handler = shorthandHandlers[prop];
        Object.assign(map[scopedKey], handler(prop, value[prop] as NestedStyle));
      } else {
        map[scopedKey][prop] = value[prop];
      }
    }
  });
};

/**
 * Checks if a value is an object.
 */
export const isObject = (value: any): boolean => typeof (value) === 'object' && !Array.isArray(value);

/**
 * Assigns ignored keys without flattening.
 */
export const assignFlatStyle = (
  nativeStyles: NativeStyle,
  parentKey: string,
  key: string,
  value: SassyViewStyle | SassyTextStyle | SassyImageStyle | NestedStyle,
) => {
  if (!nativeStyles[parentKey]) nativeStyles[parentKey] = {};
  nativeStyles[parentKey][key] = value;
};

/**
 * Assigns ignored keys without flattening.
 */
export const assignIgnoredKeyStyle = (
  nativeStyles: NativeStyle,
  parentKey: string,
  key: string,
  value: SassyViewStyle | SassyTextStyle | SassyImageStyle | NestedStyle,
) => {
  if (!nativeStyles[parentKey]) nativeStyles[parentKey] = {};
  nativeStyles[parentKey][key] = value;
};

/**
 * Applies shared styles to each relevant selector in the nativeStyles object.
 */
export const applySharedStyles = (
  nativeStyles: NativeStyle,
  sharedStylesMap: {
    [key: string]: NestedStyle;
  }
) => {
  for (const selector in sharedStylesMap) {
    if (!nativeStyles[selector]) nativeStyles[selector] = {};
    Object.assign(nativeStyles[selector], sharedStylesMap[selector]);
  }
};

/**
 * Type guard to check if a value is a valid DimensionValue.
 */
function isDimensionValue(value: any): value is DimensionValue {
  return (
    typeof value === 'number' || // Is a number
    value === 'auto' || // Is 'auto'
    (typeof value === 'string' && /^(\d+(\.\d+)?)(%)?$/.test(value)) || // Is a percentage string (e.g., '10%' or '10.5%')
    value === null || // Is null
    (value && typeof value.addListener === 'function') // Is an Animated.AnimatedNode
  );
}

/**
 * Handles shorthand inset key.
 */
const handleShorthandInset = (key: string, value: NestedStyle): NestedStyle => {
  if (isDimensionValue(value)) {
    return { top: value, right: value, bottom: value, left: value };
  }

  if (Array.isArray(value) && value.every((i) => isDimensionValue(i))) {
    const [top, right, bottom, left] = value;

    switch (value.length) {
      case 1:
        return { top, right: top, bottom: top, left: top };
      case 2:
        return { top, right, bottom: top, left: right };
      case 3:
        return { top, right, bottom, left: right };
      case 4:
        return { top, right, bottom, left };
      default:
        throw new Error(`Invalid value for inset: ${JSON.stringify(value)}`);
    }
  }

  throw new Error(`Invalid value for ${key}: Expected a number, 'auto', a percentage, or an array with only those values, got ${typeof value}.`);
};

/**
 * Handles special shorthand spacing keys.
 */
const handleShorthandSpacing = (key: string, value: NestedStyle): NestedStyle => {
  if (isDimensionValue(value)) {
    return {
      [`${key}Vertical`]: value,
      [`${key}Horizontal`]: value,
    };
  }

  if (Array.isArray(value) && value.every((i) => isDimensionValue(i))) {
    const [top, right, bottom, left] = value;

    switch (value.length) {
      case 1:
        return { [key]: top };
      case 2:
        return {
          [`${key}Vertical`]: top,
          [`${key}Horizontal`]: right,
        };
      case 3:
        return {
          [`${key}Top`]: top,
          [`${key}Horizontal`]: right,
          [`${key}Bottom`]: bottom,
        };
      case 4:
        return {
          [`${key}Top`]: top,
          [`${key}Right`]: right,
          [`${key}Bottom`]: bottom,
          [`${key}Left`]: left,
        };
      default:
        throw new Error(`Invalid ${key} array length: Expected 1, 2, 3, or 4, got ${value.length}.`);
    }
  }

  throw new Error(`Invalid value for ${key}: Expected a number, 'auto', a percentage, or an array with only those values, got ${typeof value}.`);
};

/**
 * Handles gap shorthand.
 */
const handleShorthandGap = (key: string, value: NestedStyle): NestedStyle => {
  if (typeof value === 'number') {
    return { gap: value };
  };

  if (Array.isArray(value) && value.every((i) => typeof i === 'number')) {
    const [row, column] = value;

    switch (value.length) {
      case 1:
        return { gap: row };
      case 2:
        return {
          rowGap: row,
          columnGap: column,
        };
      default:
        throw new Error(`Invalid gap array length: Expected 1 or 2, got ${value.length}.`);
    }
  }

  throw new Error(`Invalid value for ${key}: Expected a number or an array of numbers, got ${typeof value}.`);
};

/**
 * Object containing the shorthand key handlers.
 */
export const shorthandHandlers: { [key: string]: (key: string, value: NestedStyle) => NestedStyle; } = {
  inset: handleShorthandInset,
  margin: handleShorthandSpacing,
  padding: handleShorthandSpacing,
  gap: handleShorthandGap,
};
