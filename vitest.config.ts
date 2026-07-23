import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}", "shared/**/*.{ts,tsx}", "supabase/functions/game-api/**/*.{ts,tsx}"],
      exclude: ["**/*.d.ts", "src/assets/**", "src/main.tsx", "src/vite-env.d.ts", "tests/**"],
      all: true,
      clean: true,
    },
  },
});
