import { useState, useEffect, useRef } from 'react'
import { useLocation, Link } from "react-router-dom"
import { useTranslation } from 'react-i18next'
import { Dropdown, MenuProps } from 'antd'

import { IOutlineLogout, IOutlineMenu1 } from '@/components/icon'
import { maskingAddress } from '@/utils'
import { useAccountStore, constants } from '@/stores'
import Logo from '@/components/Logo'
import UserAvatar from '@/components/UserAvatar'
import ChangeI18n from '@/components/ChangeI18n'
import ModalLogin from '@/components/Modal/Login'
import { AccountProfile } from '@/components/Modal/AccountProfile'
const SearchOutlined = ({ className = '', style }: { className?: string, style?: any }) => (
  <svg className={className} style={style} viewBox="64 64 896 896" focusable="false" data-icon="search" width="1em" height="1em" fill="currentColor" aria-hidden="true">
    <path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"></path>
  </svg>
);
const DownOutlined = ({ className = '', style }: { className?: string, style?: any }) => (
  <svg className={className} style={style} viewBox="64 64 896 896" focusable="false" data-icon="down" width="1em" height="1em" fill="currentColor" aria-hidden="true">
    <path d="M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.4-12.7z"></path>
  </svg>
);


import './Header.scss'

const LayoutHeader = () => {
  const accountStore = useAccountStore()
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const contentRef = useRef<HTMLDivElement>(null)

  const [navBgAlpha, setNavBgAlpha] = useState(0);
  const [openProfile, setOpenProfile] = useState(false);

  const handleScroll = () => {
    const scrollY = window.scrollY;
    setNavBgAlpha(Math.min(1, scrollY / 400));
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const tradeMenuItems: MenuProps['items'] = [
    { key: '1', label: <a href="#">Hyperliquid</a> },
    { key: '2', label: <a href="#">Aster</a> },
  ]

  const realtimeMenuItems: MenuProps['items'] = [
    { key: '1', label: <a href="#">Live Feed</a> },
  ]

  const moreMenuItems: MenuProps['items'] = [
    { key: '1', label: <a href={constants.app.DOC} target="_blank">Docs</a> },
  ]

  const navItems = [
    { name: '发现', to: '/discover' },
    { name: '交易', to: '/trade/BTC' },
    { name: '监控', to: '/track-monitor' },
    { name: '跟单交易', to: '/copy-trading' },
    { name: '巨鲸', to: '/whales' },
    { name: '实时', dropdown: realtimeMenuItems },
    { name: '会员', to: '/rewards' },
    { name: '数据 API', to: '#api' },
    { name: '更多', dropdown: moreMenuItems },
  ]

  // Only English/Fallback for now since user uses i18n, but official text from screenshot is Chinese
  const isZh = i18n.resolvedLanguage?.startsWith('zh') ?? true

  return (
    <>
      <div ref={contentRef} className="position-fixed container-fluid position-top z-index-99 p-0 header-wrapper" style={{ backgroundColor: `rgba(0,0,0,${navBgAlpha > 0 ? 0.8 : 0})`, backdropFilter: navBgAlpha > 0 ? 'blur(10px)' : 'none' }}>

        {/* Main Navbar */}
        <div className='d-flex flex-wrap align-items-center justify-content-between header-main'>
          <div className="d-flex align-items-center logo-nav-group">
            <Logo className='logo-custom' />

            {/* Desktop Navigation */}
            <div className='d-none d-xl-flex gap-4 nav-links'>
              {navItems.map((item, idx) => (
                item.dropdown ? (
                  <Dropdown key={idx} menu={{ items: item.dropdown }} placement="bottom">
                    <span className="d-flex align-items-center gap-1 cursor-pointer nav-item text-white">
                      {isZh ? item.name : item.name} <DownOutlined style={{ fontSize: '10px' }} />
                    </span>
                  </Dropdown>
                ) : (
                  <Link key={idx} to={item.to || '#'} className={`d-flex nav-item text-white ${location.pathname === item.to ? 'active' : ''}`}>
                    {isZh ? item.name : item.name}
                  </Link>
                )
              ))}
            </div>
          </div>

          {/* Right Side Tools */}
          <div className="d-flex align-items-center gap-2 tools-section">
            <span className="tool-icon text-white cursor-pointer"><SearchOutlined style={{ fontSize: '18px' }} /></span>
            <ChangeI18n />


            {accountStore.logged ? (
              <div 
                className='d-flex gap-2 align-items-center cursor-pointer br-4 p-1' 
                onClick={() => setOpenProfile(true)}
              >
                <UserAvatar size={32} />
                <span className='fw-500 h6 color-white m-0 d-none d-lg-block'>
                  {accountStore.evmAddress ? maskingAddress(accountStore.evmAddress) : accountStore.email ? accountStore.email : <>{accountStore.tgLastName} {accountStore.tgFirstName}</>}
                </span>
              </div>
            ) : (
              <div className="login-btn-custom cursor-pointer" onClick={() => accountStore.openModalLogin = true}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
                </svg>
                <span>登录</span>
              </div>
            )}

            <div className="d-flex d-xl-none p-2 cursor-pointer text-white">
              <IOutlineMenu1 />
            </div>
          </div>
        </div>
      </div>

      <ModalLogin />
      <AccountProfile open={openProfile} onClose={() => setOpenProfile(false)} />
    </>
  )
}

export default LayoutHeader