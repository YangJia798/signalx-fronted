import { createStore } from '@/stores/helpers'

import { merge } from '@/utils'
import { constants } from '@/stores'

interface TItem {
}

export type TTraderDetailsPositionsStore = {
  sortColumnId: string
  summary: any
  list: Array<TItem>

  openTPSLModal: boolean
  currentTPSLItem: any

  openClosePositionModal: boolean
  closePositionType: 'limit' | 'market'
  currentClosePositionItem: any

  reset: () => void
}

const DEFAULT = {
  sortColumnId: 'positionValue',
  summary: {},
  list: [],

  openTPSLModal: false,
  currentTPSLItem: null,

  openClosePositionModal: false,
  closePositionType: 'market',
  currentClosePositionItem: null,
}

const traderDetailsPositionsStore: TTraderDetailsPositionsStore = {
  ...DEFAULT,

  reset() {
    merge(this, DEFAULT)
  }
}

export const useTraderDetailsPositionsStore = createStore<TTraderDetailsPositionsStore>(traderDetailsPositionsStore)

