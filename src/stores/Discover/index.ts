import { createStore } from '@/stores/helpers'
import { merge } from '@/utils'

export * from './trading-statistics'
export * from './recommend'
export * from './kol'

export interface TDiscoverItem {
  address: string
  sharpe?: string
  maxDrawdown?: string
  totalPositions?: number
  winRate?: string
  longWinRate?: string
  shortWinRate?: string
  accountTotalValue?: string
  perpValue?: string
  spotValue?: string
  pnl?: string
  longPnl?: string
  shortPnl?: string
  pnlList?: any[]
  rank?: number
}

interface TCycleItem {
  value: string
  i18n?: string
  label: string
}

export type TDiscoverStore = {
  mainTypeValue: string // 'popular' | 'all' | 'kol'
  mainTypeRadios: Array<{ value: string, i18n: string, label: string }>

  // Advanced Filters (Whale/Discover parity)
  filterAccountValue: string[]
  filterPnlScale: string[]
  filterSidePreference: string[]
  filterTradingRhythm: string[]
  filterPnlStatus: string[]
  filterTradingStyle: string[]

  filterMainForce: string // 主力吸筹监测
  filterMemberCoins: string[] // 会员币种选择

  CYCLE_KEYS: Record<string, TCycleItem>
  SORT_KEYS: Record<string, { id: string, i18n?: string, value: string, label: string }>

  openTradingStatistics: boolean

  cycles: Array<TCycleItem>
  selectedCycleValue: string
  selectedCycleItem: TCycleItem

  sortByKey: string

  list: Array<TDiscoverItem>
  last: Array<TDiscoverItem>
  _last: Array<TDiscoverItem>
  size: number
  current: number
  total: number
  isEnd: boolean
  isFirst: boolean
  isLast: boolean
  count: number

  next(): void
  resetList: () => void
  resetAddress(): void

  removeFilter(category: string, value: string): void
  clearAllFilters(): void

  reset: () => void
  [key: string]: any
}

const CYCLE_KEYS = {
  day: { value: '1', i18n: 'common.oneD', label: '1天' },
  week: { value: '7', i18n: 'common.oneW', label: '1周' },
  month: { value: '30', i18n: 'common.oneM', label: '1月' },
  allTime: { value: '0', i18n: 'common.all', label: '全部' },
}

const SORT_KEYS = {
  winRate: { id: 'winRate', i18n: 'common.winRate', value: '0', label: 'Win Rate' },
  accountTotalValue: { id: 'accountTotalValue', i18n: 'common.accountTotalValue', value: '1', label: 'Account Total Value' },
  roi: { id: 'roi', i18n: 'common.roi', value: '2', label: 'ROI' },
  pnl: { id: 'pnl', i18n: 'common.pnl', value: '3', label: 'Pnl' },
  executedTrades: { id: 'executedTrades', i18n: 'common.tradesCount', value: '4', label: 'Executed Trades' },
  profitableTrades: { id: 'profitableTrades', i18n: 'common.profitableTradesCount', value: '5', label: 'Profitable Trades' },
  lastOperation: { id: 'lastOperation', i18n: 'common.lastOperationTime', value: '6', label: 'Last Operation Time' },
  avgHoldingPeriod: { id: 'avgHoldingPeriod', i18n: 'common.avgHoldingPeriod', value: '7', label: 'Avg Holding Period' },
  currentPosition: { id: 'currentPosition', i18n: 'common.currentPosition', value: '8', label: 'Current Position' },
}

const DEFAULT_FILTERS = {
  filterAccountValue: [],
  filterPnlScale: [],
  filterSidePreference: [],
  filterTradingRhythm: [],
  filterPnlStatus: [],
  filterTradingStyle: [],
  filterMainForce: 'all',
  filterMemberCoins: ['ETH']
}

const DEFAULT_SEARCH = {
  searchAddressInput: '',
  searchAddress: '',
  searchList: [],
}

const DEFAULT_LIST = {
  list: [],
  _last: [],
  size: 12,
  current: 1,
  total: 0,
  isEnd: false,
}

const DEFAULT = {
  mainTypeValue: 'popular',
  sortByKey: SORT_KEYS.profitableTrades.id,
  selectedCycleValue: CYCLE_KEYS.week.value,
  openTradingStatistics: false,
  ...DEFAULT_LIST,
  ...DEFAULT_SEARCH,
  ...DEFAULT_FILTERS,
} as any

const discoverStore: TDiscoverStore = {
  ...DEFAULT,

  mainTypeRadios: [
    { value: 'popular', i18n: 'discover.popularAddresses', label: 'Popular Addresses' },
    { value: 'all', i18n: 'discover.allTraders', label: 'All Traders' },
    { value: 'kol', i18n: 'discover.kolTrader', label: 'Twitter KOL' },
  ],

  CYCLE_KEYS,
  SORT_KEYS,

  cycles: [
    CYCLE_KEYS.day,
    CYCLE_KEYS.week,
    CYCLE_KEYS.month,
    CYCLE_KEYS.allTime
  ],

  get selectedCycleItem(): TCycleItem {
    return this.cycles.find(item => item.value === this.selectedCycleValue) || this.cycles[1]
  },

  get last() {
    return this._last
  },
  set last(val) {
    const result = this._last = val
    this.list = this.list.concat(result as any)
  },
  get isFirst() {
    return this.current <= 1
  },
  get isLast() {
    return this.current >= this.count
  },
  get count() {
    const { total, size } = this
    return Math.ceil(total / size || 1)
  },
  next() {
    this.current += 1
  },
  resetList() {
    merge(this, DEFAULT_LIST)
  },
  resetAddress() {
    merge(this, DEFAULT_SEARCH)
  },
  reset() {
    merge(this, DEFAULT)
  },
  removeFilter(category: string, value: string) {
    if (Array.isArray(this[category])) {
      this[category] = (this[category] as string[]).filter(v => v !== value)
    } else {
      this[category] = 'all'
    }
  },
  clearAllFilters() {
    merge(this, DEFAULT_FILTERS)
  }
}

export const useDiscoverStore = createStore<TDiscoverStore>(discoverStore)
