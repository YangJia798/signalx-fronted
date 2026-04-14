import { baseApi } from '../helper'

export type THyperOrderLimitBuyPrams = {
  wallet_id: string
  coin: string
  sz?: number
  usd_sz?: number
  limit_px?: number
  order_type: string
  leverage: number
  margin_mode: string
  reduce_only: boolean
  tp_price?: number
  sl_price?: number
}

export type THyperOrderLimitBuyRes = {
  result: any
}

export type THyperOrderLimitBuy = {
  hyperOrderLimitBuy: (params: THyperOrderLimitBuyPrams) => Promise<THyperOrderLimitBuyRes>
}

export const hyperOrderLimitBuy: THyperOrderLimitBuy = {
  async hyperOrderLimitBuy(params) {
    const res = await baseApi.post('/wallet/hyperliquid/order/limit/buy', params)
    if (String(res.data.code) !== '0' && String(res.data.code) !== '200') {
      throw new Error(res.data.msg || '请求失败')
    }
    return res.data as THyperOrderLimitBuyRes
  }
}
