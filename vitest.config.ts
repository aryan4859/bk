import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    setupFiles: ["tests/helpers/setup.ts"],
    environment: "node",
    // integration tests share one database, so run files one at a time
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
