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
        "semi": ["error", "always"],
    },
    env: {
        "browser": true,
        "jquery": true,
    }
}
