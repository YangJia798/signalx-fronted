import { baseCheck, baseApi } from '@/stores/req/helper'
import { TAccountStore } from '@/stores'

type AsterRecord = {
  id: string
  type: 'DEPOSIT' | 'WITHDRAW'
  asset: string
  amount: string
  state: 'PROCESSING' | 'SUCCESS' | 'FAILED'
  txHash: string
  time: number
  chainId: number
  accountType: string
}

type TAsterDepositWithdrawHistoryResult = {
  data: { list: AsterRecord[] }
  error: boolean
}

export type TAsterDepositWithdrawHistory = {
  asterDepositWithdrawHistory: (accountStore: TAccountStore, walletId: number) => Promise<TAsterDepositWithdrawHistoryResult>
  asterDepositWithdrawHistoryBusy: boolean
}

export const asterDepositWithdrawHistory: TAsterDepositWithdrawHistory = {
  async asterDepositWithdrawHistory(accountStore, walletId) {
    const result: TAsterDepositWithdrawHistoryResult = { data: { list: [] }, error: true }

    if (this.asterDepositWithdrawHistoryBusy || !accountStore.logged) return result

    this.asterDepositWithdrawHistoryBusy = true

    const res = await baseApi.post('/wallet/aster/deposit-withdraw-history', { walletId })

    result.error = baseCheck(res, accountStore)
    this.asterDepositWithdrawHistoryBusy = false

    if (result.error) return result

    const raw = res.data?.data
    const items: AsterRecord[] = Array.isArray(raw) ? raw : (raw?.list ?? [])

    result.data = {
      list: items.map(item => ({
        id: item.id,
        type: item.type,
        asset: item.asset,
        amount: item.amount,
        state: item.state,
        txHash: item.txHash,
        time: item.time,
        chainId: item.chainId,
        accountType: item.accountType,
      }))
    }

    return result
  },
  asterDepositWithdrawHistoryBusy: false,
}
