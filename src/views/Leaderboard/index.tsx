import { useEffect, useState } from 'react'
import { Button } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom';

import { IOutlineMonitor, IOutlineChart2, IOutlineShare, IOutlineFilter } from '@/components/icon'
import { formatNumber } from '@/utils'
import { useAccountStore, useReqStore, useCopyTradingStore, useWhalePositionsStore, useDiscoverTradingStatisticsStore, useTrackingCreateStore } from '@/stores'
import ColumnList from '@/components/Column/List'
import DropdownMenu from '@/components/Dropdown/Menu'
import ModalCreateCopyTrading from '@/components/Modal/CreateCopyTrading'
import ModalTradingStatistics from '@/components/Modal/TradingStatistics'
import TrackingCreateTrack from '@/components/Modal/TrackingCreateTrack'
import TimeAgo from '@/components/TimeAgo'
import CoinIcon from '@/components/CoinIcon'

const Leaderboard = () => {
  const accountStore = useAccountStore()
  const reqStore = useReqStore()
  const copyTradingStore = useCopyTradingStore()
  const whalePositionsStore = useWhalePositionsStore()
  const discoverTradingStatisticsStore = useDiscoverTradingStatisticsStore()
  const trackingCreateStore = useTrackingCreateStore()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [memberModalOpen, setMemberModalOpen] = useState(false)
  const [filterAccountValue, setFilterAccountValue] = useState('')
  const [liveStats, setLiveStats] = useState({ longCount: 0, shortCount: 0 })

  const MemberBadge = () => (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M6.5 0.8L12.2 6.5L6.5 12.2L0.8 6.5L6.5 0.8Z" fill="#13C2C2"/>
      <path d="M6.5 3.2L9.8 6.5L6.5 9.8L3.2 6.5L6.5 3.2Z" fill="rgba(255,255,255,0.45)"/>
    </svg>
  )

  const whalesPosition = [
    { id: 'address', label: '地址/备注', className: 'col-3 col-sm-2 col-md-2 col-lg-1 col-xl-2' },
    { id: 'symbol', label: '币种', className: 'col-2 col-sm-1 col-md-1 col-xl-1' },
    { id: 'positionValue', label: '持仓价值', className: 'justify-content-end text-end col-4 col-sm-2 col-md-2 col-xl-2' },
    { id: 'uPnl', sort: true, label: '未实现盈亏', className: 'justify-content-end text-end d-none d-sm-flex col-3 col-sm-2 col-md-2 col-lg-1' },
    { id: 'margin', sort: true, label: '保证金', className: 'justify-content-end text-end d-none d-lg-flex col-md-2 col-lg-1 col-xl-1' },
    { id: 'openingPrice', label: '开盘价', className: 'justify-content-end text-end d-none d-xl-flex col-xl-1' },
    { id: 'liquidationPrice', label: '清算价', className: 'justify-content-end text-end d-none d-lg-flex col-md-1 col-xl-1' },
    { id: 'createTs', sort: true, label: '创建时间', className: 'justify-content-end text-end d-none d-sm-flex col-3 col-sm-2 col-md-2 col-lg-1 col-xl-1' },
    { id: 'operator', label: '', className: 'justify-content-end col' },
  ]

  const renderWhalesPositionItem = (item: any, columnIndex: number) => {
    switch (whalesPosition[columnIndex].id) {
      case 'address':
        return (
          <div className="d-flex align-items-center gap-2 py-1">
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} className="d-flex align-items-center justify-content-center">
              <span className="font-size-14">👤</span>
            </div>
            <div className="d-flex flex-column">
              <span className="color-white fw-bold font-size-14">{item.address.slice(0, 6)}...{item.address.slice(-4)}</span>
              <div className="d-flex flex-wrap gap-1 mt-0.5">
                <span className="font-size-10 px-1.5 py-0.5 br-1" style={{ background: 'rgba(173, 181, 189, 0.1)', color: '#adb5bd' }}>巨鲸</span>
                <span className={`font-size-10 px-1.5 py-0.5 br-1 ${item.direction === 'long' ? 'color-success' : 'color-danger'}`} style={{ background: item.direction === 'long' ? 'rgba(25, 135, 84, 0.1)' : 'rgba(220, 53, 69, 0.1)' }}>
                  {item.direction === 'long' ? '偏多头' : '偏空头'}
                </span>
                {item.address.length > 20 && <span className="font-size-10 px-1.5 py-0.5 br-1" style={{ background: 'rgba(13, 202, 240, 0.1)', color: '#0dcaf0' }}>@CL207</span>}
              </div>
            </div>
          </div>
        )
      case 'symbol':
        return (
          <div className="d-flex align-items-center gap-2 py-1">
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#f7931a' }} className="d-flex align-items-center justify-content-center">
              <span className="color-white font-size-11">₿</span>
            </div>
            <div className="d-flex flex-column">
              <span className="color-white fw-bold uppercase font-size-13">{item.coin || 'BTC'}</span>
              <span className="color-secondary font-size-11">逐仓 {item.leverage || '20'}x</span>
            </div>
          </div>
        )
      case 'positionValue':
        return (
          <div className="d-flex flex-column align-items-end">
            <span className="color-white fw-bold h6 m-0">$ {formatNumber(item.positionValue)}</span>
            <span className="color-secondary font-size-11">{(parseFloat(item.positionValue) / 30000).toFixed(2)} BTC</span>
          </div>
        )
      case 'uPnl':
        const isProfit = parseFloat(item.uPnl) >= 0;
        return (
          <div className="d-flex flex-column align-items-end">
            <span className={`fw-bold h6 m-0 ${isProfit ? 'color-success' : 'color-danger'}`}>{isProfit ? '+' : ''}$ {formatNumber(item.uPnl)}</span>
            <span className={`font-size-11 ${isProfit ? 'color-success' : 'color-danger'}`}>{isProfit ? '+' : ''}0.11%</span>
          </div>
        )
      case 'openingPrice':
        return <span className="color-white h6 m-0">$ {item.openPrice || '67,270.5'}</span>
      case 'liquidationPrice':
        return <span className="color-white h6 m-0">$ {item.liquidationPrice || '61,927.2'}</span>
      case 'margin':
        return <span className="color-white h6 m-0">$ {formatNumber(item.marginUsed)}</span>
      case 'createTs':
        return <span className="color-secondary font-size-12"><TimeAgo ts={item.createTs} /></span>
      case 'operator':
        return (
          <span className='d-flex gap-3 align-items-center justify-content-end'>
            {
              [
                { icon: <IOutlineMonitor className='zoom-85' />, title: t('common.tradingStatistics'), onClick: () => navigate(`/trader/${item.address}`) },
                { icon: <IOutlineChart2 className='zoom-85' />, title: t('common.trackAddress'), logged: true, onClick: () => handleOpenCreateTrackAddress(item) },
                { icon: <IOutlineShare className='zoom-85' />, title: t('common.copyTrading'), logged: true, onClick: () => handleOpenQuickerCreateCopyTrade(item) },
              ].map((item, idx) => (
                <button key={idx} className="bg-transparent border-0 p-1 color-secondary hover-primary" style={{ transition: 'all 0.2s' }} onClick={item.onClick}>
                  {item.icon}
                </button>
              ))
            }
          </span>
        )
      default:
        return null
    }
  }

  const handleOpenQuickerCreateCopyTrade = (item: any) => {
    copyTradingStore.quickerOpenPositionTargetAddress = item.address
    copyTradingStore.copyTradingSearchTargetAddress = item.address
    copyTradingStore.openCopyTradingTarget = true
  }

  const handleOpenTradingStatistics = (item: any) => {
    discoverTradingStatisticsStore.address = item.address
    discoverTradingStatisticsStore.openModal = true
  }

  const handleOpenCreateTrackAddress = async (item: any) => {
    trackingCreateStore.quickCreateTrackAddress = item.address
    trackingCreateStore.openCreateTracking = true
  }

  const handleWhalePositions = async () => {
    return await reqStore.whalePositions(accountStore, whalePositionsStore)
  }

  const handleWhaleStats = async () => {
    const res = await reqStore.whaleStats(accountStore, whalePositionsStore)
    if (!res.error) setLiveStats({ longCount: res.data.longCount, shortCount: res.data.shortCount })
  }

  const handleWhalesPositionChangeSort = async (columnId: string) => {
    whalePositionsStore.sortColumnId = columnId
    await handleWhalePositions()
  }

  useEffect(() => {
    handleWhalePositions()
    handleWhaleStats()
  }, [])

  // Real stats from API
  const longCount = liveStats.longCount
  const shortCount = liveStats.shortCount
  const totalCount = longCount + shortCount
  const longPercent = totalCount > 0 ? ((longCount / totalCount) * 100).toFixed(1) : '0'
  const shortPercent = totalCount > 0 ? ((shortCount / totalCount) * 100).toFixed(1) : '0'
  // Position values from positions list (filtered by selected coin)
  const totalPositionValue = whalePositionsStore.list.reduce((sum, item) => sum + parseFloat(item.positionValue || '0'), 0)
  const longValue = whalePositionsStore.list.filter(i => i.direction === 'long').reduce((s, i) => s + parseFloat(i.positionValue || '0'), 0)
  const shortValue = whalePositionsStore.list.filter(i => i.direction === 'short').reduce((s, i) => s + parseFloat(i.positionValue || '0'), 0)

  return (
    <>
      <div className="leaderboard-container container-fluid px-0 d-flex flex-column" style={{ minHeight: '100vh', paddingTop: '80px' }}>
        <div className="mx-auto d-flex flex-column gap-4 px-3 px-md-0" style={{ maxWidth: '1200px', width: '100%' }}>

          {/* Whale Analysis Section */}
          <div className="d-flex flex-column gap-3 mt-4">
            <h3 className="fw-bolder color-white font-size-22 m-0">鲸鱼分析</h3>
            <div className="row g-3">
              {/* Stats Panel - Left */}
              <div className="col-12 col-lg-4">
                <div className="d-flex flex-column h-100 p-4 br-3 bg-gray-alpha-3 border-1 border-gray-alpha-2 gap-4">
                  <div className="d-flex align-items-center h5 fw-bold gap-2 m-0">
                    <div className="d-flex align-items-center">
                      <span className="d-flex avatar flex-shrink-0 md me-2">
                         <CoinIcon id={whalePositionsStore.selectedCoin} size="md" />
                      </span>
                      <span className="color-white">{whalePositionsStore.selectedCoin}</span>
                    </div>
                    <div className="d-flex flex-wrap align-items-center gap-2 ms-auto justify-content-end">
                      <DropdownMenu buttonSize='small'
                        className="bg-gray-alpha-4 border border-gray-alpha-2 br-1 px-3"
                        items={whalePositionsStore.selectCoin.map(c => ({
                          ...c,
                          label: (
                            <div className="d-flex align-items-center gap-2">
                              <span>{c.label}</span>
                            </div>
                          )
                        }))}
                        selectedValue={whalePositionsStore.selectedCoin}
                        onSelect={(val: string) => {
                          whalePositionsStore.selectedCoin = val;
                          handleWhalePositions();
                          handleWhaleStats();
                        }}
                      />
                      <DropdownMenu buttonSize='small'
                        className="bg-gray-alpha-4 border border-gray-alpha-2 br-1 px-3"
                        items={whalePositionsStore.selectPeriod}
                        selectedValue={whalePositionsStore.selectedPeriodAnalysis}
                        onSelect={(val: string) => {
                          whalePositionsStore.selectedPeriodAnalysis = val;
                          handleWhalePositions();
                        }}
                      />
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <div className="d-flex flex-column py-3 px-3 col br-2" style={{ background: 'rgba(46, 204, 113, 0.08)', border: '1px solid rgba(46, 204, 113, 0.15)' }}>
                      <span className="color-unimportant font-size-12 mb-1">当前多头人数</span>
                      <div className="d-flex align-items-end">
                        <span className="h4 fw-bold color-success mb-0">{longCount}</span>
                        <span className="color-secondary ms-auto font-size-13">{longPercent}%</span>
                      </div>
                    </div>
                    <div className="d-flex flex-column py-3 px-3 col br-2" style={{ background: 'rgba(231, 76, 60, 0.08)', border: '1px solid rgba(231, 76, 60, 0.15)' }}>
                      <span className="color-unimportant font-size-12 mb-1">当前空头人数</span>
                      <div className="d-flex align-items-end">
                        <span className="h4 fw-bold color-danger mb-0">{shortCount}</span>
                        <span className="color-secondary ms-auto font-size-13">{shortPercent}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex flex-column gap-3">
                    <div className="d-flex flex-column gap-1">
                      <span className="color-unimportant font-size-14">总清算价值 ({whalePositionsStore.selectPeriod.find(p => p.value === whalePositionsStore.selectedPeriodAnalysis)?.label})</span>
                      <span className="color-white h3 fw-bold m-0">$ {formatNumber(Number(totalPositionValue).toFixed(0))}</span>
                    </div>
                    
                    <div className="d-flex gap-2">
                      <div className="d-flex flex-column py-3 px-3 col br-2" style={{ background: 'rgba(46, 204, 113, 0.08)', border: '1px solid rgba(46, 204, 113, 0.12)' }}>
                        <span className="color-unimportant font-size-12 mb-1">多头清算价值 ({whalePositionsStore.selectPeriod.find(p => p.value === whalePositionsStore.selectedPeriodAnalysis)?.label})</span>
                        <div className="d-flex align-items-end">
                          <span className="fw-bold color-white font-size-15">{formatNumber(Number(longValue).toFixed(0))}</span>
                          <span className="color-secondary ms-auto font-size-13">{totalPositionValue > 0 ? ((longValue / totalPositionValue) * 100).toFixed(2) : '0'}%</span>
                        </div>
                      </div>
                      <div className="d-flex flex-column py-3 px-3 col br-2" style={{ background: 'rgba(231, 76, 60, 0.08)', border: '1px solid rgba(231, 76, 60, 0.12)' }}>
                        <span className="color-unimportant font-size-12 mb-1">空头清算价值 ({whalePositionsStore.selectPeriod.find(p => p.value === whalePositionsStore.selectedPeriodAnalysis)?.label})</span>
                        <div className="d-flex align-items-end">
                          <span className="fw-bold color-white font-size-15">{formatNumber(Number(shortValue).toFixed(0))}</span>
                          <span className="color-secondary ms-auto font-size-13">{totalPositionValue > 0 ? ((shortValue / totalPositionValue) * 100).toFixed(2) : '0'}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart Panel - Right */}
              <div className="col-12 col-lg-8">
                <div className="d-flex flex-column h-100 p-4 br-3 bg-gray-alpha-3 border-1 border-gray-alpha-2 gap-3" style={{ minHeight: '400px' }}>
                  <div className="d-flex align-items-center justify-content-between">
                    <h5 className="fw-bold color-white mb-0">历史鲸鱼仓位多空比</h5>
                    <div className="d-flex align-items-center gap-3">
                      <div className="d-flex align-items-center gap-2">
                         <span className="color-secondary font-size-12 d-flex align-items-center gap-1">
                           <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2962ff' }}></span> 多空比
                         </span>
                         <span className="color-secondary font-size-12 d-flex align-items-center gap-1">
                           <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f7b500' }}></span> 差值
                         </span>
                      </div>
                      <DropdownMenu buttonSize='small' className="bg-gray-alpha-4 border-1 border-gray-alpha-2"
                        items={whalePositionsStore.selectPeriod}
                        selectedValue={whalePositionsStore.selectedPeriodChart}
                        onSelect={(val: string) => {
                          whalePositionsStore.selectedPeriodChart = val;
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex-grow-1 position-relative mt-2" style={{ minHeight: '280px' }}>
                    {/* Simplified Chart Mockup for Parity */}
                    <svg width="100%" height="100%" viewBox="0 0 800 280" preserveAspectRatio="none">
                      <path d="M0,140 Q100,100 200,150 T400,130 T600,160 T800,120" fill="none" stroke="#2962ff" strokeWidth="2" />
                      <path d="M0,200 Q150,180 300,220 T500,210 T700,240 T800,220" fill="none" stroke="#f7b500" strokeWidth="2" strokeDasharray="4 2" />
                      {/* Grid Lines */}
                      {[0, 1, 2, 3].map(i => <line key={i} x1="0" y1={70*i} x2="800" y2={70*i} stroke="rgba(255,255,255,0.05)" />)}
                    </svg>
                    <div className="position-absolute d-flex flex-column align-items-center justify-content-center w-100 h-100" style={{ top: 0, left: 0 }}>
                      <span className="color-secondary font-size-12 opacity-50">实时数据加载中...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Whale Positions Section */}
          <div className="d-flex flex-column gap-3 mt-3">
            <div className="d-flex flex-wrap gap-4 align-items-center pb-2 col">
              <h3 className="fw-bolder color-white m-0">鲸鱼持仓</h3>
              <div className="d-flex flex-wrap align-items-center gap-2 ms-auto justify-content-end">
                {[
                  {
                    items: whalePositionsStore.selectCoin.map(c => ({
                      ...c,
                      label: (
                        <div className="d-flex align-items-center gap-2">
                          <span className="d-flex"><CoinIcon id={c.value} size="xsm" /></span>
                          <span>{c.label}</span>
                        </div>
                      )
                    })),
                    selectedValue: whalePositionsStore.selectedCoin,
                    storeKey: 'selectedCoin',
                  },
                  {
                    items: whalePositionsStore.selectDirection,
                    selectedValue: whalePositionsStore.selectedDirection,
                    storeKey: 'selectedDirection',
                  },
                  {
                    items: whalePositionsStore.selectUPnl,
                    selectedValue: whalePositionsStore.selectedUPnl,
                    storeKey: 'selectedUPnl',
                  },
                  {
                    items: whalePositionsStore.selectFundingFee,
                    selectedValue: whalePositionsStore.selectedFundingFee,
                    storeKey: 'selectedFundingFee',
                  }
                ].map((config, index) => (
                  <DropdownMenu key={index} buttonSize="small"
                    className="bg-transparent border color-secondary font-size-13"
                    items={config.items}
                    selectedValue={config.selectedValue}
                    onSelect={(val: string) => {
                      (whalePositionsStore as any)[config.storeKey] = val;
                      handleWhalePositions();
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Filter Dashboard */}
            <div className="discovery-filter-panel mb-4 transition-3 mt-1">
              <div className="d-flex flex-column gap-4 px-0 py-2">
                {/* Row 1: 账户总价值 | 盈利规模 ◆ | 方向偏好 ◆ */}
                <div className="row g-4">
                  <div className="col-12 col-md-4">
                    <div className="d-flex flex-column gap-2">
                      <span className="font-size-12" style={{ color: '#808080' }}>账户总价值</span>
                      <div className="d-flex flex-wrap gap-4">
                        {[{ label: '小资金', value: 'small' }, { label: '中等资金', value: 'medium' }, { label: '巨鲸', value: 'whale' }].map(item => (
                          <div key={item.value} className="d-flex align-items-center gap-2 cursor-pointer font-size-12 transition-2"
                            style={{ color: filterAccountValue === item.value ? '#13C2C2' : '#808080' }}
                            onClick={() => setFilterAccountValue(filterAccountValue === item.value ? '' : item.value)}>
                            <input type="checkbox" className="premium-checkbox" readOnly checked={filterAccountValue === item.value} style={{ pointerEvents: 'none' }} /> {item.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="d-flex flex-column gap-2">
                      <span className="d-flex align-items-center gap-1 font-size-12" style={{ color: '#808080' }}>盈利规模 <MemberBadge /></span>
                      <div className="d-flex flex-wrap gap-4">
                        {['小额盈利', '中等盈利', '大额盈利'].map(label => (
                          <div key={label} className="d-flex align-items-center gap-2 cursor-pointer font-size-12" style={{ color: '#808080' }} onClick={() => setMemberModalOpen(true)}>
                            <input type="checkbox" className="premium-checkbox" readOnly checked={false} style={{ pointerEvents: 'none' }} /> {label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="d-flex flex-column gap-2">
                      <span className="d-flex align-items-center gap-1 font-size-12" style={{ color: '#808080' }}>方向偏好 <MemberBadge /></span>
                      <div className="d-flex flex-wrap gap-4">
                        {['偏空头', '中性', '偏多头'].map(label => (
                          <div key={label} className="d-flex align-items-center gap-2 cursor-pointer font-size-12" style={{ color: '#808080' }} onClick={() => setMemberModalOpen(true)}>
                            <input type="checkbox" className="premium-checkbox" readOnly checked={false} style={{ pointerEvents: 'none' }} /> {label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2: 交易节奏 ◆ | 盈利状态 ◆ */}
                <div className="row g-4">
                  <div className="col-12 col-md-4">
                    <div className="d-flex flex-column gap-2">
                      <span className="d-flex align-items-center gap-1 font-size-12" style={{ color: '#808080' }}>交易节奏 <MemberBadge /></span>
                      <div className="d-flex flex-wrap gap-4">
                        {['长线', '波段', '短线', '超短线'].map(label => (
                          <div key={label} className="d-flex align-items-center gap-2 cursor-pointer font-size-12" style={{ color: '#808080' }} onClick={() => setMemberModalOpen(true)}>
                            <input type="checkbox" className="premium-checkbox" readOnly checked={false} style={{ pointerEvents: 'none' }} /> {label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="d-flex flex-column gap-2">
                      <span className="d-flex align-items-center gap-1 font-size-12" style={{ color: '#808080' }}>盈利状态 <MemberBadge /></span>
                      <div className="d-flex flex-wrap gap-4">
                        {['持续盈利', '波动盈利', '盈亏平衡'].map(label => (
                          <div key={label} className="d-flex align-items-center gap-2 cursor-pointer font-size-12" style={{ color: '#808080' }} onClick={() => setMemberModalOpen(true)}>
                            <input type="checkbox" className="premium-checkbox" readOnly checked={false} style={{ pointerEvents: 'none' }} /> {label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 3: 交易风格 ◆ + 筛选 button */}
                <div className="d-flex flex-column gap-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="d-flex align-items-center gap-1 font-size-12" style={{ color: '#808080' }}>交易风格 <MemberBadge /></span>
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <div className="d-flex flex-wrap gap-3 flex-grow-1">
                      {['高频稳健', '高频激进', '低频稳健', '低频激进', '稳定盈利', '高风险高回报', '非对称高手', '低回撤', '波动策略'].map(label => (
                        <div key={label} className="d-flex align-items-center gap-2 cursor-pointer font-size-12" style={{ color: '#808080' }} onClick={() => setMemberModalOpen(true)}>
                          <input type="checkbox" className="premium-checkbox" readOnly checked={false} style={{ pointerEvents: 'none' }} /> {label}
                        </div>
                      ))}
                    </div>
                    <Button className="px-4 d-flex align-items-center gap-2 flex-shrink-0"
                      style={{ height: '36px', borderColor: '#13C2C2', color: '#13C2C2', backgroundColor: 'transparent', borderRadius: '20px' }}
                      onClick={() => handleWhalePositions()}>
                      <IOutlineFilter className="font-size-13" /> 筛选
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <style>{`
              .premium-checkbox {
                appearance: none;
                width: 14px;
                height: 14px;
                border: 1px solid #323437;
                border-radius: 2px;
                background: transparent;
                cursor: pointer;
                position: relative;
              }
              .premium-checkbox:checked {
                background: #13C2C2;
                border-color: #13C2C2;
              }
              .premium-checkbox:checked::after {
                content: '✓';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #000;
                font-size: 10px;
                font-weight: bold;
              }
              /* Table row density refinement */
              .column-list-item {
                padding-top: 8px !important;
                padding-bottom: 8px !important;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
              }
              .column-list-header {
                padding-bottom: 12px !important;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
              }
              .discovery-filter-panel {
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 24px;
                backdrop-filter: blur(10px);
              }
              .leaderboard-container {
                background: 
                  radial-gradient(circle at 20% 0%, rgba(164, 80, 255, 0.08) 0%, transparent 40%),
                  radial-gradient(circle at 80% 10%, rgba(26, 198, 218, 0.08) 0%, transparent 40%),
                  #080808 !important;
              }
            `}</style>
            <ColumnList className='br-3'
              columns={whalesPosition}
              onlyDesc
              data={whalePositionsStore.list}
              busy={reqStore.whalePositionsBusy}
              sortColumnId={whalePositionsStore.sortColumnId}
              onChangeSort={handleWhalesPositionChangeSort}
              onRowClick={(item: any) => navigate(`/trader/${item.address}`)}
              renderItem={renderWhalesPositionItem} />
          </div>
        </div>
      </div>

      <ModalTradingStatistics />
      <TrackingCreateTrack />
      <ModalCreateCopyTrading />

      {memberModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setMemberModalOpen(false)}>
          <div style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '28px 32px', minWidth: '320px', maxWidth: '400px', position: 'relative' }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setMemberModalOpen(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
            <div className="d-flex align-items-center gap-2 mb-3">
              <svg width="18" height="18" viewBox="0 0 14 14" fill="none"><path d="M7 0.8L13.2 7L7 13.2L0.8 7L7 0.8Z" fill="#13C2C2"/><path d="M7 3.5L10.5 7L7 10.5L3.5 7L7 3.5Z" fill="rgba(255,255,255,0.45)"/></svg>
              <span className="fw-bold font-size-16" style={{ color: '#FAFAFA' }}>会员专享权益</span>
            </div>
            <p className="font-size-13 mb-2" style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
              需要会员才可以继续搜索，非会员只可以使用以下标签：
            </p>
            <p className="font-size-13 mb-4" style={{ color: '#13C2C2' }}>小资金，中等资金，巨鲸</p>
            <button style={{ width: '100%', padding: '10px 0', borderRadius: '8px', border: 'none', background: 'linear-gradient(90deg, #7C3AED, #06B6D4)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              开通会员
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default Leaderboard
