module.exports = {
  root: true,
  ignorePatterns: ["node_modules/", "dist/", "out/", "build/"],
  overrides: [
    {
      files: ["apps/api/**/*.ts"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: ["./apps/api/tsconfig.json"],
        tsconfigRootDir: __dirname,
      },
      plugins: ["@typescript-eslint", "import"],
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:import/recommended",
        "plugin:import/typescript",
        "prettier",
      ],
      settings: {
        "import/resolver": {
          node: {
            extensions: [".js", ".ts"],
          },
          typescript: {
            project: "./apps/api/tsconfig.json",
          },
        },
      },
      rules: {
        "@typescript-eslint/no-misused-promises": [
          "error",
          {
            checksVoidReturn: {
              arguments: false,
            },
          },
        ],
        "@typescript-eslint/no-explicit-any": "off",
      },
    },
    {
      files: ["apps/jira-plus-plus/src/**/*.{ts,tsx}"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint", "react", "react-hooks"],
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:react/recommended",
        "plugin:react-hooks/recommended",
        "prettier",
      ],
      settings: {
        react: {
          version: "detect",
        },
      },
      rules: {
        "react/react-in-jsx-scope": "off",
        "react/jsx-uses-react": "off",
      },
    },
  ],
};
