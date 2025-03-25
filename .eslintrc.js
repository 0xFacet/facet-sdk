module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "airbnb", // Airbnb's base config
    "airbnb/hooks", // React hooks config
    "plugin:@typescript-eslint/recommended", // TypeScript-specific rules
    "plugin:prettier/recommended", // Enables eslint-plugin-prettier and displays Prettier errors as ESLint errors
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  plugins: [
    "react",
    "react-hooks",
    "@typescript-eslint",
    "prettier",
    "simple-import-sort",
    "unicorn",
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    "prettier/prettier": "error", // Ensure Prettier code style
    "simple-import-sort/imports": "error", // Auto-sort imports
    "simple-import-sort/exports": "error", // Auto-sort exports
    "unicorn/prefer-node-protocol": "off", // Allow paths without "node:" prefix
    "react/jsx-filename-extension": [1, { extensions: [".tsx"] }], // Allow .tsx for JSX
    "react/react-in-jsx-scope": "off", // Not needed with Next.js
    "import/extensions": "off", // Ignore extensions for TypeScript imports
    "import/no-extraneous-dependencies": ["error", { devDependencies: true }], // Allow dev dependencies in config files
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }], // Warn for unused variables but ignore those starting with _
    "no-console": "warn", // Warn about console.logs, use error to disallow
    "import/prefer-default-export": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "no-use-before-define": "off",
    "no-shadow": "off",
  },
  settings: {
    react: {
      version: "detect",
    },
    "import/resolver": {
      alias: {
        map: [
          ["@", "./src"], // Map `@` to `./src`
        ],
        extensions: [".ts", ".tsx", ".js", ".jsx"], // Specify supported extensions
      },
    },
  },
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      rules: {
        "no-undef": "off", // Turn off no-undef for TypeScript files
      },
    },
  ],
};
