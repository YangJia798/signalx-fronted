import { useEffect, useRef, useState } from 'react';
import { Input, Button, message } from 'antd';
import { useTranslation } from 'react-i18next'
import { decryptExportBundle } from '@turnkey/crypto'

import { useAccountStore, usePrivateWalletStore, useReqStore } from '@/stores';
import { baseApi } from '@/stores/req/helper';
import BaseModal from './Base';

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
)

const EmailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6"/>
  </svg>
)

const CheckCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#52c41a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)

const ROW_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  cursor: 'pointer',
  padding: '14px 16px',
}

const COUNTDOWN = 60

type Phase = 'form' | 'paste' | 'reveal'

const ModalExportPrivateKey = () => {
  const privateWalletStore = usePrivateWalletStore()
  const reqStore = useReqStore()
  const accountStore = useAccountStore()
  const { t } = useTranslation()
  const [sendLoading, setSendLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [phase, setPhase] = useState<Phase>('form')
  const [decrypting, setDecrypting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fundPasswordOk = privateWalletStore.fundPasswordSet
  const emailOk = !!accountStore.email
  const prereqsMet = fundPasswordOk && emailOk

  const handleClose = () => {
    privateWalletStore.openExportPrivateKey = false
  }

  const handleSendCode = async () => {
    setSendLoading(true)
    try {
      await baseApi.post('/wallet/export/send-code', {})
      message.success('验证码已发送，请查收邮件')
      setCountdown(COUNTDOWN)
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch {
      message.error('发送失败，请稍后重试')
    } finally {
      setSendLoading(false)
    }
  }

  const handleSubmit = async () => {
    const { error } = await reqStore.userExportPrivateKey(accountStore, privateWalletStore)
    if (error) return
    setPhase('paste')
  }

  const handleReveal = async () => {
    const bundle = privateWalletStore.exportBundleInput.trim()
    if (!bundle) {
      message.warning('请粘贴加密私钥')
      return
    }
    setDecrypting(true)
    try {
      const privateKeyHex = await decryptExportBundle({
        exportBundle: bundle,
        embeddedKey: privateWalletStore.exportKeypairPrivateKey,
        organizationId: privateWalletStore.exportOrganizationId,
        returnMnemonic: false,
      })
      const privateKey = privateKeyHex.startsWith('0x') ? privateKeyHex : `0x${privateKeyHex}`
      privateWalletStore.exportPrivateKeyContent = privateKey
      setPhase('reveal')
    } catch {
      message.error('解密失败，请确认粘贴的内容正确')
    } finally {
      setDecrypting(false)
    }
  }

  useEffect(() => {
    if (!privateWalletStore.openExportPrivateKey) return
    privateWalletStore.resetExportPrivateKey()
    setPhase('form')
    setCountdown(0)
  }, [privateWalletStore.openExportPrivateKey])

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  // Prereq view
  if (!prereqsMet) {
    return (
      <BaseModal
        title={t('common.exportPrivateKey', '导出私钥')}
        open={privateWalletStore.openExportPrivateKey}
        onClose={handleClose}
      >
        <div className='d-flex align-items-center justify-content-center p-3 mb-3 text-center font-size-13'
          style={{ background: 'rgba(255, 168, 0, 0.08)', border: '1px solid rgba(255, 168, 0, 0.3)', borderRadius: '8px', color: '#ffa800', lineHeight: '1.6' }}>
          需要满足以下前置要求才能继续
        </div>

        <div className='d-flex flex-column gap-2'>
          <div
            className='d-flex align-items-center justify-content-between'
            style={{ ...ROW_STYLE, cursor: fundPasswordOk ? 'default' : 'pointer' }}
            onClick={() => { if (!fundPasswordOk) privateWalletStore.openSetFundPassword = true }}
          >
            <div className='d-flex align-items-center gap-2 color-white fw-500 font-size-14'>
              <span className='color-secondary'><LockIcon /></span>
              设置资金密码
            </div>
            {fundPasswordOk ? <CheckCircle /> : <span className='color-secondary'><ChevronRight /></span>}
          </div>

          {emailOk ? (
            <div className='d-flex align-items-center justify-content-between' style={{ ...ROW_STYLE, cursor: 'default' }}>
              <div className='d-flex align-items-center gap-2 color-white fw-500 font-size-14'>
                <span className='color-secondary'><EmailIcon /></span>
                {accountStore.email}
              </div>
              <CheckCircle />
            </div>
          ) : (
            <div
              className='d-flex align-items-center justify-content-between'
              style={ROW_STYLE}
              onClick={() => { privateWalletStore.openBindEmail = true }}
            >
              <div className='d-flex align-items-center gap-2 color-white fw-500 font-size-14'>
                <span className='color-secondary'><EmailIcon /></span>
                绑定邮箱登录
              </div>
              <span className='color-secondary'><ChevronRight /></span>
            </div>
          )}
        </div>
      </BaseModal>
    )
  }

  // Paste bundle view (图1)
  if (phase === 'paste') {
    return (
      <BaseModal
        title={t('common.exportPrivateKey', '导出私钥')}
        open={privateWalletStore.openExportPrivateKey}
        onClose={handleClose}
        onSubmit={handleReveal}
        submitText='显示私钥'
        submitDisabled={!privateWalletStore.exportBundleInput.trim()}
        submitLoading={decrypting}
      >
        <div className='d-flex flex-column gap-3'>
          <div className='p-3 font-size-13 text-center'
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.7' }}>
            加密恢复私钥已发送至 <span className='color-white fw-500'>{accountStore.email}</span>，请粘贴到下方解密，从而获取钱包私钥。
          </div>

          <div className='d-flex flex-column gap-1'>
            <span className='color-secondary font-size-13'>加密私钥</span>
            <Input.TextArea
              value={privateWalletStore.exportBundleInput}
              onChange={e => privateWalletStore.exportBundleInput = e.target.value}
              placeholder='请粘贴邮件中的加密私钥'
              className='br-2'
              autoSize={{ minRows: 4 }}
            />
          </div>

          <div className='d-flex flex-column gap-1 font-size-12'
            style={{ color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' }}>
            <div>• 请勿在公共场所或不安全设备上操作</div>
            <div>• 私钥一旦泄露，资产将面临风险</div>
            <div>• 解密过程在本地完成，不会上传至服务器</div>
          </div>
        </div>
      </BaseModal>
    )
  }

  // Reveal view (图2)
  if (phase === 'reveal') {
    return (
      <BaseModal
        title={t('common.exportPrivateKey', '导出私钥')}
        open={privateWalletStore.openExportPrivateKey}
        onClose={handleClose}
        onSubmit={handleClose}
        submitText='完成'
      >
        <div className='d-flex flex-column gap-3'>
          <div className='p-3 font-size-13 text-center'
            style={{ background: 'rgba(255, 168, 0, 0.08)', border: '1px solid rgba(255, 168, 0, 0.3)', borderRadius: '8px', color: '#ffa800', lineHeight: '1.6' }}>
            你的私钥是你钱包的钥匙。将其保存在安全的地方。
          </div>

          <div className='d-flex flex-column gap-2 bg-gray-alpha-4 p-3 br-1'>
            <span className='color-secondary font-size-13'>Wallet Private Key</span>
            <Input.TextArea value={privateWalletStore.exportPrivateKeyContent} className='br-2' readOnly autoSize />
            <Button size='small' ghost onClick={() => {
              navigator.clipboard.writeText(privateWalletStore.exportPrivateKeyContent)
              message.success(t('message.privateKeyCopied', '私钥已复制'))
            }}>复制私钥</Button>
          </div>
        </div>
      </BaseModal>
    )
  }

  // Form view (default)
  return (
    <BaseModal
      title={t('common.exportPrivateKey', '导出私钥')}
      open={privateWalletStore.openExportPrivateKey}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitText='提交验证'
      submitDisabled={
        privateWalletStore.exportFundPw.length < privateWalletStore.MIN_PW_LENGTH ||
        privateWalletStore.exportEmailCode.length < 6
      }
      submitLoading={reqStore.userExportPrivateKeyBusy}
    >
      <div className='d-flex flex-column gap-3 mt-1'>
        <div className='d-flex flex-column gap-1'>
          <span className='color-secondary font-size-13'>资金密码</span>
          <Input.Password
            value={privateWalletStore.exportFundPw}
            onChange={e => privateWalletStore.exportFundPw = e.target.value}
            className='br-2'
            style={{ height: '48px' }}
          />
        </div>

        <div className='d-flex flex-column gap-1'>
          <span className='color-secondary font-size-13'>邮箱验证码</span>
          <Input
            value={privateWalletStore.exportEmailCode}
            onChange={e => privateWalletStore.exportEmailCode = e.target.value}
            className='br-2'
            style={{ height: '48px' }}
            suffix={
              <Button
                type='link'
                size='small'
                loading={sendLoading}
                disabled={countdown > 0}
                onClick={handleSendCode}
                className='p-0 fw-500'
                style={{ color: countdown > 0 ? 'rgba(255,255,255,0.3)' : '#00e5ff', fontSize: '13px' }}
              >
                {countdown > 0 ? `${countdown}s 后重发` : '发送验证码'}
              </Button>
            }
          />
        </div>
      </div>
    </BaseModal>
  )
}

export default ModalExportPrivateKey;
