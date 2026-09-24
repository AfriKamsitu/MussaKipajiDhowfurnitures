import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      // This application intentionally hydrates browser storage and fetches
      // remote data after mount. The rule treats those valid synchronization
      // effects as errors; hook ordering and dependency rules remain enabled.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([
    ".next/**",
    ".pnpm-store/**",
    "backend/**",
    "out/**",
    "build/**",
    "public/**",
    "next-env.d.ts",
  ]),
])
