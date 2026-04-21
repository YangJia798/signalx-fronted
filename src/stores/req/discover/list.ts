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

// Our cycle value → hyperbot window
const CYCLE_TO_WINDOW: Record<string, string> = {
  '1': 'day',
  '7': 'week',
  '30': 'month',
  '0': 'allTime',
}

// Our sortByKey → hyperbot endpoint
const SORT_TO_ENDPOINT: Record<string, string> = {
  pnl:               '/leaderboard/address/top-pnl',
  roi:               '/leaderboard/address/top-roi',
  winRate:           '/leaderboard/address/top-roi',
  vlm:               '/leaderboard/address/top-vlm',
  accountTotalValue: '/leaderboard/address/top-account-value',
}
const DEFAULT_ENDPOINT = '/leaderboard/address/top-pnl'

// Cache: `${window}:${endpoint}` → { rows, ts }
const _cache: Record<string, { rows: any[], ts: number }> = {}
const CACHE_TTL = 5 * 60 * 1000
const TAKE = 100

async function fetchLeaderboard(window: string, endpoint: string): Promise<any[]> {
  const key = `${window}:${endpoint}`
  const cached = _cache[key]
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.rows

  const res = await hyperbotApi.get(endpoint, { params: { window, take: TAKE } })
  const rows: any[] = res.data?.data || []
  _cache[key] = { rows, ts: Date.now() }
  return rows
}

function mapRow(item: any, window: string, rank: number) {
  const { decimalPlaces } = constants

  // top-account-value has nested windowPerformances; others have flat pnl/roi
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
    pnlList: [],
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
      const rows = await fetchLeaderboard(window, endpoint)

      // Address search filter
      const search = (discoverStore.searchAddress || '').toLowerCase().trim()
      const filtered = search
        ? rows.filter((r: any) => (r.ethAddress || '').toLowerCase().includes(search))
        : rows

      const mapped = filtered.map((item: any, idx: number) => mapRow(item, window, idx + 1))

      // Paginate
      const size = discoverStore.size
      const start = (discoverStore.current - 1) * size
      const pageRaw = mapped.slice(start, start + size)

      // Fetch current positions in parallel for visible addresses
      const positionCounts = await Promise.all(
        pageRaw.map(item =>
          hyperApi.post('/info', { type: 'clearinghouseState', user: item.address })
            .then(r => {
              const positions: any[] = r.data?.assetPositions || []
              return positions.filter(p => parseFloat(p.position?.szi || '0') !== 0).length
            })
            .catch(() => 0)
        )
      )
      pageRaw.forEach((item, i) => { item.totalPositions = positionCounts[i] })

      const page = pageRaw.map(({ _pnlNum, _roi, _accountValue, _vlm, ...rest }) => rest)

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
