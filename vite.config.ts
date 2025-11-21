// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "src"),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "CheckBoard",
      fileName: (format) => `check-board.${format}.js`,
      formats: ["es", "cjs", "umd"],
    },
    rollupOptions: {
      // tudo que você NÃO quer embutido no bundle
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
    sourcemap: true,
    minify: "esbuild",
  },
});
