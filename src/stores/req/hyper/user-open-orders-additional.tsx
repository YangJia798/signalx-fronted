import BN from 'bignumber.js'

import { merge, defaults, getDecimalLength } from '@/utils'
import { baseCheck, hyperApi } from '@/stores/req/helper'
import { constants, TAccountStore, TLeaderboardStore, formatSideByRaw } from '@/stores'

import { formatUPnlStatus, formatStatusClassName } from '../utils'

type THyperUserOpenOrdersAdditionalResult = {
  data: Record<string, any>,
  error: boolean
}
 
export type THyperUserOpenOrdersAdditional = {
  /**
   * 正在挂的单
   */
  hyperUserOpenOrdersAdditional: (address: string) => Promise<THyperUserOpenOrdersAdditionalResult>
  hyperUserOpenOrdersAdditionalBusy: boolean
  hyperUserOpenOrdersAdditionalInit: boolean
}


export const hyperUserOpenOrdersAdditional: THyperUserOpenOrdersAdditional = {
  async hyperUserOpenOrdersAdditional(address) {
    const result: THyperUserOpenOrdersAdditionalResult = { data: { list: [] }, error: true }

    if (this.hyperUserOpenOrdersAdditionalBusy || !address) return result

    this.hyperUserOpenOrdersAdditionalBusy = true

    try {
      const res = await hyperApi.post('/info', {
        'type': 'frontendOpenOrders',
        'user': address,
      })

      this.hyperUserOpenOrdersAdditionalInit = false
      result.error = false

      // update
      const data = res.data

      result.data = {
        list: data.map((item: any, idx: number) => {
          return {
            idx,
            orderId: item.oid,
            side: formatSideByRaw(item.side),
            coin: item.coin,
            size: item.sz,
            isTrigger: item.isTrigger,
            triggerPrice: item.triggerPx,
            isTPSL: item.isPositionTpsl,
            createTs: item.timestamp,
            limitPrice: item.limitPx,
            orderType: (item.orderType || '').toLowerCase(),
            reduceOnly: item.reduceOnly,
            value: Number(item.limitPx || 0) * Number(item.sz || 0),
          }
        })
      }
    } catch (e) {
      console.error('[hyperUserOpenOrdersAdditional] error:', e)
    } finally {
      // 无论成功还是失败，都要重置 busy 标志，防止永久锁住
      this.hyperUserOpenOrdersAdditionalBusy = false
    }

    return result
  },
  hyperUserOpenOrdersAdditionalBusy: false,
  hyperUserOpenOrdersAdditionalInit: true,
}