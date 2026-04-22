import { baseCheck, baseApi } from '@/stores/req/helper'
import { TAccountStore, constants } from '@/stores'
import { localStorage } from '@/utils'

export type TUserBindEmail = {
  userSendBindEmailCode: (accountStore: TAccountStore, email: string) => Promise<{ error: boolean }>
  userSendBindEmailCodeBusy: boolean
  userVerifyBindEmail: (accountStore: TAccountStore, email: string, code: string) => Promise<{ error: boolean }>
  userVerifyBindEmailBusy: boolean
}

export const userBindEmail: TUserBindEmail = {
  async userSendBindEmailCode(accountStore, email) {
    const result = { error: true }
    if (this.userSendBindEmailCodeBusy || !accountStore.logged) return result
    this.userSendBindEmailCodeBusy = true
    const res = await baseApi.post('/wallet/bind-email/send-code', { email })
    result.error = baseCheck(res, accountStore)
    this.userSendBindEmailCodeBusy = false
    return result
  },
  userSendBindEmailCodeBusy: false,

  async userVerifyBindEmail(accountStore, email, code) {
    const result = { error: true }
    if (this.userVerifyBindEmailBusy || !accountStore.logged) return result
    this.userVerifyBindEmailBusy = true
    const res = await baseApi.post('/wallet/bind-email', { email, code })
    result.error = baseCheck(res, accountStore)
    this.userVerifyBindEmailBusy = false
    if (result.error) return result
    accountStore.email = email
    const saved = localStorage.get(constants.storageKey.ACCOUNT) || {}
    localStorage.set(constants.storageKey.ACCOUNT, { ...saved, email })
    return result
  },
  userVerifyBindEmailBusy: false
}
