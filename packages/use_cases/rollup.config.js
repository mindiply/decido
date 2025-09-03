import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import * as path from "node:path";
export default {
  input: "src/index.ts", // Entry point of your library
  rootDir: "./src",
  output: [
    {
      file: "dist/index.cjs", // CommonJS output
      format: "cjs",
      sourcemap: true,
    },
    {
      file: "dist/index.mjs", // ES Module output
      format: "esm",
      sourcemap: true,
    },
  ],
  plugins: [
    nodeResolve({
      // moduleDirectories: ['node_modules', '../../node_modules']
      rootDir: path.join(process.cwd(), "../.."),
      mainFields: ["node", "browser"],
    }), // Resolves node modules
    // resolve(), // Resolves external modules
    commonjs(), // Converts CJS dependencies to ESM
    typescript({
      tsconfig: "./tsconfig.build.json", // Uses your tsconfig
      declaration: true, // Generates .d.ts type definitions
      declarationDir: "dist/types",
      exclude: ["./test/**"],
    }),
  ],
  external: [], // Mark dependencies here if you don't want them bundled
};
