
import { merge } from '@/utils'
import { baseCheck, baseApi } from '@/stores/req/helper'
import { TAccountStore, TPrivateWalletStore } from '@/stores'

type UserCreatePrivateWalletResult = {
  data: Record<string, any>,
  error: boolean
}

export type TUserCreatePrivateWallet = {
  userCreatePrivateWallet: (accountStore: TAccountStore, privateWalletStore: TPrivateWalletStore) => Promise<UserCreatePrivateWalletResult>
  userCreatePrivateWalletBusy: boolean
}

export const userCreatePrivateWallet: TUserCreatePrivateWallet = {
  async userCreatePrivateWallet(accountStore, privateWalletStore) {
    const result: UserCreatePrivateWalletResult = { data: {}, error: true }
    const { logged } = accountStore

    if (this.userCreatePrivateWalletBusy || !logged) return result

    this.userCreatePrivateWalletBusy = true

    // Body: { platform: 'hyperliquid' | 'aster', remark?: string }
    const body: Record<string, string> = {
      platform: privateWalletStore.createPlatform,
    }
    if (privateWalletStore.createNickname) {
      body.remark = privateWalletStore.createNickname
    }

    const res = await baseApi.post('/wallet/create/turnkey', body)

    result.error = baseCheck(res, accountStore)
    this.userCreatePrivateWalletBusy = false

    if (result.error) return result

    // 创建成功，返回的 data 即为新钱包信息
    result.data = res.data?.data ?? {}

    // 重置创建表单
    privateWalletStore.resetCreate()

    return result
  },
  userCreatePrivateWalletBusy: false,
}