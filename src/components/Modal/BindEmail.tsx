import { useEffect, useRef, useState } from 'react'
import { Button, message } from 'antd'
import { useAccountStore, usePrivateWalletStore, useReqStore } from '@/stores'
import { baseApi } from '@/stores/req/helper'
import BaseModal from './Base'

const ModalBindEmail = () => {
  const privateWalletStore = usePrivateWalletStore()
  const accountStore = useAccountStore()
  const reqStore = useReqStore()

  const [step, setStep] = useState<'email' | 'verify'>('email')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [sendLoading, setSendLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleClose = () => {
    privateWalletStore.openBindEmail = false
  }

  const handleCodeChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSendCode = async () => {
    const email = privateWalletStore.bindEmailAddress.trim()
    if (!email) return
    setSendLoading(true)
    try {
      await baseApi.post('/user/bind-email/sendCode', { email })
      message.success('验证码已发送，请查收邮件')
      setStep('verify')
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } catch {
      message.error('发送失败，请稍后重试')
    } finally {
      setSendLoading(false)
    }
  }

  const handleVerify = async () => {
    const fullCode = code.join('')
    if (fullCode.length < 6) return
    const { error } = await reqStore.userVerifyBindEmail(accountStore, privateWalletStore.bindEmailAddress.trim(), fullCode)
    if (error) return
    message.success('邮箱绑定成功')
    privateWalletStore.openBindEmail = false
  }

  useEffect(() => {
    if (!privateWalletStore.openBindEmail) return
    privateWalletStore.resetBindEmail()
    setStep('email')
    setCode(['', '', '', '', '', ''])
  }, [privateWalletStore.openBindEmail])

  useEffect(() => {
    if (step === 'verify') {
      const timer = setTimeout(() => inputRefs.current[0]?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [step])

  const INPUT_STYLE: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '12px',
    outline: 'none',
    fontSize: '15px',
    color: '#fff',
    width: '100%',
    padding: '12px 16px',
  }

  return (
    <BaseModal
      title='绑定邮箱登录'
      open={privateWalletStore.openBindEmail}
      onClose={handleClose}
    >
      {step === 'email' ? (
        <div className='d-flex flex-column gap-3'>
          <input
            type='email'
            value={privateWalletStore.bindEmailAddress}
            onChange={e => privateWalletStore.bindEmailAddress = e.target.value}
            placeholder='请输入邮箱地址'
            style={INPUT_STYLE}
          />
          <Button
            type='primary'
            loading={sendLoading}
            disabled={!privateWalletStore.bindEmailAddress.trim()}
            onClick={handleSendCode}
            className='w-100 fw-bold br-4'
            style={{ height: '48px', fontSize: '15px' }}
          >
            发送验证码
          </Button>
        </div>
      ) : (
        <div className='d-flex flex-column gap-3'>
          <span className='color-secondary font-size-14'>
            请输入我们发送至 <span className='color-white fw-bold'>{privateWalletStore.bindEmailAddress}</span> 的一次性验证码
          </span>

          <div className='d-flex justify-content-between gap-2 my-2'>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type='text'
                inputMode='numeric'
                maxLength={1}
                value={digit}
                onChange={e => handleCodeChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                style={{
                  width: '46px',
                  height: '52px',
                  textAlign: 'center',
                  fontSize: '22px',
                  fontWeight: 700,
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${digit ? 'rgba(168,85,247,0.7)' : 'rgba(255,255,255,0.15)'}`,
                  borderRadius: '10px',
                  color: '#fff',
                  outline: 'none',
                }}
              />
            ))}
          </div>

          <Button
            type='primary'
            loading={reqStore.userVerifyBindEmailBusy}
            disabled={code.join('').length < 6}
            onClick={handleVerify}
            className='w-100 fw-bold br-4'
            style={{ height: '48px', fontSize: '15px' }}
          >
            确认绑定
          </Button>

          <Button type='link' className='p-0' onClick={() => { setStep('email'); setCode(['', '', '', '', '', '']) }}>
            返回修改邮箱
          </Button>
        </div>
      )}
    </BaseModal>
  )
}

export default ModalBindEmail
