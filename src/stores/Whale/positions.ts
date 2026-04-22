import { createStore } from '@/stores/helpers'

import { merge } from '@/utils'
// import { constants } from '@/stores'

type TSelectItem = {
  label: string,
  i18n?: string,
  value: string
}

export type TWhalePositionsStore = {
  FILTER_KEYS: Record<string, { label: string, value: string }>,

  selectCoin: Array<TSelectItem>
  selectedCoin: string,

  selectPeriod: Array<TSelectItem>,
  selectedPeriodAnalysis: string,
  selectedPeriodChart: string,

  selectDirection: Array<TSelectItem>
  selectedDirection: string,

  selectUPnl: Array<TSelectItem>
  selectedUPnl: string,

  selectFundingFee: Array<TSelectItem>
  selectedFundingFee: string,

  longShortRatioHistory: Array<{
    time: number
    value: number
    longRatio: number
    positionValueDiff: number
  }>

  pageSize: number,
  sortColumnId: string
  list: Array<{
    idx: number
    id: string
    address: string
    liquidationPrice: string
    leverage: number
    direction: string
    coin: string
    size: string
    openPrice: string
    markPrice: string
    marginUsed: string
    positionValue: string
    uPnl: string
    uPnlStatus: number
    uPnlStatusClassName: string
    uPnlRatio: string
    fundingFee: string
    fundingFeeStatus: number
    fundingFeeStatusClassName: string
    type: string
    createTs: number
    updateTs: number
  }>
  reset: () => void
}

const DEFAULT_SELECTED = 'all'
const FILTER_KEYS = {
  all: { i18n: 'common.all', label: 'All', value: 'all' },

  long: { i18n: 'common.long', label: 'Long', value: 'long' },
  short: { i18n: 'common.short', label: 'Short', value: 'short' },

  profit: { i18n: 'common.profit', label: 'Profit', value: 'profit' },
  loss: { i18n: 'common.loss', label: 'Loss', value: 'loss' },
}

const DEFAULT = {
  selectCoin: [
    { label: 'BTC', value: 'BTC' },
    { label: 'ETH', value: 'ETH' },
    { label: 'ATOM', value: 'ATOM' },
    { label: 'MATIC', value: 'MATIC' },
    { label: 'DYDX', value: 'DYDX' },
    { label: 'SOL', value: 'SOL' },
  ],
  selectedCoin: 'BTC',

  selectDirection: [
    { i18n: 'common.allDirection', label: 'All Direction', value: 'all' },
    FILTER_KEYS.long,
    FILTER_KEYS.short,
  ],
  selectedDirection: DEFAULT_SELECTED,

  selectUPnl: [
    { i18n: 'common.allUpnl', label: 'All uPnL', value: 'all' },
    FILTER_KEYS.profit,
    FILTER_KEYS.loss,
  ],
  selectedUPnl: DEFAULT_SELECTED,

  selectFundingFee: [
    { i18n: 'common.allFundingFee', label: 'All Funding Fee', value: 'all' },
    FILTER_KEYS.profit,
    FILTER_KEYS.loss,
  ],
  selectedFundingFee: DEFAULT_SELECTED,
  selectPeriod: [
    { label: '5分钟', value: '5m' },
    { label: '30分钟', value: '30m' },
    { label: '1小时', value: '1h' },
    { label: '4小时', value: '4h' },
    { label: '12小时', value: '12h' },
    { label: '1天', value: '1d' },
  ],
  selectedPeriodAnalysis: '1d',
  selectedPeriodChart: '4h',

  longShortRatioHistory: [],

  pageSize: 20,
  sortColumnId: 'createTs',
  list: []
}

const whalePositionsStore: TWhalePositionsStore = {
  FILTER_KEYS,

  ...DEFAULT,

  reset() {
    merge(this, DEFAULT)
  }
}

export const useWhalePositionsStore = createStore<TWhalePositionsStore>(whalePositionsStore)

