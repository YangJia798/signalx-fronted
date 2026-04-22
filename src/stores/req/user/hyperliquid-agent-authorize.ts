import { baseCheck, baseApi } from '@/stores/req/helper'
import { TAccountStore } from '@/stores'

type UserHyperliquidAgentAuthorizeParams = {
  wallet_id: string
  agent_name?: string
  force?: boolean
}

type UserHyperliquidAgentAuthorizeResult = {
  data: Record<string, any>
  error: boolean
}

export type TUserHyperliquidAgentAuthorize = {
  userHyperliquidAgentAuthorize: (accountStore: TAccountStore, params: UserHyperliquidAgentAuthorizeParams) => Promise<UserHyperliquidAgentAuthorizeResult>
  userHyperliquidAgentAuthorizeBusy: boolean
}

export const userHyperliquidAgentAuthorize: TUserHyperliquidAgentAuthorize = {
  async userHyperliquidAgentAuthorize(accountStore, params) {
    const result: UserHyperliquidAgentAuthorizeResult = { data: {}, error: true }
    const { logged } = accountStore

    if (this.userHyperliquidAgentAuthorizeBusy || !logged || !params.wallet_id) return result

    this.userHyperliquidAgentAuthorizeBusy = true

    const res = await baseApi.post('/wallet/hyperliquid/agent/authorize', {
      wallet_id: params.wallet_id,
      agent_name: params.agent_name,
      force: params.force ?? true,
    })

    result.error = baseCheck(res, accountStore)
    this.userHyperliquidAgentAuthorizeBusy = false

    if (result.error) return result

    result.data = res.data?.data ?? {}

    return result
  },
  userHyperliquidAgentAuthorizeBusy: false,
}
