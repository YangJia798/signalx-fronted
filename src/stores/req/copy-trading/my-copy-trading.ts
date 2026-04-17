import { merge } from '@/utils'
import { baseCheck, baseApi } from '@/stores/req/helper'
import { TAccountStore, TCopyTradingStore } from '@/stores'
import { formatCopyTradingByItem } from '../utils'

type CopyTradingMyCopyTradingResult = {
  data: Record<string, any>,
  error: boolean
}

export type TCopyTradingMyCopyTrading = {
  copyTradingMyCopyTrading: (accountStore: TAccountStore, copyTradingStore: TCopyTradingStore) => Promise<CopyTradingMyCopyTradingResult>
  copyTradingMyCopyTradingBusy: boolean
}

export const copyTradingMyCopyTrading: TCopyTradingMyCopyTrading = {
  async copyTradingMyCopyTrading(accountStore, copyTradingStore) {
    const result: CopyTradingMyCopyTradingResult = { data: {}, error: true }
    const { logged } = accountStore

    if (this.copyTradingMyCopyTradingBusy || !logged) return result

    this.copyTradingMyCopyTradingBusy = true

    const res = await baseApi.get('/wallet/copy-trading/config/list')

    result.error = baseCheck(res, accountStore)
    this.copyTradingMyCopyTradingBusy = false

    if (result.error) return result

    const { data } = res.data

    result.data = {
      copyTradingList: (data.list || []).map(formatCopyTradingByItem)
    }

    merge(copyTradingStore, result.data)

    return result
  },
  copyTradingMyCopyTradingBusy: false,
}
