import BN from 'bignumber.js'

import { merge, formatPer } from '@/utils'
import { hyperbotApi } from '@/stores/req/helper'
import { constants, TAccountStore, TDiscoverTradingStatisticsStore } from '@/stores'

import { formatUPnlStatus, formatStatusClassName } from '../utils'

type DiscoverTradingStatisticsResult = {
  data: Record<string, any>,
  error: boolean
}

export type TDiscoverTradingStatistics = {
  discoverTradingStatistics: (accountStore: TAccountStore, discoverTradingStatisticsStore: TDiscoverTradingStatisticsStore) => Promise<DiscoverTradingStatisticsResult>
  discoverTradingStatisticsBusy: boolean
}

export const discoverTradingStatistics: TDiscoverTradingStatistics = {
  async discoverTradingStatistics(_accountStore, discoverTradingStatisticsStore) {
    const result: DiscoverTradingStatisticsResult = { data: {}, error: true }

    if (this.discoverTradingStatisticsBusy) return result

    this.discoverTradingStatisticsBusy = true

    try {
      const address = discoverTradingStatisticsStore.address
      const period = +discoverTradingStatisticsStore.selectedCycleValue

      const res = await hyperbotApi.get('/leaderboard/smart/detailed-trading-statistics', {
        params: { address, period }
      })

      const i = res.data?.data ?? res.data ?? {}
      const { decimalPlaces } = constants

      const pnl = new BN(i.totalPnl ?? 0)
      const gross = new BN(i.gross ?? 0)
      const fees = new BN(i.fees ?? 0)
      const longPnl = new BN(i.longPnl ?? 0)
      const shortPnl = new BN(i.shortPnl ?? 0)

      const executedTrades = i.total ?? 0
      const profitableTrades = i.winning ?? 0
      const losingTrades = executedTrades - profitableTrades

      const pnlStatus = formatUPnlStatus(pnl)

      const bestTrades = (i.bestTrades || []).map((d: any) => {
        const bnPnl = new BN(d.pnl ?? 0)
        const ps = formatUPnlStatus(bnPnl)
        return {
          coin: d.coin,
          createTs: (d.createAt ?? 0) * 1000,
          direction: d.direction,
          duration: Math.round((d.duration ?? 0) / 1000),
          pnl: bnPnl.toFixed(decimalPlaces.__uPnl__),
          pnlStatus: ps,
          pnlStatusClassname: formatStatusClassName(ps),
        }
      })

      const performanceAssets = (i.performanceAssets || []).map((a: any) => {
        const bnPnl = new BN(a.pnl ?? 0)
        const bnFees = new BN(a.fees ?? 0)
        const ps = formatUPnlStatus(bnPnl)
        const fs = formatUPnlStatus(bnFees)
        return {
          address,
          coin: a.coin,
          fees: bnFees.toFixed(decimalPlaces.__COMMON__),
          feesStatus: fs,
          feesStatusClassname: formatStatusClassName(fs),
          pnl: bnPnl.toFixed(decimalPlaces.__uPnl__),
          pnlStatus: ps,
          pnlStatusClassname: formatStatusClassName(ps),
          netPnL: bnPnl.plus(bnFees).toFixed(decimalPlaces.__COMMON__),
          trades: a.trades,
        }
      })

      result.data = {
        pnl: pnl.toFixed(decimalPlaces.__uPnl__),
        pnlStatus,
        pnlStatusClassname: formatStatusClassName(pnlStatus),
        longPnl: longPnl.toFixed(decimalPlaces.__uPnl__),
        shortPnl: shortPnl.toFixed(decimalPlaces.__uPnl__),
        profitableTrades,
        executedTrades,
        losingTrades,
        gross: gross.toFixed(decimalPlaces.__COMMON__),
        winRate: formatPer(i.winRate ?? 0),
        longWinRate: formatPer(i.longWr ?? 0),
        shortWinRate: formatPer(i.shortWr ?? 0),
        lossRate: !i.winRate && !i.shortWr && !i.longWr ? '0' : formatPer(1 - (i.winRate ?? 0)),
        fees: fees.toFixed(decimalPlaces.__COMMON__),
        tradeDuration: i.tradeDuration ?? 0,
        minDuration: i.minDuration ?? 0,
        maxDuration: i.maxDuration ?? 0,
        bestTrades,
        performanceAssets,
      }

      result.error = false
      merge(discoverTradingStatisticsStore, result.data)
    } catch {
      result.error = true
    } finally {
      this.discoverTradingStatisticsBusy = false
    }

    return result
  },
  discoverTradingStatisticsBusy: false,
}
