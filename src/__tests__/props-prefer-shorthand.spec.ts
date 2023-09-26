import path from 'path';

import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';

import { propsPreferShorthandRule } from '../rules/props-prefer-shorthand';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.afterAll = afterAll;

const tester = new RuleTester({
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    ecmaFeatures: {
      jsx: true,
    },
    tsconfigRootDir: path.join(__dirname, 'fixtures'),
    project: './tsconfig.json',
  },
});

tester.run('props-prefer-shorthand', propsPreferShorthandRule, {
  valid: [
    {
      name: 'Shorthand',
      code: `
          import { Box } from "@tamagui/core";

          <Box m="$2" pt="$4">Hello</Box>
        `,
    },
    {
      name: 'No Shorthand',
      code: `
          import { Box } from "@tamagui/core";

          <Box margin="$2" paddingTop="$4">Hello</Box>
        `,
      options: [{ noShorthand: true }],
    },
    {
      name: 'Not Tamagui element',
      code: `
          import { NotTamagui } from "not-tamagui";

          <NotTamagui margin={4}>Hello</NotTamagui>
        `,
    },
  ],
  invalid: [
    {
      name: 'Require shorthand',
      code: `
          import { HStack, H1 } from "@tamagui/core";

          <HStack margin="$2" paddingTop="$4" pb="$4"><H1>Testing</H1></HStack>
      `,
      errors: [{ messageId: 'enforcesShorthand' }, { messageId: 'enforcesShorthand' }],
      output: `
          import { HStack, H1 } from "@tamagui/core";

          <HStack m="$2" pt="$4" pb="$4"><H1>Testing</H1></HStack>
      `,
    },
    {
      name: 'Require no shorthand',
      code: `
          import { HStack, H1 } from "@tamagui/core";

          <HStack m="$2" pt="$4" paddingBottom="$6"><H1>Testing</H1></HStack>
      `,
      options: [{ noShorthand: true }],
      errors: [{ messageId: 'enforcesNoShorthand' }, { messageId: 'enforcesNoShorthand' }],
      output: `
        import { HStack, H1 } from "@tamagui/core";

        <HStack margin="$2" paddingTop="$4" paddingBottom="$6"<H1>Testing</H1></HStack>
      `,
    },
    // {
    //   name: 'Require Grid and Flex props shorthand',
    //   code: `
    //       import { Grid, Flex } from "@chakra-ui/react";

    //       <>
    //         <Grid gridGap={2}>Hello</Grid>
    //         <Flex gridGap={2} justifyContent="center">Hello</Flex>
    //       </>
    //   `,
    //   errors: [{ messageId: 'enforcesShorthand' }, { messageId: 'enforcesShorthand' }],
    //   output: `
    //       import { Grid, Flex } from "@chakra-ui/react";

    //       <>
    //         <Grid gap={2}>Hello</Grid>
    //         <Flex gridGap={2} justify="center">Hello</Flex>
    //       </>
    //   `,
    // },
    // {
    //   name: 'Support JSXSpreadAttribute',
    //   code: `
    //       import { Grid, Flex } from "@chakra-ui/react";

    //       <>
    //         <Grid {...{w:2}} gridGap={2}>Hello</Grid>
    //         <Flex {...{w:2}} gridGap={2} justifyContent="center">Hello</Flex>
    //       </>
    //   `,
    //   errors: [{ messageId: 'enforcesShorthand' }, { messageId: 'enforcesShorthand' }],
    //   output: `
    //       import { Grid, Flex } from "@chakra-ui/react";

    //       <>
    //         <Grid {...{w:2}} gap={2}>Hello</Grid>
    //         <Flex {...{w:2}} gridGap={2} justify="center">Hello</Flex>
    //       </>
    //   `,
    // },
  ],
});
