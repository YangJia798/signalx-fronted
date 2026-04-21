import BN from 'bignumber.js'

import { merge, formatPer } from '@/utils'
import { hyperbotApi, hyperApi } from '@/stores/req/helper'
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
      // Fetch a larger pool (30) so we can filter by active positions
      const [pnlRes, roiRes, vlmRes] = await Promise.all([
        hyperbotApi.get('/leaderboard/address/top-pnl', { params: { window: 'week', take: 15 } }),
        hyperbotApi.get('/leaderboard/address/top-roi', { params: { window: 'week', take: 15 } }),
        hyperbotApi.get('/leaderboard/address/top-vlm', { params: { window: 'week', take: 15 } }),
      ])

      const seen = new Set<string>()
      const combined: any[] = []
      for (const item of [...(pnlRes.data?.data || []), ...(roiRes.data?.data || []), ...(vlmRes.data?.data || [])]) {
        if (!seen.has(item.ethAddress)) {
          seen.add(item.ethAddress)
          combined.push(item)
        }
      }

      // Parallel position count for all candidates
      const positionCounts = await Promise.all(
        combined.map(item =>
          hyperApi.post('/info', { type: 'clearinghouseState', user: item.ethAddress })
            .then(r => {
              const positions: any[] = r.data?.assetPositions || []
              return positions.filter(p => parseFloat(p.position?.szi || '0') !== 0).length
            })
            .catch(() => 0)
        )
      )

      // Sort by position count descending, then take top 12
      const sorted = combined
        .map((item, i) => ({ item, positions: positionCounts[i] }))
        .sort((a, b) => b.positions - a.positions)
        .slice(0, 12)

      const list = sorted.map(({ item, positions }) => {
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
          totalPositions: positions,
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
