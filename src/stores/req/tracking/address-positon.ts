import BN from 'bignumber.js'

import { merge, formatPer } from '@/utils'
import { baseCheck, baseApi } from '@/stores/req/helper'
import { constants, TAccountStore, TTrackingAddressPositionStore } from '@/stores'

import { formatPositionByItem, formatUPnlStatus, formatStatusClassName } from '../utils'

type TrackingAddressPositionResult = {
  data: Record<string, any>,
  error: boolean
}

export type TTrackingAddressPosition = {
  trackingAddressPosition: (accountStore: TAccountStore, trackingAddressPositionStore: TTrackingAddressPositionStore) => Promise<TrackingAddressPositionResult>
  trackingAddressPositionBusy: boolean
}

export const trackingAddressPosition: TTrackingAddressPosition = {
  async trackingAddressPosition(accountStore, trackingAddressPositionStore) {
    const result: TrackingAddressPositionResult = { data: {}, error: true }
    const { logged } = accountStore

    if (this.trackingAddressPositionBusy || !logged) return result

    this.trackingAddressPositionBusy = true

    const res = await baseApi.get('/track-wallet/list')

    result.error = baseCheck(res, accountStore)
    this.trackingAddressPositionBusy = false

    if (result.error) return result

    const { data } = res.data

    result.data = {
      list: (data.recodes || []).map((item: any, idx: number) => {
        const bnPnl = new BN(item.pnl)
        const pnlStatus = formatUPnlStatus(bnPnl)

        return {
          address: item.wallet,
          note: item.remark,
          balance: new BN(item.balance).toFixed(constants.decimalPlaces.__COMMON__),
          pnl: bnPnl.toFixed(constants.decimalPlaces.__uPnl__),
          pnlStatus,
          pnlStatusClassname: formatStatusClassName(pnlStatus),
          totalPositionValue: new BN(item.totalPositionValue).toFixed(constants.decimalPlaces.__COMMON__),
          marginUsedRatio: formatPer(item.marginUsedRatio.replace('%', ''), true),
          positions: item.positions.map((positionItem: any, _idx: number) => formatPositionByItem(positionItem, _idx)),
          notificationOn: item.enableNotify,
          notificationSelectedLanguage: item.lang,
          notificationSelectedEventTypes: item.notifyAction ? item.notifyAction.split(',') : ['1', '2', '3', '4'],
        }
      })
    }

    merge(trackingAddressPositionStore, result.data)

    return result
  },
  trackingAddressPositionBusy: false,
}
