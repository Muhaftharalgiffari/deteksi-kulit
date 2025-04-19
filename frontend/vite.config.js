import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        port: 3000,
        proxy: {
            '/predict': {
                target: 'http://localhost:5000',
                changeOrigin: true,
            }
        }
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        emptyOutDir: true,
    }
}) 