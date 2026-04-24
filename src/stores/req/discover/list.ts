import BN from 'bignumber.js'

import { merge, formatPer } from '@/utils'
import { baseApi } from '@/stores/req/helper'
import { constants, TAccountStore, TDiscoverStore } from '@/stores'
import i18n from '@/i18n'

import { formatUPnlStatus, formatStatusClassName } from '../utils'

type DiscoverListResult = {
  data: Record<string, any>,
  error: boolean
}

export type TDiscoverList = {
  discoverList: (accountStore: TAccountStore, discoverStore: TDiscoverStore) => Promise<DiscoverListResult>
  discoverListBusy: boolean
}

const DISCOVER_ENDPOINT = '/hl/traders/discover'

const CYCLE_TO_PERIOD: Record<string, number> = {
  '1': 1,
  '7': 7,
  '30': 30,
  '0': 0,
}

const SORT_TO_FIELD: Record<string, string> = {
  pnl: 'totalPnl',
  winRate: 'winRate',
  accountTotalValue: 'snapTotalValue',
  currentPosition: 'snapPositionCount',
  roi: 'totalPnl',
  vlm: 'snapPositionValue',
}

const DISCOVER_SELECTS = [
  'address',
  'winRate',
  'totalPnl',
  'longPnl',
  'longWinRate',
  'shortPnl',
  'shortWinRate',
  'avgLeverage',
  'sharpe',
  'snapTotalValue',
  'snapPerpValue',
  'snapPositionCount',
  'snapEffLeverage',
  'snapPositionValue',
  'snapLongPositionValue',
  'snapShortPositionValue',
  'snapMarginUsageRate',
  'snapTotalMarginUsed',
  'snapLongPositionCount',
  'snapShortPositionCount',
  'snapUnrealizedPnl',
  'ddDrawdown',
] as const

function getDiscoverLang() {
  const lang = i18n.resolvedLanguage || i18n.language || 'en'
  return lang.startsWith('zh') ? 'zh' : 'en'
}

function getSortField(sortByKey: string) {
  return SORT_TO_FIELD[sortByKey] || 'totalPnl'
}

function mapRow(item: any, rank: number) {
  const { decimalPlaces } = constants
  const pnl = new BN(item.totalPnl ?? 0)
  const totalValue = new BN(item.snapTotalValue || 0)
  const perpValue = new BN(item.snapPerpValue || 0)
  const spotValue = item.snapSpotValue != null
    ? new BN(item.snapSpotValue || 0)
    : totalValue.minus(perpValue)
  const pnlStatus = formatUPnlStatus(pnl)
  const pnlList = Array.isArray(item.pnlList)
    ? item.pnlList.map((point: any) => ({
      time: Math.floor(Number(point.ts || 0) / 1000),
      value: parseFloat(String(point.v || 0)),
    }))
    : []

  return {
    address: item.address,
    winRate: formatPer(item.winRate || 0),
    pnl: pnl.toFixed(decimalPlaces.__uPnl__),
    pnlStatus,
    pnlStatusClassname: formatStatusClassName(pnlStatus),
    longWinRate: item.longWinRate == null ? '0' : formatPer(item.longWinRate),
    longPnl: new BN(item.longPnl || 0).toFixed(decimalPlaces.__uPnl__),
    shortWinRate: item.shortWinRate == null ? '0' : formatPer(item.shortWinRate),
    shortPnl: new BN(item.shortPnl || 0).toFixed(decimalPlaces.__uPnl__),
    lossRate: Number(item.winRate || 0) === 0 ? '0' : formatPer(1 - Number(item.winRate || 0)),
    accountTotalValue: totalValue.toFixed(decimalPlaces.__COMMON__),
    totalPositions: Number(item.snapPositionCount || 0),
    perpValue: perpValue.toFixed(decimalPlaces.__COMMON__),
    spotValue: spotValue.toFixed(decimalPlaces.__COMMON__),
    marginUsed: new BN(item.snapTotalMarginUsed || 0).toFixed(decimalPlaces.__COMMON__),
    marginUsedRatio: formatPer(item.snapMarginUsageRate || 0),
    executedTrades: 0,
    profitableTrades: 0,
    losingTrades: 0,
    avgLeverage: parseFloat(String(item.avgLeverage || 0)),
    lastActionTs: '',
    avgHoldingPeriod: 0,
    sharpe: item.sharpe == null ? '0.00' : new BN(item.sharpe).toFixed(2),
    maxDrawdown: formatPer(item.ddDrawdown || 0),
    rank,
    pnlList,
    tags: Array.isArray(item.tags) ? item.tags : [],
    note: '',
  }
}

export const discoverList: TDiscoverList = {
  async discoverList(_accountStore, discoverStore) {
    const result: DiscoverListResult = { data: {}, error: true }

    if (this.discoverListBusy) return result
    this.discoverListBusy = true

    try {
      const payload = {
        pageNum: discoverStore.current,
        pageSize: discoverStore.size,
        LoadPnls: true,
        LoadTags: true,
        period: CYCLE_TO_PERIOD[discoverStore.selectedCycleValue] ?? 7,
        sort: {
          field: getSortField(discoverStore.sortByKey),
          dir: 'DESC',
        },
        filters: [],
        coins: [],
        lang: getDiscoverLang(),
        selects: [...DISCOVER_SELECTS],
      }

      const res = await baseApi.post(DISCOVER_ENDPOINT, payload)
      const rows: any[] = res.data?.data?.list || []
      const total = Number(res.data?.data?.total || 0)
      const startRank = (discoverStore.current - 1) * discoverStore.size
      const page = rows.map((item: any, idx: number) => mapRow(item, startRank + idx + 1))

      result.data = {
        last: page,
        isEnd: rows.length < discoverStore.size || discoverStore.current * discoverStore.size >= total,
        total,
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
