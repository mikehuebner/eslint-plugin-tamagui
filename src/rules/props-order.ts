import { AST_NODE_TYPES, TSESLint, TSESTree, ESLintUtils } from '@typescript-eslint/utils';
import { getParserServices } from '@typescript-eslint/utils/eslint-utils';

import { getPropPriority } from '../utils/get-prop-priority';
import { isTamaguiElement } from '../utils/is-tamagui-element';
import { isTamaguiStyled } from '../utils/is-tamagui-styled';

const MessageIds = {
  invalidOrder: 'invalidOrder',
} as const;

type MessageIdsType = (typeof MessageIds)[keyof typeof MessageIds];

type Options = {
  firstProps?: string[];
  lastProps?: string[];
  displayCompPropsBeforeStyleProps?: boolean;
  applyToAllComponents?: boolean;
};

export type Config = {
  firstProps: string[];
  lastProps: string[];
  isCompPropsBeforeStyleProps: boolean;
  componentSpecificProps: string[] | undefined;
};

const defaultFirstProps = ['key', 'ref'];
const defaultLastProps: string[] = [];
// const defaultIsCompPropsBeforeStyleProps = false;

const isJSXAttribute = (node: TSESTree.Node): node is TSESTree.JSXAttribute =>
  node.type === AST_NODE_TYPES.JSXAttribute;

const isProperty = (node: TSESTree.Node): node is TSESTree.Property => node.type === AST_NODE_TYPES.Property;

const compareAttributes = (a: TSESTree.JSXAttribute, b: TSESTree.JSXAttribute, config: Config) => {
  const aPriority = getPropPriority(a.name.name.toString(), config);
  const bPriority = getPropPriority(b.name.name.toString(), config);

  if (aPriority !== bPriority) {
    return aPriority - bPriority;
  }

  // Same Priority. Then compare it.
  const ordering = 'alphabetical order';

  switch (ordering) {
    case 'alphabetical order':
      return a.name.name < a.name.name ? -1 : 1;
  }
};

/**
 *  Create a fixer for the given attribute, replacing it with the text of the given attribute
 */
const createFix = (
  unsotedAttribute: TSESTree.JSXAttribute | TSESTree.JSXSpreadAttribute,
  sortedAttribute: TSESTree.JSXAttribute | TSESTree.JSXSpreadAttribute,
  fixer: TSESLint.RuleFixer,
  sourceCode: Readonly<TSESLint.SourceCode>,
) => fixer.replaceText(unsotedAttribute, sourceCode.getText(sortedAttribute));

const areAllJSXAttribute = (
  attributes: (TSESTree.JSXAttribute | TSESTree.JSXSpreadAttribute)[],
): attributes is TSESTree.JSXAttribute[] =>
  attributes.every((attribute) => attribute.type === AST_NODE_TYPES.JSXAttribute);

const sortAttributes = (unsorted: (TSESTree.JSXAttribute | TSESTree.JSXSpreadAttribute)[], config: Config) => {
  const noSpread = areAllJSXAttribute(unsorted);

  if (noSpread) {
    const sorted = [...unsorted].sort((a, b) => compareAttributes(a, b, config));
    return sorted;
  }

  // contains SpreadAttribute
  // Sort sections which has only JSXAttributes.
  let start = 0;
  let end = 0;
  let sorted: (TSESTree.JSXAttribute | TSESTree.JSXSpreadAttribute)[] = [];

  for (let i = 0; i < unsorted.length; i++) {
    const unsortedProp = unsorted[i];

    if (!unsortedProp) {
      continue;
    }

    if (unsortedProp.type === AST_NODE_TYPES.JSXSpreadAttribute) {
      end = i;

      if (start < end) {
        // Sort sections which don't have JSXSpreadAttribute.
        const sectionToSort = unsorted.slice(start, end) as TSESTree.JSXAttribute[];
        const sectionSorted = sectionToSort.sort((a, b) => compareAttributes(a, b, config));

        sorted = sorted.concat(sectionSorted);
      }

      // JSXSpreadAttribute will be pushed as is.
      sorted.push(unsortedProp);

      start = i + 1;
    } else if (i === unsorted.length - 1) {
      // This is last attribute and not spread one.
      end = i + 1;

      if (start < end) {
        const sectionToSort = unsorted.slice(start, end) as TSESTree.JSXAttribute[];
        const sectionSorted = sectionToSort.sort((a, b) => compareAttributes(a, b, config));

        sorted = sorted.concat(sectionSorted);
      }
    }
  }
  return sorted;
};

