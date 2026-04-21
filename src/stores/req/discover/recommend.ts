import BN from 'bignumber.js'

import { merge, formatPer } from '@/utils'
import { officialHyperbotApi, hyperApi } from '@/stores/req/helper'
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
        officialHyperbotApi.get('/leaderboard/address/top-pnl', { params: { window: 'week', take: 15 } }),
        officialHyperbotApi.get('/leaderboard/address/top-roi', { params: { window: 'week', take: 15 } }),
        officialHyperbotApi.get('/leaderboard/address/top-vlm', { params: { window: 'week', take: 15 } }),
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

      // Prioritize active positions first, then higher ROI.
      const sorted = combined
        .map((item, i) => ({ item, positions: positionCounts[i] }))
        .sort((a, b) => {
          const activeDiff = Number(b.positions > 0) - Number(a.positions > 0)
          if (activeDiff !== 0) return activeDiff

          const roiDiff = parseFloat(String(b.item.roi || 0)) - parseFloat(String(a.item.roi || 0))
          if (roiDiff !== 0) return roiDiff

          return b.positions - a.positions
        })
        .slice(0, 12)

      // Fetch portfolio stats for visible 12
      const portfolioStats = await Promise.all(
        sorted.map(({ item }) =>
          hyperApi.post('/info', { type: 'portfolio', user: item.ethAddress })
            .then(res => {
              const data: any[] = res.data || []
              const weekEntry = data.find((d: any) => d[0] === 'week')
              if (!weekEntry) return { pnlList: [] as any[], sharpe: '0.00', maxDrawdown: '0.00' }
              const { accountValueHistory = [], pnlHistory = [] } = weekEntry[1]
              const pnlList = pnlHistory.map((d: any) => ({ time: Math.floor(d[0] / 1000), value: parseFloat(d[1]) }))
              const values: number[] = accountValueHistory.map((d: any) => parseFloat(d[1]))
              const returns: number[] = []
              for (let i = 1; i < values.length; i++) {
                if (values[i - 1] > 0) returns.push((values[i] - values[i - 1]) / values[i - 1])
              }
              let sharpe = '0.00'
              if (returns.length > 1) {
                const mean = returns.reduce((s, r) => s + r, 0) / returns.length
                const std = Math.sqrt(returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length)
                if (std > 0) sharpe = (mean / std * Math.sqrt(252)).toFixed(2)
              }
              let maxDD = 0, peak = values[0] || 0
              for (const v of values) {
                if (v > peak) peak = v
                if (peak > 0) { const dd = (peak - v) / peak; if (dd > maxDD) maxDD = dd }
              }
              return { pnlList, sharpe, maxDrawdown: (maxDD * 100).toFixed(2) }
            })
            .catch(() => ({ pnlList: [] as any[], sharpe: '0.00', maxDrawdown: '0.00' }))
        )
      )

      const list = sorted.map(({ item, positions }, i) => {
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
          pnlList: portfolioStats[i].pnlList,
          sharpe: portfolioStats[i].sharpe,
          maxDrawdown: portfolioStats[i].maxDrawdown,
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
