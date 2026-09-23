import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...coreWebVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "node_modules/**", "scripts/**", "next-env.d.ts", "tsconfig.tsbuildinfo"],
  },
];

export default eslintConfig;
