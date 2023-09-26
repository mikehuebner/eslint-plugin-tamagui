import { propsOrderRule } from './rules/props-order';
import { propsPreferShorthandRule } from './rules/props-prefer-shorthand';
// import { requireSpecificComponentRule } from "./rules/require-specific-component";

export default {
  rules: {
    'props-order': propsOrderRule,
    'props-prefer-shorthand': propsPreferShorthandRule,
    // "require-specific-component": requireSpecificComponentRule,
  },
};
