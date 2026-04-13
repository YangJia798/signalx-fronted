import { baseApi } from '../helper'

export type THyperOrderLimitSellPrams = {
  wallet_id: string
  coin: string
  sz?: number
  usd_sz?: number
  limit_px?: number
  order_type: string
  leverage: number
  margin_mode: string
  reduce_only: boolean
  tp_px?: number
  sl_px?: number
}

export type THyperOrderLimitSellRes = {
  result: any
}

export type THyperOrderLimitSell = {
  hyperOrderLimitSell: (params: THyperOrderLimitSellPrams) => Promise<THyperOrderLimitSellRes>
}

export const hyperOrderLimitSell: THyperOrderLimitSell = {
  async hyperOrderLimitSell(params) {
    const res = await baseApi.post('/wallet/hyperliquid/order/limit/sell', params)
    if (String(res.data.code) !== '0' && String(res.data.code) !== '200') {
      throw new Error(res.data.msg || '请求失败')
    }
    return res.data as THyperOrderLimitSellRes
  }
}
