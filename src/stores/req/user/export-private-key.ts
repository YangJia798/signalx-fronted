import { generateP256KeyPair, decryptExportBundle } from '@turnkey/crypto'

import { merge } from '@/utils'
import { baseCheck, baseApi } from '@/stores/req/helper'
import { TAccountStore, TPrivateWalletStore } from '@/stores'

type UserExportPrivateKeyResult = {
  data: Record<string, any>,
  error: boolean
}

export type TUserExportPrivateKey = {
  userExportPrivateKey: (accountStore: TAccountStore, privateWalletStore: TPrivateWalletStore) => Promise<UserExportPrivateKeyResult>
  userExportPrivateKeyBusy: boolean
}


function extractOrganizationId(data: any): string {
  return (
    data?.organizationId ??
    data?.organization_id ??
    data?.data?.organizationId ??
    data?.data?.organization_id ??
    ''
  )
}

export const userExportPrivateKey: TUserExportPrivateKey = {
  async userExportPrivateKey(accountStore, privateWalletStore) {
    const result: UserExportPrivateKeyResult = { data: {}, error: true }
    if (this.userExportPrivateKeyBusy || !accountStore.logged) return result

    this.userExportPrivateKeyBusy = true

    try {
      // 1. 生成本地 P-256 临时密钥对
      const keypair = generateP256KeyPair()

      const walletId = privateWalletStore.list[privateWalletStore.operaWalletIdx]?.walletId ?? ''

      // 2. 提交导出请求
      const res = await baseApi.post('/wallet/export', {
        id: walletId,
        fund_password: privateWalletStore.exportFundPw,
        email_code: privateWalletStore.exportEmailCode,
        target_public_key: keypair.publicKeyUncompressed,
      })

      result.error = baseCheck(res, accountStore)
      if (result.error) return result

      // 3. 从响应中取出 organizationId，存储 keypair.privateKey 供后续解密
      const organizationId = extractOrganizationId(res.data)

      merge(privateWalletStore, {
        exportKeypairPrivateKey: keypair.privateKey,
        exportOrganizationId: organizationId,
      })

      result.data = { phase: 'paste' }
    } catch (e: any) {
      result.error = true
    } finally {
      this.userExportPrivateKeyBusy = false
    }

    return result
  },
  userExportPrivateKeyBusy: false,
}
