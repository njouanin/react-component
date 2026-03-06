import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
      "login/index": "src/login/index.ts",
      "login/next": "src/login/next.tsx",
    },
    format: ["esm", "cjs"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: ["react", "react-dom", "@ldo/solid-react", "next/navigation"],
    esbuildOptions(options) {
      options.banner = { js: '"use client";' };
    },
  },
]);
