import BN from 'bignumber.js'

import { merge, formatPer } from '@/utils'
import { hyperStatsApi } from '@/stores/req/helper'
import { constants, TAccountStore, TDiscoverStore } from '@/stores'

import { formatUPnlStatus, formatStatusClassName } from '../utils'

type DiscoverListResult = {
  data: Record<string, any>,
  error: boolean
}

export type TDiscoverList = {
  discoverList: (accountStore: TAccountStore, discoverStore: TDiscoverStore) => Promise<DiscoverListResult>
  discoverListBusy: boolean
}

const CYCLE_TO_WINDOW: Record<string, string> = {
  '1': 'day',
  '7': 'week',
  '30': 'month',
  '0': 'allTime',
}

// In-memory cache: window → { rows, ts }
const _cache: Record<string, { rows: any[], ts: number }> = {}
const CACHE_TTL = 5 * 60 * 1000

async function fetchLeaderboard(window: string): Promise<any[]> {
  const cached = _cache[window]
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.rows
  const res = await hyperStatsApi.get('/Mainnet/leaderboard', { params: { window } })
  const rows: any[] = res.data?.leaderboardRows || []
  _cache[window] = { rows, ts: Date.now() }
  return rows
}

function mapRow(item: any, window: string, rank: number) {
  const perf: Record<string, any> = Object.fromEntries(item.windowPerformances || [])
  const w = perf[window] || {}
  const bnPnl = new BN(w.pnl || 0)
  const roi = parseFloat(w.roi || '0')
  const pnlStatus = formatUPnlStatus(bnPnl)
  const { decimalPlaces } = constants

  return {
    address: item.ethAddress,
    winRate: formatPer(roi),
    pnl: bnPnl.toFixed(decimalPlaces.__uPnl__),
    pnlStatus,
    pnlStatusClassname: formatStatusClassName(pnlStatus),
    longWinRate: '0',
    longPnl: '0.00',
    shortWinRate: '0',
    shortPnl: '0.00',
    lossRate: roi === 0 ? '0' : formatPer(1 - roi),
    accountTotalValue: new BN(item.accountValue || 0).toFixed(decimalPlaces.__COMMON__),
    totalPositions: 0,
    perpValue: new BN(item.accountValue || 0).toFixed(decimalPlaces.__COMMON__),
    spotValue: '0.00',
    marginUsed: '0.00',
    marginUsedRatio: '0%',
    executedTrades: 0,
    profitableTrades: 0,
    losingTrades: 0,
    avgLeverage: 0,
    lastActionTs: '',
    avgHoldingPeriod: 0,
    sharpe: '0.00',
    maxDrawdown: '0.00',
    rank,
    pnlList: [],
    note: item.displayName || '',
    // raw values used for sorting after mapping
    _roi: roi,
    _pnlNum: bnPnl.toNumber(),
    _accountValue: parseFloat(item.accountValue || '0'),
  }
}

const SORT_FN: Record<string, (a: any, b: any) => number> = {
  pnl:               (a, b) => b._pnlNum - a._pnlNum,
  roi:               (a, b) => b._roi - a._roi,
  winRate:           (a, b) => b._roi - a._roi,
  accountTotalValue: (a, b) => b._accountValue - a._accountValue,
}

export const discoverList: TDiscoverList = {
  async discoverList(accountStore, discoverStore) {
    const result: DiscoverListResult = { data: {}, error: true }

    if (this.discoverListBusy) return result
    this.discoverListBusy = true

    try {
      const window = CYCLE_TO_WINDOW[discoverStore.selectedCycleValue] || 'week'
      const rows = await fetchLeaderboard(window)

      // Address search filter
      const search = (discoverStore.searchAddress || '').toLowerCase().trim()
      const filtered = search
        ? rows.filter((r: any) => (r.ethAddress || '').toLowerCase().includes(search))
        : rows

      // Map
      const mapped = filtered.map((item: any, idx: number) => mapRow(item, window, idx + 1))

      // Sort
      const sortFn = SORT_FN[discoverStore.sortByKey]
      if (sortFn) mapped.sort(sortFn)

      // Re-assign rank after sort
      mapped.forEach((item, idx) => { item.rank = idx + 1 })

      // Paginate
      const size = discoverStore.size
      const start = (discoverStore.current - 1) * size
      const page = mapped.slice(start, start + size).map(({ _roi, _pnlNum, _accountValue, ...rest }) => rest)

      result.data = {
        last: page,
        isEnd: start + size >= mapped.length,
        total: mapped.length,
      }
      result.error = false
      merge(discoverStore, result.data)
    } catch {
      result.error = true
    } finally {
      this.discoverListBusy = false
    }

    return result
  },
  discoverListBusy: false,
}
