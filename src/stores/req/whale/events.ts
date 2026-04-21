import BN from 'bignumber.js'

import { merge } from '@/utils'
import { officialHyperbotApi } from '@/stores/req/helper'
import { constants, TAccountStore, TWhaleEventsStore } from '@/stores'

import { formatUPnlStatus, formatStatusClassName } from '../utils'

type WhaleEventsResult = {
  data: Record<string, any>,
  error: boolean
}

export type TWhaleEvents = {
  whaleEvents: (accountStore: TAccountStore, whaleEventsStore: TWhaleEventsStore) => Promise<WhaleEventsResult>
  whaleEventsBusy: boolean
}

export const whaleEvents: TWhaleEvents = {
  async whaleEvents(_accountStore, whaleEventsStore) {
    const result: WhaleEventsResult = { data: {}, error: true }

    if (this.whaleEventsBusy) return result
    this.whaleEventsBusy = true

    try {
      const res = await officialHyperbotApi.get('/whales/latest-events', {
        params: { take: whaleEventsStore.pageSize },
      })

      if (res.data?.code !== 0) throw new Error(res.data?.msg)

      const rows = res.data.data || []
      result.data = {
        list: rows.map((item: any, idx: number) => {
          const bnSize = new BN(item.positionSize ?? 0)
          const action = item.positionAction
          const bnPnl = new BN(0)
          return {
            id: item.id ?? idx,
            coin: item.symbol,
            address: item.user,
            liquidationPrice: new BN(item.liqPrice ?? 0).toString(),
            type: item.marginMode,
            action,
            direction: bnSize.gt(0) ? 'long' : 'short',
            isPositionOpened: action === 1,
            isPositionClosed: action === 2,
            size: bnSize.toString(),
            positionValue: new BN(item.positionValueUsd ?? 0).toFixed(constants.decimalPlaces.__COMMON__),
            openPrice: new BN(item.entryPrice ?? 0).toString(),
            uPnlStatus: formatUPnlStatus(bnPnl),
            uPnlStatusClassName: formatStatusClassName(formatUPnlStatus(bnPnl)),
            createTs: typeof item.createTime === 'string'
              ? new Date(item.createTime + (item.createTime.endsWith('Z') ? '' : 'Z')).getTime()
              : item.createTime,
          }
        }),
      }
      result.error = false
      merge(whaleEventsStore, result.data)
    } catch {
      result.error = true
    } finally {
      this.whaleEventsBusy = false
    }

    return result
  },
  whaleEventsBusy: false,
}
