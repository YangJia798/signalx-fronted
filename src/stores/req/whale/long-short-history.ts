import { hyperbotApi } from '@/stores/req/helper'
import { TAccountStore, TWhalePositionsStore } from '@/stores'

type WhaleLongShortHistoryResult = {
  data: Record<string, any>,
  error: boolean
}

export type TWhaleLongShortHistory = {
  whaleLongShortHistory: (accountStore: TAccountStore, whalePositionsStore: TWhalePositionsStore) => Promise<WhaleLongShortHistoryResult>
  whaleLongShortHistoryBusy: boolean
}

export const whaleLongShortHistory: TWhaleLongShortHistory = {
  async whaleLongShortHistory(_accountStore, whalePositionsStore) {
    const result: WhaleLongShortHistoryResult = { data: {}, error: true }

    if (this.whaleLongShortHistoryBusy) return result
    this.whaleLongShortHistoryBusy = true

    try {
      const res = await hyperbotApi.get('/hl/whales/history-long-ratio', {
        params: {
          interval: whalePositionsStore.selectedPeriodChart,
          limit: 100,
        },
      })

      if (res.data?.code !== 0) throw new Error(res.data?.msg)

      const raw: any[] = res.data.data || []
      result.data = {
        longShortRatioHistory: raw
          .map(s => ({
            time: s.time > 1e12 ? Math.floor(s.time / 1000) : s.time,
            value: Number(s.longRatio),
            longRatio: Number(s.longRatio),
            shortRatio: Number(s.shortRatio ?? (1 - s.longRatio)),
            longValue: s.longValue ?? 0,
            shortValue: s.shortValue ?? 0,
          }))
          .sort((a, b) => a.time - b.time),
      }
      result.error = false
      whalePositionsStore.longShortRatioHistory = result.data.longShortRatioHistory
    } catch {
      result.error = true
    } finally {
      this.whaleLongShortHistoryBusy = false
    }

    return result
  },
  whaleLongShortHistoryBusy: false,
}
