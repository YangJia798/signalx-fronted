import { baseCheck, baseApi } from '@/stores/req/helper'
import { TAccountStore, TTrackingCreateStore, TTrackingAddressPositionStore } from '@/stores'

type TrackingCreateResult = {
  data: Record<string, any>,
  error: boolean
}

export type TTrackingCreate = {
  trackingCreate: (accountStore: TAccountStore, trackingCreateStore: TTrackingCreateStore, trackingAddressPositionStore: TTrackingAddressPositionStore) => Promise<TrackingCreateResult>
  trackingCreateBusy: boolean
}

export const trackingCreate: TTrackingCreate = {
  async trackingCreate(accountStore, trackingCreateStore, trackingAddressPositionStore) {
    const result: TrackingCreateResult = { data: {}, error: true }
    const { logged } = accountStore

    if (this.trackingCreateBusy || !logged) return result

    this.trackingCreateBusy = true

    const items = trackingAddressPositionStore.batchImportAddresses.length
      ? trackingAddressPositionStore.batchImportAddresses
      : [
          {
            wallet: trackingCreateStore.createTrackAddress,
            remark: trackingCreateStore.createTrackNote,
            enableNotify: trackingCreateStore.notificationOn ? 1 : 0,
            notifyAction: trackingCreateStore.notificationSelectedEventTypes.join(','),
            lang: trackingCreateStore.notificationSelectedLanguage
          }
        ]

    for (const item of items) {
      const res = await baseApi.post('/track-wallet/create', item)
      result.error = baseCheck(res, accountStore)
      if (result.error) break
    }

    this.trackingCreateBusy = false

    return result
  },
  trackingCreateBusy: false,
}
