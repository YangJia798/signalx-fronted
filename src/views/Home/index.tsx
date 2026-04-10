import { Button, message } from 'antd'
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { isAddress } from 'viem'

import SideButtonIcon from '@/components/Side/ButtonIcon'
import { useHomeStore, useReqStore, useTrackingCreateStore, useCopyTradingStore, useDiscoverTradingStatisticsStore, useDiscoverStore, useAccountStore, useDiscoverRecommendStore } from '@/stores'
import { IOutlineArrowRight1, IOutlineMonitor, IOutlineChart2, IOutlineShare } from '@/components/icon'
import { formatNumber } from '@/utils'
import ModalCreateCopyTrading from '@/components/Modal/CreateCopyTrading'
import InputSearch from '@/components/Input/Search'
import PositionItemAddress from '@/components/PositionItem/Address'
import Busy from '@/components/Busy'
import ModalTradingStatistics from '@/components/Modal/TradingStatistics'
import TrackingCreateTrack from '@/components/Modal/TrackingCreateTrack'

import IBrainIcon1 from '@/assets/image/view/Home/brain/icon-1.svg?react'
import IBrainIcon2 from '@/assets/image/view/Home/brain/icon-2.svg?react'
import IBrainIcon3 from '@/assets/image/view/Home/brain/icon-3.svg?react'
import IBrainIcon4 from '@/assets/image/view/Home/brain/icon-4.svg?react'

import ITriple1 from '@/assets/image/view/Home/brain/triple-1.png'
import ITriple2 from '@/assets/image/view/Home/brain/triple-2.png'

import IFeatureCover1 from '@/assets/image/view/Home/feature/cover-1.png'
import IFeatureCover2 from '@/assets/image/view/Home/feature/cover-2.png'
import IFeatureCover3 from '@/assets/image/view/Home/feature/cover-3.png'

import IMainCover from '@/assets/image/view/Home/main/cover.png'
import PositionItemCommonPnl from '@/components/PositionItem/CommonPnl';

import './style.scss'

