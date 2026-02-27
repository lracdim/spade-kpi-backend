import { defineConfig } from 'vite';
import { VitePluginNode } from 'vite-plugin-node';

export default defineConfig({
    server: {
        port: 5000,
    },
    plugins: [
        ...VitePluginNode({
            adapter: 'express',
            appPath: './src/index.ts',
            exportName: 'viteNodeApp',
            tsCompiler: 'esbuild',
        }),
    ],
    optimizeDeps: {
        // Vite does not work well with all node packages, especially those that
        // are libraries and not modules.
        // exclude: ['pg-native'],
    },
});
