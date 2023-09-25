import { readFileSync } from 'fs';
import path from 'path';

import { TamaguiProjectInfo, type TamaguiInternalConfig } from '@tamagui/core';
import chalk from 'chalk';

import { TamaguiConfigOptions, readTamaguiOptions } from './read-tamagui-options';

type Themes = TamaguiInternalConfig['themes'];
type ThemeKey = keyof TamaguiInternalConfig['themes'] & string;
type Theme = Themes[ThemeKey];

const simplifyTokenMap = (
  tokens: TamaguiInternalConfig['tokens'][keyof TamaguiInternalConfig['tokens']],
  transformNumbersToPx = true,
) => {
  return Object.fromEntries(
    Object.values(tokens).map((variable) => {
      return [
        variable.key as string,
        transformNumbersToPx && typeof variable.val === 'number' ? `${variable.val}px` : `${variable.val}`,
      ];
    }),
  ) as Record<string, string>;
};

/**
 * Get count of underscores in a string
 */
const underscoreDepth = (str: string) => str.split('_').length - 1;

/**
 * Sort themes by depth of underscores, then by presence of defaultTheme,
 * then alphabetically
 */
const sortThemes = (defaultTheme: string) => {
  const defaultThemePrefix = `${defaultTheme}_`;
  return ([keyA]: [ThemeKey, Theme], [keyB]: [ThemeKey, Theme]) => {
    const depthA = underscoreDepth(keyA);
    const depthB = underscoreDepth(keyB);
    if (depthA === depthB) {
      const isADefault = keyA === defaultTheme;
      const isADefaultSubtheme = keyA.startsWith(defaultThemePrefix);
      const isBDefault = keyB === defaultTheme;
      const isBDefaultSubtheme = keyB.startsWith(defaultThemePrefix);
      if (isADefault) return -1;
      if (isBDefault) return 1;
      if (isADefaultSubtheme && !isBDefaultSubtheme) return -1;
      if (isBDefaultSubtheme && !isADefaultSubtheme) return 1;
      return keyA.localeCompare(keyB);
    }
    return depthA - depthB;
  };
};

const componentThemePattern = /_[A-Z]/;

/**
 * Utility to transform a record of themes into a record of theme tokens
 * with the theme names as keys and the token values as values
 */
const getThemeColors = (themes: TamaguiInternalConfig['themes'], { defaultTheme }: TamaguiConfigOptions) => {
  const themeTokens: Record<string, Record<string, string>> = {};

  const sortedThemes = Object.entries(themes);
  sortedThemes.sort(sortThemes(defaultTheme));

  for (const [themeName, theme] of sortedThemes) {
    if (componentThemePattern.test(themeName)) continue;

    for (const [key, variable] of Object.entries(theme)) {
      if (key === 'id') continue;
      const $key = `$${key}`;
      themeTokens[$key] ??= {};
      themeTokens[$key]![themeName] = variable.val ?? (variable as unknown as string);
    }
  }

  return themeTokens;
};

/**
 * Read and process the tamagui config file into a simpler format
 */
export const getTamaguiConfig = () => {
  const options = readTamaguiOptions();

  const tamaguiConfigFilePath = path.join('./.tamagui/tamagui.config.json');
  const tamaguiConfigFile = readFileSync(tamaguiConfigFilePath, 'utf-8');

  if (!tamaguiConfigFile) {
    throw new Error(`No tamagui config file found.`);
  }

  const jsonConfig = JSON.parse(tamaguiConfigFile) as TamaguiProjectInfo;
  const { themes, shorthands, tokens } = jsonConfig.tamaguiConfig;

  // Get all possible component library names, these are what we use to give context
  // to the file when parsing
  const moduleNames = jsonConfig.components.map((component) => component.moduleName);

  const color = simplifyTokenMap(tokens.color);
  const space = simplifyTokenMap(tokens.space);
  const size = simplifyTokenMap(tokens.size);
  const radius = simplifyTokenMap(tokens.radius);
  const zIndex = simplifyTokenMap(tokens.zIndex, false);
  const themeColors = getThemeColors(themes, options);

  const config = {
    moduleNames,
    color,
    space,
    size,
    radius,
    shorthands,
    themeColors,
    zIndex,
  } as const;

  console.log(chalk.green(`👾 Parsed Tamagui Config from ${tamaguiConfigFilePath}`));

  return config;
};

export type ParsedTamaguiConfig = ReturnType<typeof getTamaguiConfig>;
