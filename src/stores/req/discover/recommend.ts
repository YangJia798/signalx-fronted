import BN from 'bignumber.js'

import { merge, formatPer } from '@/utils'
import { hyperStatsApi } from '@/stores/req/helper'
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
  async discoverRecommend(accountStore, discoverRecommendStore) {
    const result: DiscoverRecommendResult = { data: {}, error: true }

    if (this.discoverRecommendBusy) return result

    this.discoverRecommendBusy = true

    try {
      const res = await hyperStatsApi.get('/Mainnet/leaderboard', {
        params: { window: 'week' }
      })

      const rows: any[] = res.data?.leaderboardRows || []

      const list = rows
        .map((item: any) => {
          const weekEntry = (item.windowPerformances || []).find(([w]: [string]) => w === 'week')
          const weekPnl = weekEntry ? new BN(weekEntry[1]?.pnl || 0) : new BN(0)
          const weekRoi = weekEntry ? parseFloat(weekEntry[1]?.roi || '0') : 0

          return {
            address: item.ethAddress,
            perpValue: new BN(item.accountValue || 0).toFixed(constants.decimalPlaces.__COMMON__),
            spotValue: '0',
            winRate: formatPer(weekRoi),
            accountTotalValue: new BN(item.accountValue || 0).toFixed(constants.decimalPlaces.__COMMON__),
            marginUsed: '0',
            marginUsedRatio: '0%',
            note: item.displayName || '',
            pnl: weekPnl.toFixed(constants.decimalPlaces.__uPnl__),
            tags: [],
            tradesCount: 0,
            lastActionTs: '',
            _weekPnl: weekPnl.toNumber(),
          }
        })
        .sort((a, b) => b._weekPnl - a._weekPnl)
        .slice(0, 100)
        .map(({ _weekPnl, ...rest }) => rest)

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