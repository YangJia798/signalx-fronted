import { createStore } from '../helpers'

import { merge } from '@/utils'

export type THomeStore = {
  startUrl: string
  reset: () => void
}

const DEFAULT = {
  startUrl: 'https://t.me/Signalxbotai_bot'
}

const homeStore: THomeStore = {
  ...DEFAULT,

  reset() {
    merge(this, DEFAULT)
  }
}

export const useHomeStore = createStore<THomeStore>(homeStore)