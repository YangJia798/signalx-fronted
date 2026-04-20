import BN from 'bignumber.js'

import { merge, formatPer } from '@/utils'
import { hyperbotApi } from '@/stores/req/helper'
import { constants, TAccountStore, TDiscoverRecommendStore } from '@/stores'

type DiscoverRecommendResult = {
  data: Record<string, any>,
  error: boolean
}

export type TDiscoverRecommend = {
  discoverRecommend: (accountStore: TAccountStore, discoverRecommendStore: TDiscoverRecommendStore) => Promise<DiscoverRecommendResult>
  discoverRecommendBusy: boolean
}

export const discoverRecommend: TDiscoverRecommend = {
  async discoverRecommend(_accountStore, discoverRecommendStore) {
    const result: DiscoverRecommendResult = { data: {}, error: true }

    if (this.discoverRecommendBusy) return result
    this.discoverRecommendBusy = true

    try {
      // Parallel fetch top-pnl and top-roi for week, deduplicate, take top 12
      const [pnlRes, roiRes] = await Promise.all([
        hyperbotApi.get('/leaderboard/address/top-pnl', { params: { window: 'week', take: 10 } }),
        hyperbotApi.get('/leaderboard/address/top-roi', { params: { window: 'week', take: 10 } }),
      ])

      const seen = new Set<string>()
      const combined: any[] = []
      for (const item of [...(pnlRes.data?.data || []), ...(roiRes.data?.data || [])]) {
        if (!seen.has(item.ethAddress)) {
          seen.add(item.ethAddress)
          combined.push(item)
        }
      }

      const list = combined.slice(0, 12).map((item: any) => {
        const pnl = new BN(item.pnl || 0)
        const roi = parseFloat(item.roi || 0)
        return {
          address: item.ethAddress,
          perpValue: new BN(item.accountValue || 0).toFixed(constants.decimalPlaces.__COMMON__),
          spotValue: '0',
          winRate: formatPer(roi),
          accountTotalValue: new BN(item.accountValue || 0).toFixed(constants.decimalPlaces.__COMMON__),
          marginUsed: '0',
          marginUsedRatio: '0%',
          note: item.displayName || '',
          pnl: pnl.toFixed(constants.decimalPlaces.__uPnl__),
          tags: [],
          tradesCount: 0,
          lastActionTs: '',
        }
      })

      result.data = { list }
      result.error = false
      merge(discoverRecommendStore, result.data)
    } catch {
      result.error = true
    } finally {
      this.discoverRecommendBusy = false
    }

    return result
  },
  discoverRecommendBusy: false,
}
