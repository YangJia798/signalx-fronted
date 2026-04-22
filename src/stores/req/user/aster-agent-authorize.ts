import { baseCheck, baseApi } from '@/stores/req/helper'
import { TAccountStore } from '@/stores'

type UserAsterAgentAuthorizeParams = {
  wallet_id: string
  agent_name?: string
  ip_whitelist?: string
  expired?: number
  can_spot_trade?: boolean
  can_perp_trade?: boolean
  can_withdraw?: boolean
  builder?: string
  max_fee_rate?: string
  builder_name?: string
  force?: boolean
}

type UserAsterAgentAuthorizeResult = {
  data: Record<string, any>
  error: boolean
}

export type TUserAsterAgentAuthorize = {
  userAsterAgentAuthorize: (accountStore: TAccountStore, params: UserAsterAgentAuthorizeParams) => Promise<UserAsterAgentAuthorizeResult>
  userAsterAgentAuthorizeBusy: boolean
}

export const userAsterAgentAuthorize: TUserAsterAgentAuthorize = {
  async userAsterAgentAuthorize(accountStore, params) {
    const result: UserAsterAgentAuthorizeResult = { data: {}, error: true }
    const { logged } = accountStore

    if (this.userAsterAgentAuthorizeBusy || !logged || !params.wallet_id) return result

    this.userAsterAgentAuthorizeBusy = true

    const res = await baseApi.post('/wallet/aster/agent/authorize', {
      wallet_id: params.wallet_id,
      agent_name: params.agent_name,
      ip_whitelist: params.ip_whitelist,
      expired: params.expired,
      can_spot_trade: params.can_spot_trade ?? false,
      can_perp_trade: params.can_perp_trade ?? true,
      can_withdraw: params.can_withdraw ?? false,
      builder: params.builder,
      max_fee_rate: params.max_fee_rate,
      builder_name: params.builder_name,
      force: params.force ?? true,
    })

    result.error = baseCheck(res, accountStore)
    this.userAsterAgentAuthorizeBusy = false

    if (result.error) return result

    result.data = res.data?.data ?? {}

    return result
  },
  userAsterAgentAuthorizeBusy: false,
}
