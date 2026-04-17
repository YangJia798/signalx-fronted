import { baseCheck, baseApi } from '@/stores/req/helper'
import { TAccountStore, TCopyTradingStore } from '@/stores'

type CopyTradingUpdateCopyTradingResult = {
  data: Record<string, any>,
  error: boolean
}

export type TCopyTradingUpdateCopyTrading = {
  copyTradingUpdateCopyTrading: (accountStore: TAccountStore, copyTradingStore: TCopyTradingStore) => Promise<CopyTradingUpdateCopyTradingResult>
  copyTradingUpdateCopyTradingBusy: boolean
  copyTradingToggleStatus: (accountStore: TAccountStore, id: string, status: number) => Promise<CopyTradingUpdateCopyTradingResult>
  copyTradingToggleStatusBusy: boolean
}

export const copyTradingUpdateCopyTrading: TCopyTradingUpdateCopyTrading = {
  async copyTradingUpdateCopyTrading(accountStore, copyTradingStore) {
    const result: CopyTradingUpdateCopyTradingResult = { data: {}, error: true }
    const { logged } = accountStore
    const item = copyTradingStore.operaCopyTradingTargetItem

    if (this.copyTradingUpdateCopyTradingBusy || !logged || !item) return result

    this.copyTradingUpdateCopyTradingBusy = true

    const res = await baseApi.put('/wallet/copy-trading/config', {
      id: item.id,
      remark: copyTradingStore.openPositionTargeNote,
      leverage: copyTradingStore.openPositionLeverage,            // [1..50]
      followMasterLeverage: copyTradingStore.openPositionFollowTargetLeverage ? 1 : 0,
      marginMode: copyTradingStore.openPositionMarginMode,        // 1=逐仓 2=全仓 3=跟随目标
      followModel: copyTradingStore.openPositionBuyModel,         // 1=资产等比 2=仓位等比 3=固定价值
      followModelValue: parseFloat(copyTradingStore.openPositionCopyRatio) / 100,
      maxMarginUsage: parseFloat(copyTradingStore.openPositionHighMarginProtect) / 100,
      status: 1
    })

    result.error = baseCheck(res, accountStore)
    this.copyTradingUpdateCopyTradingBusy = false

    return result
  },
  copyTradingUpdateCopyTradingBusy: false,

  async copyTradingToggleStatus(accountStore, id, status) {
    const result: CopyTradingUpdateCopyTradingResult = { data: {}, error: true }
    const { logged } = accountStore

    if (this.copyTradingToggleStatusBusy || !logged) return result

    this.copyTradingToggleStatusBusy = true

    const res = await baseApi.put('/wallet/copy-trading/config', { id, status })

    result.error = baseCheck(res, accountStore)
    this.copyTradingToggleStatusBusy = false

    return result
  },
  copyTradingToggleStatusBusy: false,
}
