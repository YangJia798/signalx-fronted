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

      const d = res.data?.data ?? res.data ?? {}
      const { decimalPlaces } = constants

      const pnl = new BN(d.netPnl ?? d.net_pnl ?? d.pnl ?? 0)
      const gross = new BN(d.grossPnl ?? d.gross_pnl ?? d.gross ?? 0)
      const fees = new BN(d.fees ?? d.totalFees ?? d.total_fees ?? 0)
      const longPnl = new BN(d.longPnl ?? d.long_pnl ?? 0)
      const shortPnl = new BN(d.shortPnl ?? d.short_pnl ?? 0)

      const executedTrades = d.totalTrades ?? d.total_trades ?? d.executedTrades ?? d.executed_trades ?? 0
      const profitableTrades = d.winningTrades ?? d.winning_trades ?? d.profitableTrades ?? d.profitable_trades ?? 0
      const losingTrades = d.losingTrades ?? d.losing_trades ?? (executedTrades - profitableTrades)

      const winRate = executedTrades > 0 ? profitableTrades / executedTrades : 0
      const longWinRate = d.longWinRate ?? d.long_win_rate ?? '0'
      const shortWinRate = d.shortWinRate ?? d.short_win_rate ?? '0'

      const tradeDuration = d.avgHoldingTime ?? d.avg_holding_time ?? d.tradeDuration ?? d.trade_duration ?? 0
      const minDuration = d.minHoldingTime ?? d.min_holding_time ?? d.minDuration ?? d.min_duration ?? 0
      const maxDuration = d.maxHoldingTime ?? d.max_holding_time ?? d.maxDuration ?? d.max_duration ?? 0

      const pnlStatus = formatUPnlStatus(pnl)

      const rawBestTrades: any[] = d.bestTrades ?? d.best_trades ?? d.topTrades ?? d.top_trades ?? []
      const bestTrades = rawBestTrades.map((t: any) => {
        const bnPnl = new BN(t.pnl ?? t.closedPnl ?? t.closed_pnl ?? 0)
        const ps = formatUPnlStatus(bnPnl)
        return {
          coin: t.coin ?? t.symbol ?? '',
          createTs: t.createTs ?? t.create_ts ?? t.time ?? t.closeTime ?? t.close_time ?? 0,
          direction: String(t.direction ?? t.dir ?? '').toLowerCase().includes('long') ? 'long' : 'short',
          duration: t.duration ?? t.holdingTime ?? t.holding_time ?? 0,
          pnl: bnPnl.toFixed(decimalPlaces.__uPnl__),
          pnlStatus: ps,
          pnlStatusClassname: formatStatusClassName(ps),
        }
      })

      const rawAssets: any[] = d.performanceAssets ?? d.performance_assets ?? d.assetPerformance ?? d.asset_performance ?? []
      const performanceAssets = rawAssets.map((a: any) => {
        const bnPnl = new BN(a.pnl ?? 0)
        const bnFees = new BN(a.fees ?? 0)
        const ps = formatUPnlStatus(bnPnl)
        const fs = formatUPnlStatus(bnFees)
        return {
          address,
          coin: a.coin ?? a.symbol ?? '',
          fees: bnFees.toFixed(decimalPlaces.__COMMON__),
          feesStatus: fs,
          feesStatusClassname: formatStatusClassName(fs),
          pnl: bnPnl.toFixed(decimalPlaces.__uPnl__),
          pnlStatus: ps,
          pnlStatusClassname: formatStatusClassName(ps),
          netPnL: bnPnl.plus(bnFees).toFixed(decimalPlaces.__COMMON__),
          trades: a.trades ?? a.total_trades ?? 0,
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
        winRate: typeof longWinRate === 'string' && d.winRate != null
          ? String(d.winRate ?? d.win_rate ?? formatPer(winRate))
          : formatPer(winRate),
        longWinRate: String(longWinRate),
        shortWinRate: String(shortWinRate),
        lossRate: winRate === 0 ? '0' : formatPer(1 - winRate),
        fees: fees.toFixed(decimalPlaces.__COMMON__),
        tradeDuration,
        minDuration,
        maxDuration,
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
