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
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Web3 库各自独立 chunk，避免合并导致循环依赖初始化顺序错乱
            if (id.includes('node_modules/wagmi')) return 'vendor-wagmi'
            if (id.includes('node_modules/viem')) return 'vendor-viem'
            if (id.includes('node_modules/@rainbow-me')) return 'vendor-rainbowkit'
            if (id.includes('node_modules/@okxconnect')) return 'vendor-okx'
            // UI 框架合并安全（无循环依赖）
            if (id.includes('node_modules/antd') || id.includes('node_modules/@ant-design')) return 'vendor-antd'
            if (id.includes('node_modules/@mui') || id.includes('node_modules/@emotion')) return 'vendor-mui'
            // 工具库
            if (id.includes('node_modules/axios') || id.includes('node_modules/bignumber') || id.includes('node_modules/dayjs')) return 'vendor-utils'
            if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) return 'vendor-i18n'
            // React 核心
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) return 'vendor-react'
          }
        }
      }
    },
    optimizeDeps: { exclude: ['node_modules/.cache'] }
  }
})
