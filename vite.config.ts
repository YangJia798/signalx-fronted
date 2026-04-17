import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import path from 'path'
import { createHtmlPlugin } from 'vite-plugin-html'
import { fileURLToPath } from 'url'
import mkcert from "vite-plugin-mkcert"
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import topLevelAwait from "vite-plugin-top-level-await";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    server: {
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://43.106.1.190:8001',
          changeOrigin: true
        }
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler' // or "modern"
        }
      }
    },
    base: env.VITE_PUBLIC_PATH_BASE,
    plugins: [
      nodePolyfills(),
      react(),
      svgr(),
      mkcert({ source: 'coding' }),
      topLevelAwait({
        promiseExportName: "__tla",
        promiseImportName: i => `__tla_${i}`
      }),
      createHtmlPlugin({
        minify: true,
        inject: {
          data: {
            title: env.VITE_DEFAULT_TITLE,
            keywords: env.VITE_KEYWORDS,
            description: env.VITE_DESCRIPTION,
            site_name: env.VITE_SITE_NAME,
            twitter_site: `@${env.VITE_TWITTER_SITE}`,
            twitter_image: env.VITE_TWITTER_IMAGE
          }
        }
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.', 'src')
      }
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-antd': ['antd', '@ant-design/cssinjs'],
            'vendor-mui': ['@mui/material', '@mui/x-charts', '@emotion/react', '@emotion/styled'],
            'vendor-web3': ['wagmi', 'viem', '@rainbow-me/rainbowkit', '@okxconnect/ui'],
            'vendor-query': ['@tanstack/react-query'],
            'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          }
        }
      }
    },
    esbuild: {
      keepNames: true,
    },
    optimizeDeps: { exclude: ['node_modules/.cache'] }
  }
})
