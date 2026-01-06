import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'

function replacePathsPlugin() {
    return {
        name: 'replace-paths',
        generateBundle(options, bundle) {
            Object.keys(bundle).forEach(fileName => {
                const file = bundle[fileName]
                if (file.type === 'asset' && fileName.endsWith('.json')) {
                    file.source = String(file.source).replace(/\/game\//g, './game/')
                }

                if (file.type === 'chunk' && file.code) {
                    file.code = file.code.replace(/["']\/game\//g, (match) => {
                        return match.replace('/game/', './game/')
                    })
                }
            })
        }
    }
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        svelte(),
        replacePathsPlugin(),
        VitePWA({
            registerType: 'autoUpdate',
            devOptions: {
                enabled: true
            },
            includeAssets: ['pwa-192x192.png', 'pwa-512x512.png'],
            manifest: {
                name: 'School Journey Game',
                short_name: 'SchoolJourney',
                description: 'A fun journey to school for kids',
                theme_color: '#ffffff',
                background_color: '#ffffff',
                display: 'standalone',
                orientation: 'landscape',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        })
    ],
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        minify: 'esbuild',
        rollupOptions: {
            output: {
                entryFileNames: 'assets/[name].[hash].js',
                chunkFileNames: 'assets/[name].[hash].js',
                assetFileNames: 'assets/[name].[hash].[ext]'
            }
        }
    },
    base: './'
})