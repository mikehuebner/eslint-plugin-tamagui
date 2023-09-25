import { TSESTree, ParserServicesWithTypeInformation } from '@typescript-eslint/utils';
import { Declaration, Expression, ImportDeclaration, Symbol, SyntaxKind } from 'typescript';

import { getTamaguiConfig } from './get-tamagui-config';

// eslint-disable-next-line @typescript-eslint/ban-types -- This Symbol is imported from "typescript"
const getModuleSpecifierOfImportSpecifier = (symbol: Symbol) => {
  if (symbol.declarations == null || symbol.declarations.length < 1) {
    return null;
  }

  const moduleSpecifier = findModuleSpecifier(symbol.declarations[0]);
  if (!moduleSpecifier) {
    return null;
  }

  const text = moduleSpecifier.getText();
  // strip quote
  return text.slice(1, text.length - 1);
};

const findModuleSpecifier = (declaration: Declaration): Expression | null => {
  if (declaration.kind === SyntaxKind.ImportSpecifier) {
    return (declaration.parent.parent.parent as ImportDeclaration).moduleSpecifier;
  } else if (declaration.kind === SyntaxKind.NamedImports) {
    // @ts-expect-error TS 4.4 Support. declaration.parent.parent.parent is ImportEqualsDeclaration
    return declaration.parent.parent.parent.moduleSpecifier;
  }

  return null;
};

/**
 * This tests if the given node is a JSX element from the Tamagui module library, or at least
 * one of them.
 */
export const isTamaguiElement = (
  node: TSESTree.JSXOpeningElement,
  parserServices: ParserServicesWithTypeInformation,
) => {
  const config = getTamaguiConfig();
  const typeChecker = parserServices.program.getTypeChecker();
  const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node.name);
  const symbol = typeChecker.getSymbolAtLocation(tsNode);

  // string tag
  if (symbol == null) {
    return false;
  }

  const specifier = getModuleSpecifierOfImportSpecifier(symbol);

  if (!specifier) {
    return false;
  }

  return config.moduleNames.includes(specifier);
};
