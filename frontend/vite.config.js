import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        port: 5000,
        strictPort: true,
        allowedHosts: true, // Allow all hosts for Replit environment
        hmr: {
            clientPort: 5000,
        },
    },
    preview: {
        host: '0.0.0.0',
        port: 5000,
        strictPort: true,
    },
})
