import { Button, message } from 'antd';
import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next'
import { useConnectModal } from '@rainbow-me/rainbowkit'

import { constants, useAccountStore, useReqStore } from '@/stores'
import { merge, localStorage } from '@/utils'
import { ITelegram } from '@/components/icon'
import BaseModal from './Base';
import Logo from '@/components/Logo';
import { useNotification } from '@/components/Notification'
import { baseCheck, baseApi } from '@/stores/req/helper'

const ModalLogin = () => {
  const accountStore = useAccountStore()
  const reqStore = useReqStore()
  const { t } = useTranslation()
  const notification = useNotification()
  const { openConnectModal } = useConnectModal()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'verify'>('email')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleClose = () => {
    accountStore.openModalLogin = false
    setTimeout(() => {
      setStep('email')
      setCode(['', '', '', '', '', ''])
    }, 300)
  }

  const handleCodeChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleTgWebLogin = () => {
    const tg = (window as any).Telegram
    if (tg?.Login?.auth) {
      tg.Login.auth(
        { bot_id: constants.app.TG_BOT_ID, request_access: true },
        async (data: any) => {
          if (!data) return
          accountStore.tgAccountData = JSON.stringify(data)
          const { error } = await reqStore.userTgLogin(accountStore)
          if (error) return
          accountStore.openModalLogin = false
        }
      )
    }
  }

  const handleTgLogin = async (user: any) => {
    // TEST:
    //   user = {"id":5626854422,
    // "first_name":"sunbeyond",
    // "username":"sunbeyondT",
    // "photo_url":"https://t.me/i/userpic/320/4BC8DspuSxhjLCO6Y8aD8T_q5eXYDiyxfZmd6G3Z9l8bTefheWe1DXGQSozY8YTT.jpg",
    // "auth_date":1747042748,
    // "hash":"caae5f8338521fcbe5cce15f6e97c766816783aba414e618666022f5e2c5bf08"}

    accountStore.tgAccountData = JSON.stringify(user)
    const { error } = await reqStore.userTgLogin(accountStore)

    if (error) return

    accountStore.openModalLogin = false
  }

  // 针对 bot 带来的登录态
  useEffect(() => {
    // NOTE: 已登录则不处理
    if (accountStore.logged) return

    const queryParams = new URLSearchParams(location.search)
    const value = queryParams.get(constants.paramKey.loginToken) || ''

    if (!value) return

    merge(accountStore, {
      session: value,
      logged: true
    })

    // NOTE: 清除此时 url 的 param，避免刷新后再次触发
    const url = new URL(location.href)
    url.searchParams.delete(constants.paramKey.loginToken)
    window.history.replaceState({}, document.title, url.toString());
  }, [])

  // account
  useEffect(() => {
    const asyncFunc = async () => {
      const { data, error } = await reqStore.userInfo(accountStore)

      if (error) return

      // 没绑定官方邀请
      if (!data.boundOfficialReferralCode) {
        notification.open({
          message: t('notification.bindOfficialReferralCodeTitle'),
          description: <span className='d-flex flex-column gap-1'>
            {t('notification.bindOfficialReferralCodeContent')}
            <Button size='small' ghost type='primary' href={'https://app.hyperliquid.xyz/join/HYPERAIBOT'} target='_blank' className='br-4 border-w-2 px-4 fw-500 mt-2'>{t('notification.bindOfficialReferralCodeSubmit')}</Button>
          </span>,
          duration: 10
        })
      }
    }

    if (accountStore.logged) {
      accountStore.openModalLogin = false
    } else {
      return
    }

    asyncFunc()
  }, [accountStore.logged])

  // sync
  useEffect(() => {
    if (!accountStore.openModalLogin) return
    // // evm 签名信息
    // reqStore.userEvmSignMessage(accountStore)

    // 获取 tg 客户端登录时的 code
    // reqStore.userTgCode(accountStore)
  }, [accountStore.openModalLogin])

  return (
    <BaseModal
      width={440}
      title={
        <span className="d-flex align-items-center gap-2">
          <Logo mark />
          {t('login.logInToSignalxbot')}
        </span>
      }
      open={accountStore.openModalLogin}
      onClose={handleClose}
    >
      {step === 'email' ? (
        <div className="d-flex flex-column gap-3">
          {/* Email Input */}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱账号"
            className="w-100 px-4 py-3 fw-500 color-white"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '12px',
              outline: 'none',
              fontSize: '15px',
            }}
          />

          {/* Gradient Login Button */}
          <button
            className="w-100 d-flex align-items-center justify-content-center gap-2 fw-bold"
            onClick={async () => {
              if (!email) return;
              setLoading(true);
              try {
                await baseApi.post('/user/login/sendEmailCode', { email: email.trim() });
                notification.success({
                  message: 'Successfully',
                  description: 'The email verification code has been sent successfully. If you did not receive it, please check your spam folder.',
                });
                setStep('verify');
              } catch (error) {
                console.error(error);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            style={{
              background: 'linear-gradient(90deg, #e040a0 0%, #a855f7 30%, #00e5ff 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '15px',
              cursor: 'pointer',
              padding: '12px 0',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
            </svg>
            登录
          </button>

          {/* Divider */}
          <div className="d-flex align-items-center justify-content-center gap-3 py-1">
            <span style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            <span className="color-secondary font-size-13">——或者——</span>
            <span style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          </div>

          {/* Telegram Buttons Row */}
          <div className="d-flex gap-3">
            <button
              className="col d-flex align-items-center justify-content-center gap-2 fw-bold"
              onClick={handleTgWebLogin}
              style={{
                background: 'transparent',
                border: '1px solid #00e5ff',
                borderRadius: '12px',
                color: '#00e5ff',
                fontSize: '13px',
                cursor: 'pointer',
                padding: '10px 12px',
              }}
            >
              <ITelegram /> Telegram 网页版
            </button>
            <button
              className="col d-flex align-items-center justify-content-center gap-2 fw-bold"
              onClick={() => {
                window.open(`${constants.app.TG_BOT_LOGIN_URL}${accountStore.tgCode}`, '_blank');
                handleClose();
              }}
              style={{
                background: 'transparent',
                border: '1px solid #00e5ff',
                borderRadius: '12px',
                color: '#00e5ff',
                fontSize: '13px',
                cursor: 'pointer',
                padding: '10px 12px',
              }}
            >
              <ITelegram /> Telegram 桌面应用
            </button>
          </div>

          {/* Wallet Login */}
          <button
            className="w-100 d-flex align-items-center justify-content-center gap-2 fw-bold"
            onClick={() => {
              handleClose()
              if (openConnectModal) openConnectModal()
            }}
            style={{
              background: 'transparent',
              border: '1px solid #00e5ff',
              borderRadius: '12px',
              color: '#00e5ff',
              fontSize: '14px',
              cursor: 'pointer',
              padding: '10px 0',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5" />
              <path d="M18 12a1 1 0 100 2 1 1 0 000-2z" />
            </svg>
            使用钱包登录
          </button>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          <div className="mb-2">
            <span className="color-secondary font-size-14">
              请输入我们发送至 <span className="color-white fw-bold">{email}</span> 的一次性验证码
            </span>
          </div>

          <div className="d-flex justify-content-between gap-2 my-2">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={(e) => {
                  e.preventDefault();
                  const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6);
                  if (pastedData) {
                    const newCode = [...code];
                    for (let i = 0; i < pastedData.length; i++) {
                      newCode[i] = pastedData[i];
                    }
                    setCode(newCode);
                    const nextFocusIndex = Math.min(pastedData.length, 5);
                    inputRefs.current[nextFocusIndex]?.focus();
                  }
                }}
                className="text-center fw-bold color-white"
                style={{
                  width: '56px',
                  height: '66px',
                  background: 'rgba(255,255,255,0.05)',
                  border: digit ? '1px solid #00e5ff' : '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  outline: 'none',
                  fontSize: '24px',
                  transition: 'border 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid #00e5ff';
                }}
                onBlur={(e) => {
                  if (!digit) e.target.style.border = '1px solid rgba(255,255,255,0.15)';
                }}
              />
            ))}
          </div>

          <div className="mt-2">
            <span className="color-secondary font-size-13">未收到验证码？ </span>
            <span 
              className="color-white font-size-13 fw-bold pointer"
              onClick={async () => {
                if (loading) return;
                setLoading(true);
                try {
                  await baseApi.post('/user/login/sendEmailCode', { email: email.trim() });
                  notification.success({ message: '验证码已重新发送' });
                } catch (error) {
                  console.error(error);
                } finally {
                  setLoading(false);
                }
              }}
              style={{
                textDecoration: 'underline'
              }}
            >
              重新发送
            </span>
          </div>

          <button
            className="w-100 d-flex align-items-center justify-content-center gap-2 fw-bold mt-2"
            onClick={async () => {
              const fullCode = code.join('');
              if (fullCode.length < 6) return;
              setLoading(true);
              try {
                const res = await baseApi.post('/user/login/verifyEmailLogin', { email: email.trim(), code: fullCode, inviter: accountStore.senderInvitationsCode });
                
                const hasError = baseCheck(res, accountStore);
                if (hasError) return;

                const { data } = res.data;
                const session = data?.token;
                
                if (session) {
                  const accountInfo = {
                    id: data?.userId || data?.id || '',
                    email: data?.email || email,
                    tgHeadIco: data?.photoUrl || ''
                  };
                  
                  localStorage.set(constants.storageKey.ACCOUNT, accountInfo);
                  merge(accountStore, {
                    session,
                    logged: true,
                    ...accountInfo
                  });
                  
                  notification.success({ message: '登录成功' });
                  setTimeout(() => {
                    handleClose();
                  }, 500);
                } else {
                  notification.error({ message: '验证失败，未获取到登录信息' });
                }
              } catch (error: any) {
                console.error(error);
                const errorMsg = error?.response?.data?.msg || '验证码错误';
                message.error(errorMsg);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading || code.join('').length < 6}
            style={{
              background: code.join('').length === 6 ? 'linear-gradient(90deg, #e040a0 0%, #a855f7 30%, #00e5ff 100%)' : 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '12px',
              color: code.join('').length === 6 ? '#fff' : 'rgba(255,255,255,0.5)',
              fontSize: '15px',
              cursor: code.join('').length === 6 ? 'pointer' : 'not-allowed',
              padding: '12px 0',
            }}
          >
            {loading ? '正在验证...' : '确认'}
          </button>
        </div>
      )}
    </BaseModal>
  )
}

export default ModalLogin