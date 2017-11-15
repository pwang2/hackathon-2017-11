module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module'
  },
  env: { browser: true, mocha: true },
  extends: ['airbnb-base', 'prettier'],
  plugins: ['import', 'prettier'],
  settings: {
    'import/resolver': {
      webpack: {
        config: 'build/webpack.base.conf.js'
      }
    }
  },
  // add your custom rules here
  rules: {
    'prettier/prettier': ['error', { singleQuote: true }],
    'import/no-webpack-loader-syntax': 0,
    'import/extensions': 0,
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: ['**/*']
      }
    ],
    'no-shadow': 0,
    'no-param-reassign': 0,
    'no-plusplus': 0,
    'func-names': 0,
    'no-multiple-empty-lines': 2,
    'no-use-before-define': 0
  }
};