const compareProperties = (a: TSESTree.ObjectLiteralElement, b: TSESTree.ObjectLiteralElement, config: Config) => {
  const aPriority = getPropPriority(a.key.name.toString(), config);
  const bPriority = getPropPriority(b.key.name.toString(), config);

  if (aPriority !== bPriority) {
    return aPriority - bPriority;
  }

  // Same Priority. Then compare it.
  const ordering = 'alphabetical order';

  switch (ordering) {
    case 'alphabetical order':
      return a.key.name < a.key.name ? -1 : 1;
  }
};

const areAllSpreadObjectProp = (props: TSESTree.ObjectExpression): props is TSESTree.ObjectExpression =>
  props.type === AST_NODE_TYPES.ObjectExpression;

const sortProps = (unsorted: TSESTree.ObjectExpression, config: Config) => {
  // const noSpread = areAllSpreadObjectProp(unsorted);

  // if (noSpread) {
  //   const sorted = [...unsorted.properties].sort((a, b) => compare(a, b, config));
  //   return sorted;
  // }

  // contains SpreadAttribute
  // Sort sections which has only JSXAttributes.
  let start = 0;
  let end = 0;
  let sorted: TSESTree.ObjectLiteralElement[] = [];

  const unsortedProperties = unsorted.properties;

  for (let i = 0; i < unsortedProperties.length; i++) {
    const unsortedProp = unsortedProperties[i];

    if (
      !unsortedProp ||
      unsortedProp.type !== AST_NODE_TYPES.Property ||
      unsortedProp.key.type !== AST_NODE_TYPES.Identifier
    ) {
      continue;
    }

    const unsortedPropName = unsortedProp.key.name;

    if (!unsortedPropName) {
      continue;
    }

    if (unsortedProp.type === AST_NODE_TYPES.SpreadElement) {
      end = i;

      if (start < end) {
        // Sort sections which don't have JSXSpreadAttribute.
        const sectionToSort = unsorted.properties.slice(start, end);
        const sectionSorted = sectionToSort.sort((a, b) => compareProperties(a, b, config));

        sorted = sorted.concat(sectionSorted);
      }

      // JSXSpreadAttribute will be pushed as is.
      sorted.push(unsortedProp);

      start = i + 1;
    } else if (i === unsortedProperties.length - 1) {
      // This is last attribute and not spread one.
      end = i + 1;

      if (start < end) {
        // Sort sections which don't have JSXSpreadAttribute.
        const sectionToSort = unsorted.properties.slice(start, end);
        console.log(sectionToSort.map((prop) => prop.key.name));
        const sectionSorted = sectionToSort.sort((a, b) => compareProperties(a, b, config));
        console.log(sectionSorted.map((prop) => prop.key.name));
        sorted = sorted.concat(sectionSorted);
      }
    }
  }

  return sorted;
};

/**
 * Props order rule to enforce a order of the Tamagui component's props.
 */
