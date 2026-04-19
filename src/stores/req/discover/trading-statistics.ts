import BN from 'bignumber.js'

import { merge, formatPer } from '@/utils'
import { hyperApi } from '@/stores/req/helper'
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
  async discoverTradingStatistics(accountStore, discoverTradingStatisticsStore) {
    const result: DiscoverTradingStatisticsResult = { data: {}, error: true }

    if (this.discoverTradingStatisticsBusy) return result

    this.discoverTradingStatisticsBusy = true

    try {
      const address = discoverTradingStatisticsStore.address
      const period = +discoverTradingStatisticsStore.selectedCycleValue
      const startTime = period > 0 ? Date.now() - period * 24 * 60 * 60 * 1000 : undefined

      const res = await hyperApi.post('/info', {
        type: startTime ? 'userFillsByTime' : 'userFills',
        user: address,
        ...(startTime ? { startTime } : {})
      })

      const fills: any[] = res.data || []
      const { decimalPlaces } = constants

      // Closing fills have non-zero closedPnl
      const closingFills = fills.filter(f => parseFloat(f.closedPnl) !== 0)

      let grossPnl = new BN(0)
      let longPnl = new BN(0)
      let shortPnl = new BN(0)
      let totalFees = new BN(0)
      let winning = 0
      const coinMap: Record<string, { pnl: BN, fees: BN, trades: number }> = {}

      closingFills.forEach((f: any) => {
        const pnl = new BN(f.closedPnl)
        const fee = new BN(f.fee)
        const dir: string = f.dir || ''

        grossPnl = grossPnl.plus(pnl)
        totalFees = totalFees.plus(fee)
        if (dir.includes('Long')) longPnl = longPnl.plus(pnl)
        else if (dir.includes('Short')) shortPnl = shortPnl.plus(pnl)
        if (pnl.gt(0)) winning++

        if (!coinMap[f.coin]) coinMap[f.coin] = { pnl: new BN(0), fees: new BN(0), trades: 0 }
        coinMap[f.coin].pnl = coinMap[f.coin].pnl.plus(pnl)
        coinMap[f.coin].fees = coinMap[f.coin].fees.plus(fee)
        coinMap[f.coin].trades++
      })

      // Add fees from opening fills too
      fills.forEach((f: any) => {
        if (parseFloat(f.closedPnl) === 0) {
          totalFees = totalFees.plus(new BN(f.fee))
        }
      })

      const totalPnl = grossPnl.plus(totalFees)
      const total = closingFills.length
      const winRate = total > 0 ? winning / total : 0
      const pnlStatus = formatUPnlStatus(totalPnl)

      const bestTrades = [...closingFills]
        .sort((a: any, b: any) => parseFloat(b.closedPnl) - parseFloat(a.closedPnl))
        .slice(0, 10)
        .map((f: any) => {
          const bnPnl = new BN(f.closedPnl)
          const ps = formatUPnlStatus(bnPnl)
          return {
            coin: f.coin,
            createTs: f.time,
            direction: (f.dir || '').toLowerCase().includes('long') ? 'long' : 'short',
            duration: 0,
            pnl: bnPnl.toFixed(decimalPlaces.__uPnl__),
            pnlStatus: ps,
            pnlStatusClassname: formatStatusClassName(ps),
          }
        })

      const performanceAssets = Object.entries(coinMap)
        .sort((a, b) => b[1].pnl.minus(a[1].pnl).toNumber())
        .map(([coin, data]) => {
          const bnPnl = data.pnl
          const bnFees = data.fees
          const ps = formatUPnlStatus(bnPnl)
          const fs = formatUPnlStatus(bnFees)
          return {
            address,
            coin,
            fees: bnFees.toFixed(decimalPlaces.__COMMON__),
            feesStatus: fs,
            feesStatusClassname: formatStatusClassName(fs),
            pnl: bnPnl.toFixed(decimalPlaces.__uPnl__),
            pnlStatus: ps,
            pnlStatusClassname: formatStatusClassName(ps),
            netPnL: bnPnl.plus(bnFees).toFixed(decimalPlaces.__COMMON__),
            trades: data.trades,
          }
        })

      result.data = {
        pnl: totalPnl.toFixed(decimalPlaces.__uPnl__),
        pnlStatus,
        pnlStatusClassname: formatStatusClassName(pnlStatus),
        longPnl: longPnl.toFixed(decimalPlaces.__uPnl__),
        shortPnl: shortPnl.toFixed(decimalPlaces.__uPnl__),
        profitableTrades: winning,
        executedTrades: total,
        losingTrades: total - winning,
        gross: grossPnl.toFixed(decimalPlaces.__COMMON__),
        winRate: formatPer(winRate),
        longWinRate: '0',
        shortWinRate: '0',
        lossRate: winRate === 0 ? '0' : formatPer(1 - winRate),
        fees: totalFees.toFixed(decimalPlaces.__COMMON__),
        tradeDuration: 0,
        minDuration: 0,
        maxDuration: 0,
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