import * as path from 'path';

const normalizeFilter = (token: string) => (token.startsWith('$') ? token : `$${token}`);

export const createCustomTokenFilter = ({
  themeColor,
  color,
  size,
  space,
  radius,
  zIndex,
}: {
  themeColor?: string[];
  color?: string[];
  size?: string[];
  space?: string[];
  radius?: string[];
  zIndex?: string[];
}) => {
  if (!themeColor && !color && !size && !space && !radius && !zIndex) return undefined;

  const customFilters = {
    themeColor: themeColor && new Set(themeColor?.map(normalizeFilter)),
    color: color && new Set(color?.map(normalizeFilter)),
    size: size && new Set(size?.map(normalizeFilter)),
    space: space && new Set(space?.map(normalizeFilter)),
    radius: radius && new Set(radius?.map(normalizeFilter)),
    zIndex: zIndex && new Set(zIndex?.map(normalizeFilter)),
  } as const;

  const customFilter = (scale: keyof typeof customFilters, token: string) => {
    return customFilters?.[scale]?.has(token);
  };

  customFilter.toString = () =>
    Object.entries(customFilters)
      .filter(([, val]) => !!val)
      .map(([key, val]) => `${key}<${[...val!].join(', ')}>`)
      .join('; ');

  return customFilter;
};

/**
 * Read options passed in from the tsconfig.json file
 */
export const readTamaguiOptions = () => {
  const rootDir = path.join(__dirname, '../../../../');

  const tamaguiConfigFilePath = path.join(
    // path.isAbsolute(pathToApp) ? pathToApp : path.join(rootDir, pathToApp),
    './.tamagui/tamagui.config.json',
  );

  return {
    tamaguiConfigFilePath,
    defaultTheme: 'light',
    // colorTileSize,
    // completionFilters: {
    //   showColorTokens,
    //   showTrueTokens,
    //   custom: createCustomTokenFilter({
    //     themeColor: themeColorFilters,
    //     color: colorFilters,
    //     size: sizeFilters,
    //     space: spaceFilters,
    //     radius: radiusFilters,
    //     zIndex: zIndexFilters,
    //   }),
    // },
  };
};

export type TamaguiConfigOptions = ReturnType<typeof readTamaguiOptions>;
