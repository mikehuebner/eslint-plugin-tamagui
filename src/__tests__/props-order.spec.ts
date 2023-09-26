import path from 'path';

import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';

import { propsOrderRule } from '../rules/props-order';

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

tester.run('props-order', propsOrderRule, {
  valid: [
    {
      name: 'Sorted style props',
      code: `
        import { Stack } from '@tamagui/core';

        <Stack key={key} m="$1" px="$2" py="$4" fontSize="md" onPress={onPress} />
      `,
    },

    {
      name: 'Sorted style props on `styled` components',
      code: `
        import { styled, Stack } from '@tamagui/core';

        const StyledStack = styled(Stack, {
          m: '$1',
          px: '$2',
          py: '$4',
          fontSize: 'md',
        });
      `,
    },

    {
      name: 'Not a Tamagui element, do not sort',
      code: `
        import { NotTamagui } from "@mui/material";
        <NotTamagui m="$2" fontSize="md" px="$2" py={2}><H1>Hello</H1></NotTamagui>
      `,
    },

    {
      name: 'Not a `styled` element, do not sort',
      code: `
        import { styled, Stack } from '@mui/material';

        const StyledStack = styled(Stack, {
          fontSize: 'md',
          m: 1,
          px: 2,
          py: 4,
        });
      `,
    },

    {
      name: 'Spreading should not be sorted',
      code: `
        import { HStack, H1 } from "@tamagui/core";
        <HStack py="2" {...props} component="div"><H1>Hello</H1></HStack>;
      `,
    },

    {
      name: 'Last priority of style props should be placed before `other props`',
      // priorityGroups.at(-1).at(-1) is outline;
      code: `
        import { HStack, H1 } from "@tamagui/core";
        <HStack outline='outline' aaaa><H1>Hello</H1></HStack>;
      `,
    },
  ],

  invalid: [
    {
      name: 'Not sorted props',
      code: `
        import { Stack } from '@tamagui/core';
        <Stack px="$2" component="div" onPress={onPress} m="$1" key={key} {...props} fontSize="md" py={2} />
      `,
      errors: [{ messageId: 'invalidOrder' }],
      output: `
        import { Stack } from '@tamagui/core';
        <Stack key={key} component="div" m="$1" px="$2" onPress={onPress} {...props} py={2} fontSize="md" />
      `,
    },

    {
      name: 'Not sorted `styled` props',
      code: `
        import { styled, Stack } from '@tamagui/core';

        const StyledStack = styled(Stack, {
          px: '$2',
          py: '$4',
          m: '$1',
          ...rest,
          border: '1px solid red',
          flexWrap: 'wrap',
        });
      `,
      errors: [{ messageId: 'invalidOrder' }],
      output: `
        import { styled, Stack } from '@tamagui/core';

        const StyledStack = styled(Stack, {
          m: '$1',
          px: '$2',
          py: '$4',
          ...rest,
          flexWrap: 'wrap',
          border: '1px solid red',
        });
      `,
    },

    {
      name: 'Multiple lines must not be concatenated',
      code: `
        import { XStack, H1 } from "@tamagui/core";
        <XStack
          px="$2"
          component="div"
          fontSize="md"
          py={2}
        >
          <H1>Hello</H1>
        </XStack>;
      `,
      errors: [{ messageId: 'invalidOrder' }],
      output: `
        import { XStack, H1 } from "@tamagui/core";
        <XStack
          component="div"
          px="$2"
          py={2}
          fontSize="md"
        >
          <H1>Hello</H1>
        </XStack>;
      `,
    },

    {
      name: '`Other Props` should be sorted in alphabetical order',
      code: `
        import { HStack, H1 } from "@tamagui/core";
        <HStack onPress={onPress} testID="data-test-id" data-weird-prop="prop" data-index={1}><H1>Hello</H1></HStack>
      `,
      errors: [{ messageId: 'invalidOrder' }],
      output: `
        import { HStack, H1 } from "@tamagui/core";
        <HStack testID="data-test-id" onPress={onPress} data-index={1} data-weird-prop="prop"><H1>Hello</H1></HStack>
      `,
    },

    {
      name: '`Style Props` of same group should be sorted in defined order, not alphabetical',
      code: `
        import { HStack, H1 } from "@tamagui/core";
        <HStack sx={sx} textStyle={textStyle} layerStyle={layerStyle} as={as}><H1>Hello</H1></HStack>
      `,
      errors: [{ messageId: 'invalidOrder' }],
      output: `
        import { HStack, H1 } from "@tamagui/core";
        <HStack as={as} sx={sx} layerStyle={layerStyle} textStyle={textStyle}><H1>Hello</H1></HStack>
      `,
    },
    {
      name: '`Style Props` of same group should be sorted in defined order, not alphabetical',
      code: `
        import { HStack, H1 } from "@tamagui/core";
        <HStack
          animation="animation"
          appearance="appearance"
          transform="transform"
          visibility="visibility"
          resize="resize"
          whiteSpace="whiteSpace"
          pointerEvents="pointerEvents"
          wordBreak="wordBreak"
          overflowWrap="overflowWrap"
          textOverflow="textOverflow"
          boxSizing="boxSizing"
          transformOrigin="transformOrigin"
          cursor="cursor"
          transition="transition"
          objectFit="objectFit"
          userSelect="userSelect"
          objectPosition="objectPosition"
          float="float"
          outline="outline"
        >
          Same priority should be sorted in defined order
        </HStack>;
        `,
      errors: [{ messageId: 'invalidOrder' }],
      output: `
        import { HStack, H1 } from "@tamagui/core";
        <HStack
          animation="animation"
          appearance="appearance"
          transform="transform"
          transformOrigin="transformOrigin"
          visibility="visibility"
          whiteSpace="whiteSpace"
          userSelect="userSelect"
          pointerEvents="pointerEvents"
          wordBreak="wordBreak"
          overflowWrap="overflowWrap"
          textOverflow="textOverflow"
          boxSizing="boxSizing"
          cursor="cursor"
          resize="resize"
          transition="transition"
          objectFit="objectFit"
          objectPosition="objectPosition"
          float="float"
          outline="outline"
        >
          Same priority should be sorted in defined order
        </HStack>;
      `,
    },
    {
      name: 'Different priorities should be sorted by priorities',
      code: `
        import { HStack, H1 } from "@tamagui/core";
        <HStack
          as={as}
          _hover={_hover}
          position={position}
          shadow={shadow}
          animation={animation}
          m={m}
          data-test-id={dataTestId}
          flex={flex}
          color={color}
          fontFamily={fontFamily}
          bg={bg}
          w={w}
          h={h}
          display={display}
          borderRadius={borderRadius}
          p={p}
          gridGap={gridGap}
        >
          <H1>Hello</H1>
        </HStack>;
      `,
      errors: [{ messageId: 'invalidOrder' }],
      output: `
        import { HStack, H1 } from "@tamagui/core";
        <HStack
          as={as}
          position={position}
          flex={flex}
          gridGap={gridGap}
          display={display}
          w={w}
          h={h}
          m={m}
          p={p}
          color={color}
          fontFamily={fontFamily}
          bg={bg}
          borderRadius={borderRadius}
          shadow={shadow}
          _hover={_hover}
          animation={animation}
          data-test-id={dataTestId}
        >
          <H1>Hello</H1>
        </HStack>;
      `,
    },
    {
      name: 'Default reservedProps should be sorted',
      code: `
        import { HStack, H1 } from "@tamagui/core";
        <HStack
          key={key}
          className={className}
          dangerouslySetInnerHtml={dangerouslySetInnerHtml}
          ref={ref}
        >
          <H1>Hello</H1>
        </HStack>;
      `,
      errors: [{ messageId: 'invalidOrder' }],
      output: `
        import { HStack, H1 } from "@tamagui/core";
        <HStack
          className={className}
          key={key}
          ref={ref}
          dangerouslySetInnerHtml={dangerouslySetInnerHtml}
        >
          <H1>Hello</H1>
        </HStack>;
      `,
    },
    {
      name: 'Different type of props should be sorted in order, except componentSpecificProps',
      code: `
        import { HStack, H1 } from "@tamagui/core";
        <HStack
          aria-label="aria-label"
          // variant={variant}
          className={className}
          p={p}
        >
          <H1>Hello</H1>
        </HStack>;
      `,
      errors: [{ messageId: 'invalidOrder' }],
      output: `
        import { HStack, H1 } from "@tamagui/core";
        <HStack
          className={className}
          // variant={variant}
          p={p}
          aria-label="aria-label"
        >
          <H1>Hello</H1>
        </HStack>;
      `,
    },
    {
      name: 'if keys are `Other Props`, they should be sorted in alphabetical order',
      code: `
        import { HStack, H1 } from "@tamagui/core";
        <HStack
          className={className}
          key={key}
          ref={ref}
          aria-label="aria-label"
        >
          <H1>Hello</H1>
        </HStack>;
      `,
      options: [
        {
          firstProps: [],
        },
      ],
      errors: [{ messageId: 'invalidOrder' }],
      output: `
        import { HStack, H1 } from "@tamagui/core";
        <HStack
          aria-label="aria-label"
          className={className}
          key={key}
          ref={ref}
        >
          <H1>Hello</H1>
        </HStack>;
      `,
    },
    {
      name: 'if lastProps is specified, that must be the last.',
      code: `
        import { HStack, H1 } from "@tamagui/core";
        <HStack
          className={className}
          onPress={onPress}
          bg={bg}
          aria-label="aria-label"
        >
          onPress should be the last
        </HStack>;
      `,
      options: [
        {
          lastProps: ['onPress', 'aria-label'],
        },
      ],
      errors: [{ messageId: 'invalidOrder' }],
      output: `
        import { HStack, H1 } from "@tamagui/core";
        <HStack
          className={className}
          bg={bg}
          onPress={onPress}
          aria-label="aria-label"
        >
          onPress should be the last
        </HStack>;
      `,
    },
    {
      name: 'if same property is set for both firstProps and lastProps, that of lastProps will be ignored.',
      code: `
        import { HStack, H1 } from "@tamagui/core";
        <HStack
          onPress={onPress}
          bg={bg}
          aria-label="aria-label"
        >
        If the same key is given different priorities in option, ignore all but the first.
        </HStack>;
      `,
      options: [
        {
          lastProps: ['onPress', 'aria-label'],
          firstProps: ['onPress', 'aria-label'],
        },
      ],
      errors: [{ messageId: 'invalidOrder' }],
      output: `
        import { HStack, H1 } from "@tamagui/core";
        <HStack
          onPress={onPress}
          aria-label="aria-label"
          bg={bg}
        >
        If the same key is given different priorities in option, ignore all but the first.
        </HStack>;
      `,
    },
  ],
});
