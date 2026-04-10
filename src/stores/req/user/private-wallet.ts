import BN from 'bignumber.js'

import { merge, defaults } from '@/utils'
import { baseCheck, baseApi } from '@/stores/req/helper'
import { constants, TAccountStore, TPrivateWalletStore } from '@/stores'

import { formatUPnlStatus, formatStatusClassName } from '../utils'

type UserPrivateWalletResult = {
  data: Record<string, any>,
  error: boolean
}

export type TUserPrivateWallet = {
  userPrivateWallet: (accountStore: TAccountStore, privateWalletStore: TPrivateWalletStore) => Promise<UserPrivateWalletResult>
  userPrivateWalletBusy: boolean
}

export const userPrivateWallet: TUserPrivateWallet = {
  async userPrivateWallet(accountStore, privateWalletStore) {
    const result: UserPrivateWalletResult = { data: {}, error: true }
    const { logged } = accountStore

    if (this.userPrivateWalletBusy || !logged) return result

    this.userPrivateWalletBusy = true

    // GET /wallet/list — 获取用户托管钱包列表（返回数组）
    const res = await baseApi.get('/wallet/list')

    result.error = baseCheck(res, accountStore)
    this.userPrivateWalletBusy = false

    if (result.error) return result

    // update
    const { data } = res.data
    // reset
    privateWalletStore.list = []
    privateWalletStore.addresses = []

    let items: Array<Record<string, any>> = []
    if (Array.isArray(data)) {
      items = data
    } else if (data && data.records && Array.isArray(data.records)) {
      items = data.records
    } else if (data && data.list && Array.isArray(data.list)) {
      items = data.list
    } else if (data && Object.keys(data).length > 0) {
      items = [data]
    }

    result.data = {
      addresses: items.map(item => item.wallet ?? item.address ?? ''),
      list: items.map((item, idx) => {
        const bnUPnl = new BN(item.upnl ?? item.uPnl ?? item.profit_loss ?? 0)
        const { decimalPlaces } = constants
        const uPnlStatus = formatUPnlStatus(bnUPnl)

        let createTsStr = item.registerTime ?? item.createTs ?? item.created_time ?? '';
        let createTs = createTsStr;
        if (createTsStr && typeof createTsStr === 'string' && createTsStr.includes('-')) {
            createTs = new Date(createTsStr.replace(/-/g, '/')).getTime();
        }

        return {
          idx,
          walletId: item.walletId ?? item.id ?? idx + 1,
          balance: new BN(item.balance ?? item.total_value ?? 0).toFixed(decimalPlaces.__COMMON__),
          hasPrivateKey: item.hasPriKey ?? item.hasPrivateKey ?? false,
          nickname: item.nickname ?? item.remark ?? '',
          pwPrompt: item.passwdPrompt ?? '',
          createTs: createTs,
          totalMarginUsed: new BN(item.totalMarginUsed ?? item.total_margin_used ?? 0).toFixed(decimalPlaces.__COMMON__),
          uPnl: bnUPnl.toFixed(constants.decimalPlaces.__uPnl__),
          uPnlStatus,
          uPnlStatusClassName: formatStatusClassName(uPnlStatus),
          address: item.wallet ?? item.address ?? '',
          withdrawable: new BN(item.withdrawable ?? item.withdrawable_amount ?? 0).toFixed(decimalPlaces.__COMMON__)
        }
      })
    }

    // update
    merge(privateWalletStore, result.data)

    return result
  },
  userPrivateWalletBusy: false,
}