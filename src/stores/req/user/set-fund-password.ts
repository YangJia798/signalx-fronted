import { baseCheck, baseApi } from '@/stores/req/helper'
import { TAccountStore, TPrivateWalletStore } from '@/stores'

export type TUserSetFundPassword = {
  userSetFundPassword: (accountStore: TAccountStore, privateWalletStore: TPrivateWalletStore) => Promise<{ error: boolean }>
  userSetFundPasswordBusy: boolean
}

export const userSetFundPassword: TUserSetFundPassword = {
  async userSetFundPassword(accountStore, privateWalletStore) {
    const result = { error: true }
    if (this.userSetFundPasswordBusy || !accountStore.logged) return result

    this.userSetFundPasswordBusy = true

    const res = await baseApi.post('/account/set-fund-pwd', {
      password: privateWalletStore.fundPw,
      confirmPassword: privateWalletStore.fundPwRepeat,
      hint: privateWalletStore.fundPwPrompt
    })

    result.error = baseCheck(res, accountStore)
    this.userSetFundPasswordBusy = false

    if (result.error) return result

    privateWalletStore.fundPasswordSet = true
    privateWalletStore.openSetFundPassword = false

    return result
  },
  userSetFundPasswordBusy: false
}
