// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      "no-restricted-imports": ["error", {
        "paths": [
          {
            "name": "heroui-native",
            "message": "Please use granular component imports to keep Metro fast."
          }
        ]
      }]
    }
  }
]);
