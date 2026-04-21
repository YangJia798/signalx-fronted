import { message } from 'antd'
import axios from 'axios'

import { constants } from '@/stores'
import { localStorage } from '@/utils'

const baseCheck = (res: { data: any }, accountStore) => {
  const codes: Record<string, { message: string, func: () => void }> = {
    '-2': { message: 'Please log in again', func: () => accountStore.reset() },
  }

  const code = String(res.data.code)
  const error = code !== '0'

  if (error) {
    const errorMsg = codes[code]?.message || res?.data?.msg || '请求失败或发生错误';
    message.error(errorMsg);
    codes[code]?.func && codes[code]?.func();
  }
  return error
}

const baseURL = constants.app.API_BASE
const OFFICIAL_HYPERBOT_API_URL = import.meta.env.VITE_OFFICIAL_HYPERBOT_API_URL || 'https://hyperbot.network/api'

const baseApi = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
})

// 拦截器
baseApi.interceptors.request.use(
  (config) => {
    const session = localStorage.get(constants.storageKey.SESSION)

    if (session) {
      config.headers['Authorization'] = `Bearer ${session}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

const hyperApi = axios.create({
  baseURL: import.meta.env.VITE_HL_API_URL || 'https://api.hyperliquid.xyz',
  headers: {
    'Content-Type': 'application/json'
  },
})

const asterApi = axios.create({
  baseURL: import.meta.env.VITE_ASTER_API_PATH || 'https://fapi.asterdex.com',
  headers: {
    'Content-Type': 'application/json'
  },
})

const hyperStatsApi = axios.create({
  baseURL: import.meta.env.VITE_HL_STATS_URL || 'https://stats-data.hyperliquid.xyz',
  headers: {
    'Content-Type': 'application/json'
  },
})

const hyperbotApi = axios.create({
  baseURL: import.meta.env.VITE_HYPERBOT_API_URL || OFFICIAL_HYPERBOT_API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
})

const officialHyperbotApi = axios.create({
  baseURL: OFFICIAL_HYPERBOT_API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
})

export {
  baseCheck,
  baseURL,
  baseApi,
  hyperApi,
  asterApi,
  hyperStatsApi,
  hyperbotApi,
  officialHyperbotApi
}


