import { TSESTree, ParserServicesWithTypeInformation } from '@typescript-eslint/utils';
import { Declaration, Expression, ImportDeclaration, Symbol, SyntaxKind } from 'typescript';

import tamaguiConfig from './get-tamagui-config';

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
 * This tests if the given node is a call to `styled` imported from the Tamagui module library.
 */
export const isTamaguiStyled = (
  node: TSESTree.CallExpression,
  parserServices: ParserServicesWithTypeInformation,
): boolean => {
  if (!node.callee || node.callee.type !== 'Identifier' || node.callee.name !== 'styled') {
    return false;
  }

  const typeChecker = parserServices.program.getTypeChecker();
  const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node.callee);
  const symbol = typeChecker.getSymbolAtLocation(tsNode);

  // No symbol for callee
  if (!symbol) {
    return false;
  }

  const specifier = getModuleSpecifierOfImportSpecifier(symbol);

  if (!specifier) {
    return false;
  }

  return tamaguiConfig.moduleNames.includes(specifier);
};
