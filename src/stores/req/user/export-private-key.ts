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

function extractExportBundle(data: any): string {
  const candidates = [
    data?.exportBundle,
    data?.export_bundle,
    data?.data?.exportBundle,
    data?.data?.export_bundle,
    data?.result?.exportBundle,
    data?.result?.exportPrivateKeyResult?.exportBundle,
    data?.activity?.result?.exportPrivateKeyResult?.exportBundle,
  ]
  for (const c of candidates) {
    if (c && typeof c === 'string' && c.trim()) return c.trim()
  }
  return ''
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

      const resData = res.data?.data ?? res.data

      // 3. 从响应中取出 exportBundle 和 organizationId
      const exportBundle = extractExportBundle(res.data)
      const organizationId = extractOrganizationId(res.data)

      if (!exportBundle) {
        result.error = true
        return result
      }

      // 4. 本地解密
      const privateKeyHex = await decryptExportBundle({
        exportBundle,
        embeddedKey: keypair.privateKey,
        organizationId,
        returnMnemonic: false,
      })

      const privateKey = privateKeyHex.startsWith('0x') ? privateKeyHex : `0x${privateKeyHex}`

      result.data = { exportPrivateKeyContent: privateKey }
      merge(privateWalletStore, result.data)
    } catch (e: any) {
      result.error = true
    } finally {
      this.userExportPrivateKeyBusy = false
    }

    return result
  },
  userExportPrivateKeyBusy: false,
}
