import BN from 'bignumber.js'

import { merge, formatPer } from '@/utils'
import { hyperbotApi, hyperApi } from '@/stores/req/helper'
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

const SORT_TO_ENDPOINT: Record<string, string> = {
  pnl:               '/leaderboard/address/top-pnl',
  roi:               '/leaderboard/address/top-roi',
  winRate:           '/leaderboard/address/top-roi',
  vlm:               '/leaderboard/address/top-vlm',
  accountTotalValue: '/leaderboard/address/top-account-value',
}
const DEFAULT_ENDPOINT = '/leaderboard/address/top-pnl'

const _cache: Record<string, { rows: any[], total: number, ts: number }> = {}
const CACHE_TTL = 5 * 60 * 1000
const TAKE = 99999

async function fetchLeaderboard(window: string, endpoint: string): Promise<{ rows: any[], total: number }> {
  const key = `${window}:${endpoint}`
  const cached = _cache[key]
  if (cached && Date.now() - cached.ts < CACHE_TTL) return { rows: cached.rows, total: cached.total }
  const res = await hyperbotApi.get(endpoint, { params: { window, take: TAKE } })
  const rows: any[] = res.data?.data || []
  const total: number = res.data?.total || res.data?.count || rows.length
  _cache[key] = { rows, total, ts: Date.now() }
  return { rows, total }
}

async function fetchPortfolioStats(address: string): Promise<{ pnlList: any[], sharpe: string, maxDrawdown: string }> {
  try {
    const res = await hyperApi.post('/info', { type: 'portfolio', user: address })
    const data: any[] = res.data || []

    const weekEntry = data.find((item: any) => item[0] === 'week')
    if (!weekEntry) return { pnlList: [], sharpe: '0.00', maxDrawdown: '0.00' }

    const { accountValueHistory = [], pnlHistory = [] } = weekEntry[1]

    const pnlList = pnlHistory.map((item: any) => ({
      time: Math.floor(item[0] / 1000),
      value: parseFloat(item[1]),
    }))

    const values: number[] = accountValueHistory.map((item: any) => parseFloat(item[1]))

    // Annualized Sharpe from daily returns
    const returns: number[] = []
    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] > 0) returns.push((values[i] - values[i - 1]) / values[i - 1])
    }
    let sharpe = '0.00'
    if (returns.length > 1) {
      const mean = returns.reduce((s, r) => s + r, 0) / returns.length
      const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length
      const std = Math.sqrt(variance)
      if (std > 0) sharpe = (mean / std * Math.sqrt(252)).toFixed(2)
    }

    // Max Drawdown
    let maxDD = 0
    let peak = values[0] || 0
    for (const v of values) {
      if (v > peak) peak = v
      if (peak > 0) {
        const dd = (peak - v) / peak
        if (dd > maxDD) maxDD = dd
      }
    }

    return { pnlList, sharpe, maxDrawdown: (maxDD * 100).toFixed(2) }
  } catch {
    return { pnlList: [], sharpe: '0.00', maxDrawdown: '0.00' }
  }
}

const CYCLE_TO_MS: Record<string, number> = {
  '1':  1  * 24 * 60 * 60 * 1000,
  '7':  7  * 24 * 60 * 60 * 1000,
  '30': 30 * 24 * 60 * 60 * 1000,
}

async function fetchFillStats(address: string, cycleValue: string): Promise<{
  longPnl: string, shortPnl: string, longWinRate: string, shortWinRate: string
}> {
  const zero = { longPnl: '0.00', shortPnl: '0.00', longWinRate: '0', shortWinRate: '0' }
  try {
    const periodMs = CYCLE_TO_MS[cycleValue]
    const body = periodMs
      ? { type: 'userFillsByTime', user: address, startTime: Date.now() - periodMs }
      : { type: 'userFills', user: address }
    const res = await hyperApi.post('/info', body)
    const fills: any[] = res.data || []
    const closing = fills.filter(f => parseFloat(f.closedPnl) !== 0)

    let longPnl = new BN(0), shortPnl = new BN(0)
    let longWin = 0, longTotal = 0, shortWin = 0, shortTotal = 0

    closing.forEach(f => {
      const pnl = new BN(f.closedPnl)
      const dir: string = f.dir || ''
      if (dir.includes('Long')) {
        longPnl = longPnl.plus(pnl); longTotal++
        if (pnl.gt(0)) longWin++
      } else if (dir.includes('Short')) {
        shortPnl = shortPnl.plus(pnl); shortTotal++
        if (pnl.gt(0)) shortWin++
      }
    })

    return {
      longPnl: longPnl.toFixed(2),
      shortPnl: shortPnl.toFixed(2),
      longWinRate: longTotal > 0 ? formatPer(longWin / longTotal) : '0',
      shortWinRate: shortTotal > 0 ? formatPer(shortWin / shortTotal) : '0',
    }
  } catch {
    return zero
  }
}

