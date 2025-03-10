export default [
  {
    ignores: ["node_modules", "dist"], // Voorkomt dat ESLint deze mappen checkt
  },
  {
    files: ["**/*.js"], // Controleert alle JS-bestanden
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
      "indent": ["error", 2],
      "quotes": ["error", "double"],
      "semi": ["error", "always"]
    }
  }
];
  