import { baseCheck, baseApi } from '@/stores/req/helper'
import { TAccountStore, TCopyTradingStore } from '@/stores'

type CopyTradingCreateCopyTradingResult = {
  data: Record<string, any>,
  error: boolean
}

export type TCopyTradingCreateCopyTrading = {
  copyTradingCreateCopyTrading: (accountStore: TAccountStore, copyTradingStore: TCopyTradingStore) => Promise<CopyTradingCreateCopyTradingResult>
  copyTradingCreateCopyTradingBusy: boolean
}

export const copyTradingCreateCopyTrading: TCopyTradingCreateCopyTrading = {
  async copyTradingCreateCopyTrading(accountStore, copyTradingStore) {
    const result: CopyTradingCreateCopyTradingResult = { data: {}, error: true }
    const { logged } = accountStore

    if (this.copyTradingCreateCopyTradingBusy || !logged) return result

    this.copyTradingCreateCopyTradingBusy = true

    const res = await baseApi.post('/wallet/copy-trading/config', {
      mainWallet: copyTradingStore.openPositionWalletAddress,
      mainWalletPlatform: 'hyper',
      targetWallet: copyTradingStore.copyTradingTargetAddress,
      targetWalletPlatform: 'hyper',
      remark: copyTradingStore.openPositionTargeNote,
      leverage: copyTradingStore.openPositionLeverage,            // [1..50]
      followMasterLeverage: copyTradingStore.openPositionFollowTargetLeverage ? 1 : 0, // 0=否 1=是
      marginMode: copyTradingStore.openPositionMarginMode,        // 1=逐仓 2=全仓 3=跟随目标
      followModel: copyTradingStore.openPositionBuyModel,         // 1=资产等比 2=仓位等比 3=固定价值
      followModelValue: parseFloat(copyTradingStore.openPositionCopyRatio) / 100,
      maxMarginUsage: parseFloat(copyTradingStore.openPositionHighMarginProtect) / 100, // 0-1
      status: 1
    })

    result.error = baseCheck(res, accountStore)
    this.copyTradingCreateCopyTradingBusy = false

    if (result.error) return result

    const { data } = res.data
    result.data = { id: data?.id }

    return result
  },
  copyTradingCreateCopyTradingBusy: false,
}