const Home = () => {
  const accountStore = useAccountStore()
  const discoverStore = useDiscoverStore()
  const reqStore = useReqStore()
  const discoverRecommendStore = useDiscoverRecommendStore()
  const copyTradingStore = useCopyTradingStore()
  const trackingCreateStore = useTrackingCreateStore()
  const discoverTradingStatisticsStore = useDiscoverTradingStatisticsStore()

  const { t, i18n } = useTranslation()
  const navigate = useNavigate();

  const handleSearchByAddress = async () => {
    const address = discoverStore.searchAddressInput

    if (!isAddress(address)) {
      message.error(t('message.pleaseInputAddress'))
      return
    }
    discoverStore.resetSearch()
    navigate(`/trader/${address}`)
  }

  const handleDiscoverRecommend = async () => {
    // NOTE: 由这里控制，所以不用再单独缓存保存配置
    switch (i18n.resolvedLanguage) {
      case 'zh-Hans':
      case 'zh-Hant':
        discoverRecommendStore.selectedLanguage = 'zh'
        break
      case 'en':
      default:
        discoverRecommendStore.selectedLanguage = 'en'
    }

    await reqStore.discoverRecommend(accountStore, discoverRecommendStore)
  }

  const handleOpenQuickerCreateCopyTrade = (item?: any) => {
    copyTradingStore.quickerOpenPositionTargetAddress = item.address

    // NOTE: 同步完，最后打开弹窗
    copyTradingStore.openCopyTradingTarget = true
  }

  const handleOpenTradingStatistics = (item: any) => {
    discoverTradingStatisticsStore.address = item.address

    discoverTradingStatisticsStore.openModal = true
  }

  const handleOpenCreateTrackAddress = async (item: any) => {
    // sync quick
    trackingCreateStore.quickCreateTrackAddress = item.address

    trackingCreateStore.openCreateTracking = true
  }

  // init
  useEffect(() => {
    const asyncFunc = async () => {
      if (window.particlesJS) {
        window.particlesJS('particlesBg', {
          "particles": {
            "number": { "value": 100, "density": { "enable": true, "value_area": 800 } },
            "color": { "value": "#ffffff" },
            "shape": { "type": "circle", "stroke": { "width": 0, "color": "#000000" } },
            "opacity": { "value": 0.5, "random": true, "anim": { "enable": true, "speed": 1, "opacity_min": 0.1, "sync": false } },
            "size": { "value": 3, "random": true, "anim": { "enable": true, "speed": 2, "size_min": 0.1, "sync": false } },
            "line_linked": { "enable": false },
            "move": { "enable": true, "speed": 1, "direction": "none", "random": true, "straight": false, "out_mode": "out", "bounce": false }
          },
          "interactivity": {
            "detect_on": "canvas",
            "events": { "onhover": { "enable": true, "mode": "bubble" }, "onclick": { "enable": true, "mode": "push" }, "resize": true },
            "modes": { "bubble": { "distance": 200, "size": 6, "duration": 2, "opacity": 1, "speed": 3 }, "push": { "particles_nb": 4 } }
          },
          "retina_detect": true
        });
      }
      await handleDiscoverRecommend()
    }

    asyncFunc()
    return () => {
      discoverRecommendStore.reset()
    }
  }, [])

  // 语言切换的影响
  useEffect(() => {
    const asyncFunc = async () => {
      await handleDiscoverRecommend()
    }

    asyncFunc()
  }, [i18n.resolvedLanguage])

  return (
    <>
      <div className="container-fluid px-0 d-flex flex-column align-items-center py-5 main-cover position-relative">
        <div id="particlesBg" className="position-absolute w-100 h-100" style={{ top: 0, left: 0, zIndex: 0 }}></div>

        <div className="container-xl d-flex flex-column flex-lg-row align-items-center justify-content-between px-3 px-md-4 gap-4 my-5 py-5 position-relative z-index-9 w-100">

          {/* Left Content */}
          <div className="d-flex flex-column gap-4 align-items-lg-start align-items-center text-lg-start text-center col-12 col-lg-6 mb-4">
            <h1 className="fw-500 text-white m-0" style={{ fontSize: '2.5rem', letterSpacing: '1px' }}>Signalxbot</h1>
            <h3 className="color-white fw-bold m-0" style={{ lineHeight: '1.5' }}>
              AI 驱动的全链 DEX永续合约入口：数据分析、巨鲸追踪、智能跟单、策略交易
            </h3>

            <div className="w-100 d-flex justify-content-lg-start justify-content-center mt-3">
              <InputSearch
                className='col-12 col-lg-10 hero-search-bar'
                value={discoverStore.searchAddressInput}
                placeholder='搜索地址 (Ctrl+K)'
                onChange={(value) => discoverStore.searchAddressInput = value}
                onSearch={() => handleSearchByAddress()}
              />
            </div>

            <div className="d-flex flex-wrap gap-3 justify-content-lg-start justify-content-center mt-3">
              <Button type="primary" size="large" className="hero-btn-primary px-4 fw-bold border-0" style={{ borderRadius: '25px', background: 'linear-gradient(90deg, #00d2ff 0%, #3a7bd5 100%)' }}>
                去交易
              </Button>
              <Button ghost size="large" className="hero-btn-outline px-4 fw-bold" style={{ borderRadius: '25px', borderColor: '#00d2ff', color: '#00d2ff' }}>
                Telegram 监控机器人
              </Button>
              <Button ghost size="large" className="hero-btn-outline px-4 fw-bold" style={{ borderRadius: '25px', borderColor: '#00d2ff', color: '#00d2ff' }}>
                Telegram 交易机器人
              </Button>
            </div>

            <div className="d-flex flex-wrap gap-2 justify-content-lg-start justify-content-center align-items-center mt-5 store-links">
              <a href="#" className="d-flex align-items-center gap-2 px-4 py-2 hero-store-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5v-17c0-.98.74-1.63 1.63-1.63.33 0 .66.07.96.22l12.59 7.15c.66.38.66.99 0 1.36L5.59 17.76c-.3.15-.63.22-.96.22-.89 0-1.63-.65-1.63-1.63zm18.3 -8.5l-2.3 1.3 -2.7 -2.7 2.7 -2.7 2.3 1.3c.72.41.72 1.08 0 1.5l0 .6 .7zm-14.3 5.3l10.3 -5.8 -2.4-2.4 -7.9 8.2zM4.1 3.5l7.9 7.9 2.4-2.4 L4.1 3.5z" /></svg>
                <span className="fw-bold">Google Play</span>
              </a>
              <a href="#" className="d-flex align-items-center gap-2 px-4 py-2 hero-store-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 13c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM12 21.5c-3.1 0-5.8-1.5-7.4-3.8l-1.3 1.3c-.3.3-.8.3-1.1 0-.3-.3-.3-.8 0-1.1l1.3-1.3c-1.3-2-2.1-4.3-2.1-6.8h17.9c0-2.5-.8-4.8-2.1-6.8l1.3-1.3c.3-.3.3-.8 0-1.1s-.8-.3-1.1 0l-1.3 1.3c-1.6-2.3-4.3-3.8-7.4-3.8z" /></svg>
                <span className="fw-bold">Android</span>
              </a>
              <a href="#" className="d-flex align-items-center gap-2 px-4 py-2 hero-store-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.1 2.48-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.89 1.22-2.14 1.08-3.38-1.06.04-2.34.71-3.1 1.6-.68.79-1.28 2.06-1.12 3.28 1.19.09 2.39-.61 3.14-1.5z" /></svg>
                <span className="fw-bold">Apple Store</span>
              </a>
              <a href="#" className="d-flex align-items-center gap-2 px-4 py-2 hero-store-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.1 2.48-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.89 1.22-2.14 1.08-3.38-1.06.04-2.34.71-3.1 1.6-.68.79-1.28 2.06-1.12 3.28 1.19.09 2.39-.61 3.14-1.5z" /></svg>
                <span className="fw-bold">TestFlight</span>
              </a>
            </div>
          </div>

          {/* Right Graphic */}
          <div className="col-12 col-lg-6 d-flex justify-content-center justify-content-lg-end position-relative">
            <img src={IMainCover} className="hero-graphic w-100" style={{ maxWidth: '650px', objectFit: 'contain' }} />
          </div>
        </div>

        <div className="container-xl d-flex flex-column px-3 px-md-4 mt-5 position-relative z-index-9 w-100">
          <Busy spinning={reqStore.discoverRecommendBusy}>
            <div className='d-flex flex-column mt-5 gap-3 gap-md-4 position-relative z-index-9'>
              <div className='d-flex align-items-center justify-content-between'>
                <h5 className="fw-bold">{t('common.hotAddress')}</h5>
                <Link to='/discover'><IOutlineArrowRight1 className='zoom-80' /></Link>
              </div>
              <div className='marquee-container mt-3 py-2'>
                <div className='marquee-track'>
                  {
                    [...discoverRecommendStore.list, ...discoverRecommendStore.list, ...discoverRecommendStore.list].map((item, idx) => (
                      <div key={idx} className='d-flex address-card-custom p-4 gap-4'>
                        <div className='d-flex flex-column col-12 gap-1'>
                          <div className='d-flex'>
                            <div className='d-flex flex-wrap gap-1'>
                              <PositionItemAddress avatar item={item} className='h6 fw-bold color-white' />
                              {item.note && <span className='color-secondary'>({item.note})</span>}
                            </div>
                            <div className='d-flex gap-3 align-items-start justify-content-end ms-auto'>
                              {
                                [
                                  { icon: <IOutlineChart2 className='zoom-85' />, title: t('common.tradingStatistics'), onClick: () => handleOpenTradingStatistics(item) },
                                  { icon: <IOutlineMonitor className='zoom-85' />, title: t('common.trackAddress'), logged: true, onClick: () => handleOpenCreateTrackAddress(item) },
                                  { icon: <IOutlineShare className='zoom-85' />, title: t('common.copyTrading'), logged: true, onClick: () => handleOpenQuickerCreateCopyTrade(item) },
                                ].map((actionItem, actionIdx) => <SideButtonIcon key={actionIdx} title={actionItem.title} onClick={actionItem.onClick} logged={actionItem.logged} icon={actionItem.icon} />)
                              }
                            </div>
                          </div>
                          <div className='d-flex flex-wrap'>
                            {
                              [
                                { label: t('common.accountTotalValue'), className: 'col-12', content: <span className='h5 fw-bold color-white'>$ {formatNumber(item.accountTotalValue)}</span> },
                                { label: t('common.pnl'), content: <PositionItemCommonPnl value={item.pnl} /> },
                                { label: t('common.tradesCount'), content: <>{formatNumber(item.tradesCount)}</> },
                                { label: t('common.winRate'), content: <>{item.tradesCount > 0 ? item.winRate : '-'} %</> },
                                {
                                  label: t('common.aiTags'), className: 'col-12',
                                  content: <div className='d-flex flex-wrap gap-2 mt-1'>
                                    {
                                      item.tags?.map((_tag, _idx) => (
                                        <span key={_idx} className='d-flex px-2 py-1 br-4 font-size-12' style={{ background: 'rgba(0, 242, 255, 0.05)', border: '1px solid rgba(0, 242, 255, 0.2)', color: '#00f2ff', whiteSpace: 'nowrap' }}>{_tag}</span>
                                      ))
                                    }
                                  </div>
                                }
                              ].map((statItem, statIdx) => (
                                <div key={statIdx} className={`d-flex flex-column mt-2 pt-1 col-4 ${statItem.className || ''}`}>
                                  <small className="color-unimportant pb-1">{statItem.label}</small>
                                  <span className="color-secondary">
                                    <span className="d-flex flex-column">
                                      <span className="color-white">{statItem.content}</span>
                                    </span>
                                  </span>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </Busy>
        </div>
        {/* <div className="container-xl d-flex flex-column px-3 px-md-4 gap-4 gap-md-5 my-0 my-md-5 py-0">
          <div className="br-4 p-3 p-md-5">
            <ul className="d-flex flex-wrap gap-3 align-items-center py-3 py-md-4">
              {
                [
                  { name: 'User Count', icon: <IMainDIcon1 />, content: <Statistic value={627} precision={0} formatter={(value) => <CountUp end={value as number} separator="," className='h2 fw-bold' />} /> },
                  { name: 'Transaction Commission', icon: <IMainDIcon2 />, content: <span className='d-flex gap-2'>$ <Statistic value={64827.41} precision={2} formatter={(value) => <CountUp end={value as number} decimals={2} separator="," className='h2 fw-bold' />} /></span> },
                  { name: 'Repurchase Tele', icon: <IMainDIcon3 />, content: <Statistic value={16856235.7} precision={1} formatter={(value) => <CountUp end={value as number} decimals={1} separator="," className='h2 fw-bold' />} /> },
                ].map((item, idx) =>
                  <li key={idx} className="d-flex flex-column gap-2 align-items-center col-12 col-md p-4 br-3">
                    <span className='fw-bold h2'>{ item.content }</span>
                    <span className="d-flex align-items-center gap-2">{ item.icon }<span className=' fw-bold color-primary-linear'>{ item.name }</span></span>
                  </li>
                )
              }
            </ul>
          </div>
        </div> */}
      </div>

      <div className='main-line'></div>

      <div className="container-fluid px-0 d-flex flex-column my-5 pt-5 brain">
        <div className="container-xl d-flex flex-column align-items-center px-3 px-md-4 gap-4 gap-md-5 my-0 my-md-5 py-0">
          <div className="d-flex flex-column gap-3 align-items-center justify-content-center col-12 col-md-8">
            <h2 className="fw-bolder text-center color-white mb-2" style={{ fontSize: '2.5rem' }}>AI 驱动的链上猎手</h2>
            <span className='color-secondary text-center px-md-5'>利用 MCP 协议赋予 AI Agent 顶级交易员的“上帝视角”</span>
          </div>
          <ul className="d-flex flex-wrap justify-content-center col-12 mt-3 g-2">
            {
              [
                { title: '极速识别"聪明钱"', content: '通过自然语言对话，10秒内锁定 Hyperliquid 顶级玩家，深度还原盈利曲线及核心策略，揭秘千万级金牌巨鲸实战逻辑。', icon: <IBrainIcon1 /> },
                { title: '实时全量数据接入', content: '通过 MCP 协议直接接入实时订单簿与市场情绪，打破 AI 数据滞后局限，提供具备交易价值的即时链上分析。', icon: <IBrainIcon2 /> },
                { title: '多维度巨鲸监控体系', content: '内置 22 种专业工具，涵盖排行榜、大户动向及交易偏好分析，全方位监控资金流向，构建个人专属情报护城河。', icon: <IBrainIcon3 /> },
                { title: '零门槛 AI Agent 集成', content: '支持通过 ClawHub 一键部署，无论是交易员或开发者，均可通过自然语言指令实现从繁琐看盘到高效决策的飞跃。', icon: <IBrainIcon4 /> },
              ].map((item, idx) => (
                <li key={idx} className="d-flex flex-column col-12 col-md-6 col-xl-3 p-3">
                  <div className="d-flex flex-column h-100 p-4 br-4 address-card-custom position-relative" style={{ border: '1px solid #1f2125', background: '#0f1013' }}>
                    <div className='br-3 p-2 mb-3 bg-white-thin' style={{ width: 'fit-content' }}>
                      {item.icon}
                    </div>
                    <span className="h5 fw-bold text-start color-white mb-3">{item.title}</span>
                    <span className="color-secondary-thin text-start" style={{ lineHeight: '1.6', fontSize: '14px' }}>{item.content}</span>
                  </div>
                </li>
              ))
            }
          </ul>
        </div>
      </div>

      {/* Profit Closed Loop Section */}
      <div className="container-fluid px-0 d-flex flex-column my-5 pt-5 features">
        <div className="container-xl d-flex flex-column align-items-center px-3 px-md-4 gap-4 gap-md-5 my-0 py-0">
          <div className="d-flex flex-column gap-3 align-items-center justify-content-center col-12 col-md-8">
            <h2 className="fw-bolder text-center color-white m-0" style={{ fontSize: '2.5rem' }}>从数据到交易 构建盈利闭环</h2>
            <h4 className="fw-bold color-white m-0 mt-3">预先洞察Alpha</h4>
          </div>

          <div className="row g-4 w-100 mt-3 justify-content-center">
            {/* Top Left Card */}
            <div className="col-12 col-md-6">
              <div className="d-flex flex-column h-100 br-4 position-relative address-card-custom overflow-hidden" style={{ background: '#0f1013', border: '1px solid #1f2125' }}>
                <div className="p-4 p-md-5 pb-0">
                  <h4 className="fw-bold color-white mb-3">一键发现顶级交易员</h4>
                  <p className="color-secondary-thin mb-4" style={{ lineHeight: '1.8', fontSize: '14px' }}>
                    在60万+ Hyperliquid地址库中，Signalxbot 提供从小白到高阶用户的完整筛选方案——AI标签与高精准度数值筛，让您轻松发现隐藏巨星和策略大师。
                  </p>
                  <ul className="d-flex flex-column gap-2 mb-4 p-0 m-0" style={{ listStyle: 'none' }}>
                    <li className="d-flex align-items-center color-white fw-bold font-size-13">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px', color: '#00e676' }}><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      60万+ Hyperliquid 地址
                    </li>
                    <li className="d-flex align-items-center color-white fw-bold font-size-13">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px', color: '#00e676' }}><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      预设策略、AI标签一键筛选
                    </li>
                    <li className="d-flex align-items-center color-white fw-bold font-size-13">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px', color: '#00e676' }}><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      20+维度精准数值筛选
                    </li>
                    <li className="d-flex align-items-center color-white fw-bold font-size-13">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px', color: '#00e676' }}><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      海量历史数据与盈亏曲线
                    </li>
                  </ul>
                </div>
                <div className="mt-auto w-100 d-flex justify-content-center align-items-end" style={{ padding: '0 20px', paddingBottom: '20px' }}>
                  <img src={IFeatureCover1} className="w-100" style={{ maxWidth: '100%', objectFit: 'contain', opacity: '0.85' }} />
                </div>
              </div>
            </div>

            {/* Top Right Card */}
            <div className="col-12 col-md-6">
              <div className="d-flex flex-column h-100 br-4 position-relative address-card-custom overflow-hidden" style={{ background: '#0f1013', border: '1px solid #1f2125' }}>
                <div className="p-4 p-md-5 pb-0">
                  <h4 className="fw-bold color-white mb-3">主力资金洞察</h4>
                  <p className="color-secondary-thin mb-4" style={{ lineHeight: '1.8', fontSize: '14px' }}>
                    摒弃传统指标滞后性，Signalxbot 通过 AI 引擎和主动订单流分析，帮助您看穿主力资金的真实意图，洞察先机。
                  </p>
                  <ul className="d-flex flex-column gap-2 mb-4 p-0 m-0" style={{ listStyle: 'none' }}>
                    <li className="d-flex align-items-center color-white fw-bold font-size-13">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px', color: '#00e676' }}><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      AI 交易意图识别
                    </li>
                    <li className="d-flex align-items-center color-white fw-bold font-size-13">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px', color: '#00e676' }}><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      跟单策略回测验证
                    </li>
                    <li className="d-flex align-items-center color-white fw-bold font-size-13">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px', color: '#00e676' }}><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      实时主动订单流监测
                    </li>
                  </ul>
                </div>
                <div className="mt-auto w-100 d-flex justify-content-center align-items-end" style={{ padding: '0 20px', paddingBottom: '20px' }}>
                  <img src={IFeatureCover2} className="w-100" style={{ maxWidth: '100%', objectFit: 'contain', opacity: '0.85' }} />
                </div>
              </div>
            </div>

            {/* Bottom Full Width Card */}
            <div className="col-12 mt-4">
              <div className="d-flex flex-column flex-lg-row align-items-center h-100 br-4 position-relative address-card-custom overflow-hidden" style={{ background: '#0f1013', border: '1px solid #1f2125' }}>
                <div className="col-12 col-lg-6 p-4 p-md-5 d-flex flex-column justify-content-center align-items-start z-index-9">
                  <h4 className="fw-bold color-white mb-3">永不错过交易机会</h4>
                  <p className="color-secondary-thin mb-4" style={{ lineHeight: '1.8', fontSize: '14px' }}>
                    信号即机会。一旦您关注的聪明钱包有任何异动，Signalxbot将通过App和Telegram实现毫秒级触达，确保您永远快人一步。
                  </p>
                  <ul className="d-flex flex-column gap-2 mb-0 p-0 m-0" style={{ listStyle: 'none' }}>
                    <li className="d-flex align-items-center color-white fw-bold font-size-13">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px', color: '#00e676' }}><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      App/Telegram 全覆盖
                    </li>
                    <li className="d-flex align-items-center color-white fw-bold font-size-13">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px', color: '#00e676' }}><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      毫秒级信号推流引擎
                    </li>
                  </ul>
                </div>
                <div className="col-12 col-lg-6 d-flex justify-content-center align-items-center p-4">
                  <img src={IFeatureCover3} className="w-100" style={{ objectFit: 'contain', maxHeight: '350px', opacity: '0.85' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-DEX Aggregation Section */}
      <div className="container-fluid px-0 d-flex flex-column my-5 pt-5 features">
        <div className="container-xl d-flex flex-column align-items-center px-3 px-md-4 gap-4 gap-md-5 my-0 py-0">
          <div className="d-flex flex-column gap-3 align-items-center justify-content-center col-12 col-md-8 mb-3">
            <h2 className="fw-bolder text-center color-white m-0" style={{ fontSize: '2.5rem' }}>多DEX聚合 高效盈利</h2>
          </div>

          <div className="row g-4 w-100 mt-1 justify-content-center">
            {/* Left Card */}
            <div className="col-12 col-md-6">
              <div className="d-flex flex-column h-100 br-4 position-relative address-card-custom overflow-hidden" style={{ background: '#0f1013', border: '1px solid #1f2125', borderRadius: '20px' }}>
                <div className="p-4 p-md-5 pb-0">
                  <h3 className="fw-bolder color-white mb-3" style={{ fontSize: '1.75rem' }}>一个入口交易所有</h3>
                    无需在多个交易所之间频繁切换，即可触达Hyperliquid 和 Aster Perp DEX ，并享受独家费率优惠。
                  <ul className="d-flex flex-column gap-2 mb-4 p-0 m-0" style={{ listStyle: 'none' }}>
                    <li className="d-flex align-items-center color-white fw-bold font-size-13">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px', color: '#00e676' }}><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      独家4% Hyperliquid费率优惠
                    </li>
                    <li className="d-flex align-items-center color-white fw-bold font-size-13">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px', color: '#00e676' }}><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      一键切换Hyperliquid、Aster Perp DEX
                    </li>
                    <li className="d-flex align-items-center color-white fw-bold font-size-13">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px', color: '#00e676' }}><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      统一界面管理多平台资产与订单
                    </li>
                  </ul>
                </div>
                <div className="mt-auto w-100 d-flex justify-content-center align-items-end" style={{ padding: '0 20px', paddingBottom: '20px' }}>
                  <img src={ITriple1} className="w-100" style={{ maxWidth: '100%', objectFit: 'contain', opacity: '0.9', borderRadius: '12px' }} />
                </div>
              </div>
            </div>

            {/* Right Card */}
            <div className="col-12 col-md-6">
              <div className="d-flex flex-column h-100 br-4 position-relative address-card-custom overflow-hidden" style={{ background: '#0f1013', border: '1px solid #1f2125', borderRadius: '20px' }}>
                <div className="p-4 p-md-5 pb-0">
                  <h3 className="fw-bolder color-white mb-3" style={{ fontSize: '1.75rem' }}>一键跟单</h3>
                  <p className="color-secondary-thin mb-4" style={{ lineHeight: '1.8', fontSize: '14px' }}>
                    发现目标后即可一键启动跟单，自定义跟单模式、金额、杠杆与风险参数，资金安全，策略透明。
                  </p>
                  <ul className="d-flex flex-column gap-2 mb-4 p-0 m-0" style={{ listStyle: 'none' }}>
                    <li className="d-flex align-items-center color-white fw-bold font-size-13">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px', color: '#00e676' }}><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      跨平台跟单
                    </li>
                    <li className="d-flex align-items-center color-white fw-bold font-size-13">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px', color: '#00e676' }}><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      自定义跟单参数
                    </li>
                    <li className="d-flex align-items-center color-white fw-bold font-size-13">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px', color: '#00e676' }}><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      多模式灵活配置
                    </li>
                  </ul>
                </div>
                <div className="mt-auto w-100 d-flex justify-content-center align-items-end" style={{ padding: '0 20px', paddingBottom: '20px' }}>
                  <img src={ITriple2} className="w-100" style={{ maxWidth: '100%', objectFit: 'contain', opacity: '0.9', borderRadius: '12px' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data API & Token Info Banner */}
      <div className="container-fluid px-0 d-flex flex-column align-items-center my-5 py-5 position-relative">
        <div className="container-xl d-flex flex-column align-items-center px-3 px-md-4 gap-4 w-100">

          {/* API Card */}
          <div className="d-flex flex-column align-items-center justify-content-center text-center p-5 w-100 position-relative address-card-custom overflow-hidden" style={{ background: '#0f1013', border: '1px solid #1f2125', borderRadius: '16px' }}>
            <h2 className="fw-bolder color-white mb-4" style={{ fontSize: '2rem' }}>{'< 20ms 极速响应: Hyperliquid 顶级量化数据 API'}</h2>
            <p className="color-secondary-thin mb-5" style={{ fontSize: '15px' }}>
              8,000 RPM 高频吞吐，涵盖行情、持仓、K线等 32+ 核心数据端点。WebSocket 直连，为机构级与超个体开发者打造的一站式数据引擎。
            </p>
            <Button size="large" className="d-flex align-items-center justify-content-center px-5 py-3 fw-bold" style={{ background: 'transparent', border: '1px solid #00f2ff', color: '#00f2ff', borderRadius: '30px' }}>
              立即查看API服务 <IOutlineArrowRight1 className="ms-2 zoom-80" />
            </Button>
          </div>

          {/* Token Card */}
          <div className="d-flex align-items-center justify-content-between p-3 px-4 mt-2 position-relative address-card-custom" style={{ background: '#0f1013', border: '1px solid #1f2125', borderRadius: '40px', width: 'fit-content', minWidth: 'min(100%, 650px)' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center overflow-hidden" style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #a450ff 0%, #3a7bd5 100%)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: '#fff' }}>
                  <path d="M7 12a3 3 0 100-6 3 3 0 000 6zM17 12a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 12v2a4 4 0 004 4h8a4 4 0 004-4v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="d-flex flex-column align-items-start">
                <span className="fw-bolder color-white font-size-18">$BOT</span>
                <span className="color-secondary-thin font-size-12 d-flex align-items-center gap-2">
                  代币合约 <span style={{ color: '#F3BA2F' }}>◆</span> 0x59537849f2a119ec698c7Aa6C6DaAdc40C398A25
                </span>
              </div>
            </div>
            <Button ghost className="d-flex align-items-center px-4 py-2 fw-bold" style={{ borderColor: '#00f2ff', color: '#00f2ff', borderRadius: '30px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="me-2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" /></svg>
              OKX Boost
            </Button>
          </div>

          <div className="d-flex align-items-center justify-content-center pt-2 cursor-pointer mt-1">
            <span className="fw-bolder color-secondary font-size-14 d-flex align-items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#f05353" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span className="color-white">SALUS</span> $BOT 审计报告
            </span>
          </div>

        </div>
      </div>

      {/* Removed Backed By Partners Section for cleaner UI */}

      <ModalTradingStatistics />
      <TrackingCreateTrack />
      <ModalCreateCopyTrading />
    </>
  )
}

export default Home