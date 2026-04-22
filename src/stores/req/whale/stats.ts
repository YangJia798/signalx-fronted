import { hyperbotApi } from '@/stores/req/helper'
import { TAccountStore, TWhalePositionsStore } from '@/stores'

type WhaleStatsResult = {
  data: Record<string, any>,
  error: boolean
}

export type TWhaleStats = {
  whaleStats: (accountStore: TAccountStore, whalePositionsStore: TWhalePositionsStore) => Promise<WhaleStatsResult>
  whaleStatsBusy: boolean
}

export const whaleStats: TWhaleStats = {
  async whaleStats(_accountStore, whalePositionsStore) {
    const result: WhaleStatsResult = { data: {}, error: true }

    if (this.whaleStatsBusy) return result
    this.whaleStatsBusy = true

    try {
      const res = await hyperbotApi.get('/whales/long-short', {
        params: { coin: whalePositionsStore.selectedCoin },
      })

      if (res.data?.code !== 0) throw new Error(res.data?.msg)

      result.data = {
        longCount: res.data.data?.longCount ?? 0,
        shortCount: res.data.data?.shortCount ?? 0,
      }
      result.error = false
    } catch {
      result.error = true
    } finally {
      this.whaleStatsBusy = false
    }

    return result
  },
  whaleStatsBusy: false,
}
