import { baseApi } from '../helper'

export type TAsterOrderLimitSellPrams = {
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

export type TAsterOrderLimitSellRes = {
  result: any
}

export type TAsterOrderLimitSell = {
  asterOrderLimitSell: (params: TAsterOrderLimitSellPrams) => Promise<TAsterOrderLimitSellRes>
}

export const asterOrderLimitSell: TAsterOrderLimitSell = {
  async asterOrderLimitSell(params) {
    const res = await baseApi.post('/wallet/aster/order/limit/sell', params)
    if (String(res.data.code) !== '0' && String(res.data.code) !== '200') {
      throw new Error(res.data.msg || '请求失败')
    }
    return res.data as TAsterOrderLimitSellRes
  }
}
