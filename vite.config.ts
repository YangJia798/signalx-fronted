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
export default defineConfig(async ({ mode, command }) => {
  const env = loadEnv(mode, process.cwd())
  const enableDevHttps = command === 'serve' && env.VITE_DEV_HTTPS === 'true'
  const plugins = [
    nodePolyfills({ include: ['buffer', 'process', 'util', 'stream', 'events'] }),
    react(),
    svgr(),
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
  ]

  if (command === 'build') {
    try {
      const { default: viteCompression } = await import('vite-plugin-compression')
      plugins.push(
        viteCompression({ algorithm: 'gzip', ext: '.gz' }),
        viteCompression({ algorithm: 'brotliCompress', ext: '.br' })
      )
    } catch {
      console.warn('[vite] vite-plugin-compression is not installed, skipping compressed asset generation.')
    }
  }

  if (enableDevHttps) {
    plugins.splice(3, 0, mkcert({ source: 'coding' }))
  }

  return {
    server: {
      host: '0.0.0.0',
      port: 4173,
      strictPort: false,
      proxy: {
        '/api': {
          target: 'http://43.106.1.190:8001',
          changeOrigin: true
        },
        '/aster-kline': {
          target: 'https://fapi.asterdex.com',
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/aster-kline/, '')
        },
        '/aster-ws': {
          target: 'wss://fstream.asterdex.com',
          ws: true,
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/aster-ws/, '/ws')
        },
        '/hyperbot-proxy': {
          target: 'https://hyperbot.network',
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/hyperbot-proxy/, '')
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
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.', 'src')
      }
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        plugins: [
          {
            // Some wagmi connector modules store their connector type on a static
            // function property (for example `metaMask.type = 'metaMask'` and
            // then `type: metaMask.type`). Bundlers can reorder or erase those
            // function-property writes, which breaks production bundles.
            // Fix: inline the connector type string and strip the static writes.
            name: 'fix-wagmi-connector-types',
            transform(code: string, id: string) {
              if (!id.includes('@wagmi')) return null

              const connectorTypes: Array<[string, string]> = [
                ['injected', 'injected'],
                ['metaMask', 'metaMask'],
                ['coinbaseWallet', 'coinbaseWallet'],
                ['safe', 'safe'],
                ['walletConnect', 'walletConnect'],
              ]

              let patched = code
              for (const [symbol, type] of connectorTypes) {
                patched = patched.replace(
                  new RegExp(`\\b${symbol}\\.type\\s*=\\s*['"]${type}['"](?:\\s+as const)?;?\\r?\\n?`, 'g'),
                  '',
                )
                patched = patched.replace(
                  new RegExp(`type:\\s*${symbol}\\.type\\b`, 'g'),
                  `type: '${type}'`,
                )
              }

              return patched === code ? null : patched
            }
          }
        ],
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-antd': ['antd', '@ant-design/cssinjs'],
            'vendor-mui': ['@mui/material', '@mui/x-charts', '@emotion/react', '@emotion/styled'],
            'vendor-web3': ['wagmi', 'viem', '@rainbow-me/rainbowkit', '@okxconnect/ui'],
            'vendor-query': ['@tanstack/react-query'],
            'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
            'vendor-charts': ['lightweight-charts'],
            'vendor-utils': ['bignumber.js', 'dayjs', 'axios'],
          }
        }
      }
    },
    esbuild: {
      keepNames: true,
    },
    optimizeDeps: {
      include: [
        'wagmi', 'viem', '@rainbow-me/rainbowkit',
        'react', 'react-dom', 'react-router-dom',
        '@tanstack/react-query',
      ],
    }
  }
})
