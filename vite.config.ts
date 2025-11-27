import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [react()],
	server: {
		port: 3000,
	},
	build: {
		outDir: "dist",
	},
	resolve: {
		alias: {
			"@": "/src",
		},
	},
	optimizeDeps: {
		include: ["browserfs"],
		esbuildOptions: {
			// BrowserFS uses Node.js globals that need to be defined
			define: {
				global: "globalThis",
			},
		},
	},
});