export const propsOrderRule = ESLintUtils.RuleCreator.withoutDocs<Options[], MessageIdsType>({
  meta: {
    type: 'suggestion',
    docs: {
      description: "Enforce a order of the Tamagui component's props.",
      recommended: 'recommended',
      requiresTypeChecking: true,
      url: 'https://github.com/yukukotani/eslint-plugin-chakra-ui/blob/main/docs/rules/props-order.md',
    },
    messages: {
      [MessageIds.invalidOrder]: 'Invalid Tamagui props order.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          firstProps: {
            type: 'array',
            items: { type: 'string', minLength: 0 },
            uniqueItems: true,
          },
          lastProps: {
            type: 'array',
            items: { type: 'string', minLength: 0 },
            uniqueItems: true,
          },
          displayCompPropsBeforeStyleProps: {
            type: 'boolean',
            default: false,
          },
          applyToAllComponents: {
            type: 'boolean',
            default: false,
          },
        },
      },
    ],
    fixable: 'code',
  },

  defaultOptions: [{}],

  create: (ctx) => {
    const { report, getSourceCode, options } = ctx;
    const parserServices = getParserServices(ctx, false);

    const option = options[0];

    return {
      JSXOpeningElement(node) {
        if (!option?.applyToAllComponents && !isTamaguiElement(node, parserServices)) {
          return;
        }

        const config = {
          firstProps: option?.firstProps ? option?.firstProps : defaultFirstProps,
          lastProps: option?.lastProps ? option?.lastProps : defaultLastProps,
          isCompPropsBeforeStyleProps: true, // options?.displayCompPropsBeforeStyleProps ? ~ : defaultIsCompPropsBeforeStyleProps
          componentSpecificProps: undefined, // not supported yet
        } satisfies Config;

        const sorted = sortAttributes(node.attributes, config);
        const sourceCode = getSourceCode();

        for (const [index, attribute] of node.attributes.entries()) {
          const sortedAttribute = sorted[index]!;

          if (attribute.type !== AST_NODE_TYPES.JSXAttribute) {
            continue;
          }

          if (
            sortedAttribute.type !== AST_NODE_TYPES.JSXAttribute ||
            sortedAttribute.name.name !== attribute.name.name
          ) {
            report({
              node: node,
              messageId: MessageIds.invalidOrder,
              fix: (fixer) => {
                console.log('fixing');
                const fixingList = sorted.map((sortedAttribute, index) =>
                  createFix(node.attributes[index]!, sortedAttribute, fixer, sourceCode),
                );

                // Operate from the end so that the unoperated node positions are not changed.
                // If you start from the start, each time you manipulate a attribute,
                // the following node positions will shift and autofix never work.
                return fixingList.reverse();
              },
            });

            break;
          }
        }
      },

      CallExpression(node) {
        if (!isTamaguiStyled(node, parserServices)) {
          return;
        }

        const styledObjectArg = node.arguments[1]!;

        if (styledObjectArg.type !== 'ObjectExpression') {
          return;
        }

        const config = {
          firstProps: option?.firstProps ? option?.firstProps : defaultFirstProps,
          lastProps: option?.lastProps ? option?.lastProps : defaultLastProps,
          isCompPropsBeforeStyleProps: true, // options?.displayCompPropsBeforeStyleProps ? ~ : defaultIsCompPropsBeforeStyleProps
          componentSpecificProps: undefined, // not supported yet
        } satisfies Config;

        const sortedProperties = sortProps(styledObjectArg, config);

        // Check properties that need replacement
        for (const property of styledObjectArg.properties) {
          if (property.type !== 'Property' || property.key.type !== 'Identifier') {
            continue;
          }

          const originalPropName = property.key.name;

          // if (PROP_REPLACEMENTS[originalPropName]) {
          //   report({
          //     node: node,
          //     messageId: MessageIds.invalidOrder,
          //     fix: (fixer) => {
          //       console.log('fixing');
          //       const fixingList = sorted.map((sortedAttribute, index) =>
          //         createFix(node.attributes[index]!, sortedAttribute, fixer, sourceCode),
          //       );

          //       // Operate from the end so that the unoperated node positions are not changed.
          //       // If you start from the start, each time you manipulate a attribute,
          //       // the following node positions will shift and autofix never work.
          //       return fixingList.reverse();
          //     },
          //   });
          // }
        }
      },
    };
  },
});
