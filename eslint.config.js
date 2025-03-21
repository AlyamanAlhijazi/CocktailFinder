export default [
  {
    ignores: ["node_modules", "dist"], // Voorkomt dat ESLint deze mappen checkt
  },
  {
    files: ["**/*.js"], // Controleert alle JS-bestanden
    languageOptions: {
      ecmaVersion: "latest", //Ondersteunt de nieuwste JavaScript-functionaliteiten.
      sourceType: "module", //Geeft aan dat je ES6-modules (import/export) gebruikt
    },
    rules: {
      "no-unused-vars": "warn", //Geeft een waarschuwing als je variabelen declareert die je niet gebruikt.
      "no-console": "off", //Schakelt de regel uit die console.log() verbiedt.
      "indent": ["error", 2], //Vereist een inspringing van 2 spaties per niveau.
      "quotes": ["error", "double"], //Forceert dubbele aanhalingstekens ("hello" i.p.v. 'hello').
      "semi": ["error", "always"], //Vereist puntkomma's (;).
      "curly": ["error"], //Verplicht {} bij if, else, for, while, etc.
      "no-var": ["error"], //Verbiedt var, dwingt gebruik van let of const.
      "prefer-const":["error"], //Dwingt const af als een variabele niet opnieuw wordt toegewezen.
      "comma-dangle": ["error", "always-multiline"], //Verplicht een trailing comma in objecten en arrays.
      "object-curly-spacing": ["error", "always"], //Verplicht spaties binnen {} bij objecten.
      "no-unused-vars": ["warn"], //Geeft een waarschuwing als een variabele is gedeclareerd maar niet gebruikt wordt.
      "no-redeclare": ["error"], //Voorkomt dat je per ongeluk een variabele twee keer declareert.
      "no-undef": ["error"], //Voorkomt gebruik van niet-gedefinieerde variabelen.
    },
  },
];
