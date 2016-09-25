// For client side
module.exports = {
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
    }
}
