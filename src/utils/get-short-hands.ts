import tamaguiConfig from './get-tamagui-config';

const defaultShorthands = tamaguiConfig.shorthands as Record<string, string>;
const reversedShorthands = Object.keys(defaultShorthands).reduce(
  (ret, key) => {
    // Flip the key and value
    const value = defaultShorthands[key];

    if (!value || ret[value]) {
      return ret;
    }

    ret[value] = key;

    return ret;
  },
  {} as Record<string, string>,
);

const isShorthand = (propName: string) => !!defaultShorthands?.[propName];
const isNonShorthand = (propName: string) => !!reversedShorthands?.[propName];

/**
 * Get the shorthand for a given prop name, and if
 * it doesn't exist, return null.
 */
export const getShortHands = (propName: string) => {
  if (!isShorthand(propName)) {
    return reversedShorthands?.[propName];
  }

  return null;
};

/**
 * Get the non-shorthand for a given prop name, and if
 * it doesn't exist, return null.
 */
export const getNonShorthands = (propName: string) => {
  if (!isNonShorthand(propName)) {
    return defaultShorthands?.[propName];
  }

  return null;
};
