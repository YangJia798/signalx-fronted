import { baseApi } from '../helper'

export type THyperOrderCancelPrams = {
  wallet_id: string
  coin: string
  oid: number  // int64
}

export type THyperOrderCancelRes = {
  result: any
}

export type THyperOrderCancel = {
  /** 取消 TPSL 止盈止损订单 */
  hyperOrderCancel: (params: THyperOrderCancelPrams) => Promise<THyperOrderCancelRes>
  hyperOrderCancelBusy: boolean
  /** 取消普通挂单（限价单等） */
  hyperOrderCancelNormal: (params: THyperOrderCancelPrams) => Promise<THyperOrderCancelRes>
  hyperOrderCancelNormalBusy: boolean
}

const cancelRequest = async (url: string, params: THyperOrderCancelPrams): Promise<THyperOrderCancelRes> => {
  const payload = { ...params, oid: Number(params.oid) }
  const res = await baseApi.post(url, payload)
  if (String(res.data.code) !== '0' && String(res.data.code) !== '200') {
    throw new Error(res.data.msg || '取消失败')
  }
  return res.data as THyperOrderCancelRes
}

export const hyperOrderCancel: THyperOrderCancel = {
  /** 取消止盈/止损订单 */
  async hyperOrderCancel(params) {
    if (this.hyperOrderCancelBusy) return { result: null }
    this.hyperOrderCancelBusy = true
    try {
      return await cancelRequest('/wallet/hyperliquid/order/tpsl/cancel', params)
    } finally {
      this.hyperOrderCancelBusy = false
    }
  },
  hyperOrderCancelBusy: false,

  /** 取消普通挂单 */
  async hyperOrderCancelNormal(params) {
    if (this.hyperOrderCancelNormalBusy) return { result: null }
    this.hyperOrderCancelNormalBusy = true
    try {
      return await cancelRequest('/wallet/hyperliquid/order/cancel', params)
    } finally {
      this.hyperOrderCancelNormalBusy = false
    }
  },
  hyperOrderCancelNormalBusy: false,
}