function computeTags(pnlNum: number, accountValue: number, longPnlNum: number, shortPnlNum: number): string[] {
  const tags: string[] = []

  // Account size
  if (accountValue >= 1_000_000) tags.push('巨鲸')
  else if (accountValue >= 100_000) tags.push('中等资金')
  else tags.push('小资金')

  // Direction preference (only when fill data available)
  if (longPnlNum !== 0 || shortPnlNum !== 0) {
    if (longPnlNum > shortPnlNum * 1.5) tags.push('偏多头')
    else if (shortPnlNum < 0 && Math.abs(shortPnlNum) > Math.abs(longPnlNum) * 1.5) tags.push('偏空头')
    else tags.push('中性')
  }

  // Profit scale
  const absPnl = Math.abs(pnlNum)
  if (absPnl >= 100_000) tags.push('大额盈利')
  else if (absPnl >= 10_000) tags.push('中等盈利')
  else tags.push('小额盈利')

  return tags
}

function mapRow(item: any, window: string, rank: number) {
  const { decimalPlaces } = constants

  let pnlRaw = item.pnl
  let roiRaw = item.roi
  if (item.windowPerformances) {
    const perf = item.windowPerformances.find((p: any) => p.window === window)?.performance || {}
    pnlRaw = perf.pnl
    roiRaw = perf.roi
  }

  const pnl = new BN(pnlRaw ?? 0)
  const roi = parseFloat(roiRaw ?? 0)
  const pnlStatus = formatUPnlStatus(pnl)

  return {
    address: item.ethAddress,
    winRate: formatPer(roi),
    pnl: pnl.toFixed(decimalPlaces.__uPnl__),
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
    pnlList: [] as any[],
    tags: [] as string[],
    note: item.displayName || '',
    _pnlNum: pnl.toNumber(),
    _roi: roi,
    _accountValue: parseFloat(item.accountValue || '0'),
    _vlm: parseFloat(item.vlm || '0'),
  }
}

export const discoverList: TDiscoverList = {
  async discoverList(_accountStore, discoverStore) {
    const result: DiscoverListResult = { data: {}, error: true }

    if (this.discoverListBusy) return result
    this.discoverListBusy = true

    try {
      const window = CYCLE_TO_WINDOW[discoverStore.selectedCycleValue] || 'week'
      const endpoint = SORT_TO_ENDPOINT[discoverStore.sortByKey] || DEFAULT_ENDPOINT
      const { rows, total: apiTotal } = await fetchLeaderboard(window, endpoint)

      const search = (discoverStore.searchAddress || '').toLowerCase().trim()
      const filtered = search
        ? rows.filter((r: any) => (r.ethAddress || '').toLowerCase().includes(search))
        : rows

      const mapped = filtered.map((item: any, idx: number) => mapRow(item, window, idx + 1))

      const size = discoverStore.size
      const start = (discoverStore.current - 1) * size
      const pageRaw = mapped.slice(start, start + size)

      // Parallel fetch per-address data for visible page items
      const [positionCounts, portfolioStats, fillStats] = await Promise.all([
        Promise.all(
          pageRaw.map(item =>
            hyperApi.post('/info', { type: 'clearinghouseState', user: item.address })
              .then(r => {
                const positions: any[] = r.data?.assetPositions || []
                return positions.filter(p => parseFloat(p.position?.szi || '0') !== 0).length
              })
              .catch(() => 0)
          )
        ),
        Promise.all(pageRaw.map(item => fetchPortfolioStats(item.address))),
        Promise.all(pageRaw.map(item => fetchFillStats(item.address, discoverStore.selectedCycleValue))),
      ])

      pageRaw.forEach((item, i) => {
        item.totalPositions = positionCounts[i]
        item.pnlList = portfolioStats[i].pnlList as any[]
        item.sharpe = portfolioStats[i].sharpe
        item.maxDrawdown = portfolioStats[i].maxDrawdown
        item.longPnl = fillStats[i].longPnl
        item.shortPnl = fillStats[i].shortPnl
        item.longWinRate = fillStats[i].longWinRate
        item.shortWinRate = fillStats[i].shortWinRate
        item.tags = computeTags(
          item._pnlNum,
          item._accountValue,
          parseFloat(item.longPnl),
          parseFloat(item.shortPnl),
        )
      })

      const page = pageRaw.map(({ _pnlNum, _roi, _accountValue, _vlm, ...rest }) => rest)

      result.data = {
        last: page,
        isEnd: start + size >= mapped.length,
        total: apiTotal > mapped.length ? apiTotal : mapped.length,
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
