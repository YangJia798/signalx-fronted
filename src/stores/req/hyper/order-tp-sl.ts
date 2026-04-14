import { baseApi } from '../helper'

export type THyperOrderTpSlPrams = {
  wallet_id: string
  coin: string
  sz: number
  tp_price: number
  sl_price: number
}

export type THyperOrderTpSlRes = {
  result: any
}

export type THyperOrderTpSl = {
  hyperOrderTpSl: (params: THyperOrderTpSlPrams) => Promise<THyperOrderTpSlRes>
}

export const hyperOrderTpSl: THyperOrderTpSl = {
  async hyperOrderTpSl(params) {
    const res = await baseApi.post('/wallet/hyperliquid/order/tpsl', params)
    if (String(res.data.code) !== '0' && String(res.data.code) !== '200') {
      throw new Error(res.data.msg || '设置失败')
    }
    return res.data as THyperOrderTpSlRes
  }
}
