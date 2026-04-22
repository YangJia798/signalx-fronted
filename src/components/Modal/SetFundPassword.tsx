import { useEffect } from 'react'
import { Input, message } from 'antd'
import { useAccountStore, usePrivateWalletStore, useReqStore } from '@/stores'
import { maskingAddress } from '@/utils'
import BaseModal from './Base'

const ModalSetFundPassword = () => {
  const privateWalletStore = usePrivateWalletStore()
  const accountStore = useAccountStore()
  const reqStore = useReqStore()

  const walletAddress = privateWalletStore.list[privateWalletStore.operaWalletIdx]?.address ?? ''

  const handleClose = () => {
    privateWalletStore.openSetFundPassword = false
  }

  const handleSubmit = async () => {
    if (privateWalletStore.fundPw.length < privateWalletStore.MIN_PW_LENGTH) {
      message.warning(`密码不能少于 ${privateWalletStore.MIN_PW_LENGTH} 位`)
      return
    }
    if (privateWalletStore.fundPw !== privateWalletStore.fundPwRepeat) {
      message.warning('两次输入的密码不一致')
      return
    }
    const { error } = await reqStore.userSetFundPassword(accountStore, privateWalletStore)
    if (error) return
    // 钱包登录（未绑定邮箱）时，资金密码设置完继续提示绑定邮箱
    if (!accountStore.email) {
      privateWalletStore.openBindEmail = true
    }
  }

  useEffect(() => {
    if (!privateWalletStore.openSetFundPassword) return
    privateWalletStore.resetFundPassword()
  }, [privateWalletStore.openSetFundPassword])

  return (
    <BaseModal
      title={`设置 ${walletAddress ? maskingAddress(walletAddress) : ''} 的资金密码`}
      open={privateWalletStore.openSetFundPassword}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitText='提交'
      submitDisabled={privateWalletStore.fundPw.length < privateWalletStore.MIN_PW_LENGTH || privateWalletStore.fundPwRepeat.length < privateWalletStore.MIN_PW_LENGTH}
      submitLoading={reqStore.userSetFundPasswordBusy}
    >
      {/* Warning notice */}
      <div className='d-flex align-items-center justify-content-center p-3 mb-2 text-center font-size-13'
        style={{ background: 'rgba(255, 168, 0, 0.08)', border: '1px solid rgba(255, 168, 0, 0.3)', borderRadius: '8px', color: '#ffa800', lineHeight: '1.6' }}>
        资金密码用于保护您的资金，防止未经授权的敏感操作。请妥善保管资金密码，避免泄露。
      </div>

      <div className='d-flex flex-column gap-3 mt-2'>
        <div className='d-flex flex-column gap-1'>
          <span className='color-secondary font-size-13'>资金密码</span>
          <Input.Password
            value={privateWalletStore.fundPw}
            onChange={e => privateWalletStore.fundPw = e.target.value}
            placeholder='设置资金密码'
            className='br-2'
            style={{ height: '48px' }}
          />
        </div>

        <div className='d-flex flex-column gap-1'>
          <span className='color-secondary font-size-13'>重复资金密码</span>
          <Input.Password
            value={privateWalletStore.fundPwRepeat}
            onChange={e => privateWalletStore.fundPwRepeat = e.target.value}
            placeholder='再次输入资金密码'
            className='br-2'
            style={{ height: '48px' }}
          />
        </div>

</div>
    </BaseModal>
  )
}

export default ModalSetFundPassword
