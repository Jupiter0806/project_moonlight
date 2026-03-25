import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
// todo
// issue with this plugin: it complains "Cannot resolve default tailwindcss config path. Please manually set the config option."
// not sure it's because of beta version of eslint-plugin-tailwindcss or something else. will investigate later.
// but it seems to work fine if we just ignore the error, so let's do that for now.
import tailwind from "eslint-plugin-tailwindcss";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...tailwind.configs["flat/recommended"],
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
