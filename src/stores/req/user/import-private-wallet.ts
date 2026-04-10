import { baseCheck, baseApi } from '@/stores/req/helper'
import { TAccountStore, TPrivateWalletStore } from '@/stores'

type UserImportPrivateWalletResult = {
  data: Record<string, any>,
  error: boolean
}

export type TUserImportPrivateWallet = {
  userImportPrivateWallet: (accountStore: TAccountStore, privateWalletStore: TPrivateWalletStore) => Promise<UserImportPrivateWalletResult>
  userImportPrivateWalletBusy: boolean
}

export const userImportPrivateWallet: TUserImportPrivateWallet = {
  async userImportPrivateWallet(accountStore, privateWalletStore) {
    const result: UserImportPrivateWalletResult = { data: {}, error: true }
    const { logged } = accountStore

    if (this.userImportPrivateWalletBusy || !logged) return result

    this.userImportPrivateWalletBusy = true

    // POST /wallet/import
    // Body: { wallet_provider, address, api_wallet_address, api_secret_key, remark? }
    const body: Record<string, string> = {
      wallet_provider: privateWalletStore.importWalletProvider,
      address: privateWalletStore.importAddress,
      api_wallet_address: privateWalletStore.importApiWalletAddress,
      api_secret_key: privateWalletStore.importApiSecretKey,
    }
    if (privateWalletStore.importNickname) {
      body.remark = privateWalletStore.importNickname
    }

    const res = await baseApi.post('/wallet/import', body)

    result.error = baseCheck(res, accountStore)
    this.userImportPrivateWalletBusy = false

    if (result.error) return result

    // 导入成功，返回的 data 即为钱包信息（由调用方刷新列表）
    result.data = res.data?.data ?? {}

    // 重置导入表单
    privateWalletStore.resetImport()

    return result
  },
  userImportPrivateWalletBusy: false,
}
