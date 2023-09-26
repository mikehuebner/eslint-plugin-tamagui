import { AST_NODE_TYPES, ESLintUtils, TSESLint, TSESTree } from '@typescript-eslint/utils';
import { getParserServices } from '@typescript-eslint/utils/eslint-utils';

import { getNonShorthands, getShortHands } from '../utils/get-short-hands';
import { isTamaguiElement } from '../utils/is-tamagui-element';

const MessageIds = {
  enforcesShorthand: 'enforcesShorthand',
  enforcesNoShorthand: 'enforcesNoShorthand',
} as const;

type MessageIdsType = (typeof MessageIds)[keyof typeof MessageIds];

type Options = {
  noShorthand?: boolean;
  shorthand?: boolean;
  applyToAllComponents?: boolean;
};

const getAttributeText = (attribute: TSESTree.JSXAttribute, key: string, sourceCode: Readonly<TSESLint.SourceCode>) => {
  if (attribute.value) {
    const valueText = sourceCode.getText(attribute.value);
    return `${key}=${valueText}`;
  } else {
    return key;
  }
};

export const propsPreferShorthandRule = ESLintUtils.RuleCreator.withoutDocs<Options[], MessageIdsType>({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforces the usage of shorthand Tamagui component props based on the shorthands from Tamagui config',
      recommended: 'recommended',
      requiresTypeChecking: true,
      url: 'https://github.com/yukukotani/eslint-plugin-chakra-ui/blob/main/docs/rules/props-shorthand.md',
    },
    messages: {
      [MessageIds.enforcesShorthand]: "Prop '{{invalidName}}' could be replaced by the '{{validName}}' shorthand.",
      [MessageIds.enforcesNoShorthand]: "Shorthand prop '{{invalidName}}' could be replaced by the '{{validName}}'.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          shorthand: {
            type: 'boolean',
            default: false,
          },
          noShorthand: {
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

    const { noShorthand = false, applyToAllComponents = false } = options[0] || {};

    return {
      JSXOpeningElement(node) {
        if (!applyToAllComponents && !isTamaguiElement(node, parserServices)) {
          return;
        }

        for (const attribute of node.attributes) {
          if (attribute.type !== AST_NODE_TYPES.JSXAttribute) {
            continue;
          }

          // const sourceCode = getSourceCode();
          // const componentName = sourceCode.getText(node.name);
          const propName = attribute.name.name.toString();
          const newPropName = noShorthand ? getNonShorthands(propName) : getShortHands(propName);
          const messageId = noShorthand ? MessageIds.enforcesNoShorthand : MessageIds.enforcesShorthand;

          if (newPropName) {
            report({
              node,
              messageId,
              data: {
                invalidName: propName,
                validName: newPropName,
              },
              fix: (fixer) => {
                const sourceCode = getSourceCode();
                const newAttributeText = getAttributeText(attribute, newPropName, sourceCode);

                return fixer.replaceText(attribute, newAttributeText);
              },
            });
          }
        }
      },
    };
  },
});
