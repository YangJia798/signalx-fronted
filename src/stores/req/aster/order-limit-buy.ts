import { baseApi } from '../helper'

export type TAsterOrderLimitBuyPrams = {
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

export type TAsterOrderLimitBuyRes = {
  result: any
}

export type TAsterOrderLimitBuy = {
  asterOrderLimitBuy: (params: TAsterOrderLimitBuyPrams) => Promise<TAsterOrderLimitBuyRes>
}

export const asterOrderLimitBuy: TAsterOrderLimitBuy = {
  async asterOrderLimitBuy(params) {
    const res = await baseApi.post('/wallet/aster/order/limit/buy', params)
    if (String(res.data.code) !== '0' && String(res.data.code) !== '200') {
      throw new Error(res.data.msg || '请求失败')
    }
    return res.data as TAsterOrderLimitBuyRes
  }
}
