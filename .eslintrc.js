// For client side
module.exports = {
    parser: 'babel-eslint',
    parserOptions: {
        ecmaVersion: 7,
        sourceType: 'module',
    },
    extends: "eslint:recommended",
    rules: {
        "no-console": "off",
        "no-unused-vars": 0,
        "no-constant-condition": 0,
        "semi": ["error", "always"],
    },
    env: {
        "browser": true,
        "jquery": true,
        "node": true,
        "es6": true,
    },
    globals: {
        MathJax: true,
        Chart: true,
    },
}
