import { baseCheck, baseApi } from '@/stores/req/helper'
import { TAccountStore, TTrackingAddressPositionStore } from '@/stores'

type TrackingRemoveResult = {
  data: Record<string, any>,
  error: boolean
}

export type TTrackingRemove = {
  trackingRemove: (accountStore: TAccountStore, trackingAddressPositionStore: TTrackingAddressPositionStore) => Promise<TrackingRemoveResult>
  trackingRemoveBusy: boolean
}

export const trackingRemove: TTrackingRemove = {
  async trackingRemove(accountStore, trackingAddressPositionStore) {
    const result: TrackingRemoveResult = { data: {}, error: true }
    const { logged } = accountStore

    if (this.trackingRemoveBusy || !logged) return result

    this.trackingRemoveBusy = true

    const res = await baseApi.post('/api/track-wallet/remove', {
      wallet: trackingAddressPositionStore.removeTrackAddress
    })

    result.error = baseCheck(res, accountStore)
    this.trackingRemoveBusy = false

    return result
  },
  trackingRemoveBusy: false,
}
