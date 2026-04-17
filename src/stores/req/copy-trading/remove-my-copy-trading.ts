import { baseCheck, baseApi } from '@/stores/req/helper'
import { TAccountStore, TCopyTradingStore } from '@/stores'

type CopyTradingRemoveMyCopyTradingResult = {
  data: Record<string, any>,
  error: boolean
}

export type TCopyTradingRemoveMyCopyTrading = {
  copyTradingRemoveMyCopyTrading: (accountStore: TAccountStore, copyTradingStore: TCopyTradingStore) => Promise<CopyTradingRemoveMyCopyTradingResult>
  copyTradingRemoveMyCopyTradingBusy: boolean
}

export const copyTradingRemoveMyCopyTrading: TCopyTradingRemoveMyCopyTrading = {
  async copyTradingRemoveMyCopyTrading(accountStore, copyTradingStore) {
    const result: CopyTradingRemoveMyCopyTradingResult = { data: {}, error: true }
    const { logged } = accountStore
    const item = copyTradingStore.operaCopyTradingTargetItem

    if (this.copyTradingRemoveMyCopyTradingBusy || !logged || !item) return result

    this.copyTradingRemoveMyCopyTradingBusy = true

    const res = await baseApi.delete(`/wallet/copy-trading/config/${item.id}`)

    result.error = baseCheck(res, accountStore)
    this.copyTradingRemoveMyCopyTradingBusy = false

    return result
  },
  copyTradingRemoveMyCopyTradingBusy: false,
}
