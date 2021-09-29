// eslint-disable-next-line @typescript-eslint/no-var-requires
const { resolve } = require('path');

module.exports = {
  configBaseDir: resolve(__dirname, 'node_modules'),
  plugins: ['stylelint-prettier'],
  extends: ['stylelint-config-standard', 'stylelint-config-recess-order', 'stylelint-prettier/recommended', 'stylelint-config-prettier'],
  rules: {
    'at-rule-no-unknown': [true, { ignoreAtRules: ['include', 'mixin', 'each'] }],
    'prettier/prettier': [true, { endOfLine: 'auto' }],
  },
  ignoreFiles: ['**/node_modules/**'],
};
