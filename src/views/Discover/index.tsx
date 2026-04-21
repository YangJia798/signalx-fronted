import { useEffect, useState } from 'react'
import { Button, Empty, Radio } from 'antd'
import { useTranslation } from 'react-i18next'

import { useDiscoverStore, useAccountStore, useReqStore, useDiscoverRecommendStore } from '@/stores'
import { DISCOVER_MOCK_RECOMMEND, DISCOVER_MOCK_LIST, DISCOVER_MOCK_POPULAR } from '@/stores/Discover/mock'
import {
  IOutlineFilter,
  IOutlineMenu1
} from '@/components/icon'
import DropdownMenu from '@/components/Dropdown/Menu'
import Busy from '@/components/Busy'
import TrackingAddressCard from '@/components/Tracking/AddressCard'
import TrackingCreateTrack from '@/components/Modal/TrackingCreateTrack'
import ModalCreateCopyTrading from '@/components/Modal/CreateCopyTrading'
import ModalTradingStatistics from '@/components/Modal/TradingStatistics'

import DiscoverKOL from './KOL'

const Discover = () => {
  const accountStore = useAccountStore()
  const reqStore = useReqStore()
  const discoverStore = useDiscoverStore()
  const discoverRecommendStore = useDiscoverRecommendStore()
  const { t } = useTranslation()


  const [memberModalOpen, setMemberModalOpen] = useState(false)

  const MemberBadge = () => (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M6.5 0.8L12.2 6.5L6.5 12.2L0.8 6.5L6.5 0.8Z" fill="#13C2C2"/>
      <path d="M6.5 3.2L9.8 6.5L6.5 9.8L3.2 6.5L6.5 3.2Z" fill="rgba(255,255,255,0.45)"/>
    </svg>
  )

  const handleChangeSelectCycle = async (value: string) => {
    discoverStore.selectedCycleValue = value
    await handleUpdateList(true)
  }


  const handleUpdateList = async (reset: boolean = false) => {
    if (reset) {
      discoverStore.resetList()
    }
    if (discoverStore.mainTypeValue === 'popular') {
      await reqStore.discoverRecommend(accountStore, discoverRecommendStore)
    } else if (discoverStore.mainTypeValue === 'all') {
      await reqStore.discoverList(accountStore, discoverStore)
    }
  }


  const handleNextPagePush = async () => {
    discoverStore.next()
    await handleUpdateList()
  }

  useEffect(() => {
    handleUpdateList()
    return () => {
      discoverStore.reset()
      discoverRecommendStore.reset()
    }
  }, [])

  const isPopular = discoverStore.mainTypeValue === 'popular'
  const list = isPopular ? discoverRecommendStore.list : discoverStore.list

  const finalItems = (() => {
    const hasData = list.length > 0
    if (hasData) return list

    // Fallback to mocks
    if (discoverStore.mainTypeValue === 'all') return DISCOVER_MOCK_LIST
    if (discoverStore.mainTypeValue === 'popular') return DISCOVER_MOCK_POPULAR
    return []
  })()

  const featuredTraders = (() => {
    const realFeatured = discoverRecommendStore.list.slice(0, 3)
    return realFeatured.length > 0 ? realFeatured : DISCOVER_MOCK_RECOMMEND
  })()

  const displayTotal = discoverStore.total

  return (
    <>
      <div className="discover-container overflow-hidden pt-5 mt-5" style={{ paddingTop: '120px' }}>
        <div className="container px-4">
          <div className="row g-4 mb-4 mt-4">
            {/* Left Side: Title and Tabs */}
            <div className="col-12 col-lg-6 ps-lg-4 pt-lg-2">
              <h1 className="fw-600 mb-0 discover-title-gradient" style={{ fontSize: '48px', fontFamily: 'Roboto, sans-serif', lineHeight: '1' }}>{t('discover.headline')}</h1>
              <p className="mb-0 discover-title-gradient" style={{ marginTop: '16px', fontSize: '18px', fontFamily: 'Roboto, sans-serif', lineHeight: '1' }}>{t('discover.subheadline')}</p>

              <div className="d-flex flex-column gap-3 mb-5" style={{ marginTop: '32px', maxWidth: '420px' }}>
                <div className="d-flex w-100">
                  <Radio.Group
                    value={discoverStore.mainTypeValue}
                    onChange={(e: any) => {
                      discoverStore.mainTypeValue = e.target.value
                      handleUpdateList(true)
                    }}
                    className="custom-radio-group-tabs-dark d-flex w-100"
                    buttonStyle="solid"
                  >
                    {discoverStore.mainTypeRadios.map(radio => (
                      <Radio.Button key={radio.value} value={radio.value} className="text-center" style={{ flex: 1 }}>
                        {t(radio.i18n) || radio.label}
                      </Radio.Button>
                    ))}
                  </Radio.Group>
                </div>

                {/* Template Selector placed directly under Tabs to align width perfectly */}
                {discoverStore.mainTypeValue === 'all' && (
                  <div className="d-flex align-items-center gap-2">
                    <div className="flex-grow-1 d-flex justify-content-between align-items-center px-3 cursor-pointer transition-2 hover-bg-white-5" 
                         style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', height: '40px' }}>
                      <span className="font-size-14" style={{ color: '#808080' }}>选择筛选模版</span>
                      <span className="font-size-12" style={{ color: '#808080' }}>▼</span>
                    </div>
                    <Button type="text" className="px-3 hover-up transition-3" 
                            style={{ border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.02)', color: '#808080', height: '40px', borderRadius: '4px' }} 
                            onClick={() => discoverStore.filterMainForce = 'all'}>重置</Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Featured Traders Column (Visible for Popular, KOL, AND All) */}
            {(isPopular || discoverStore.mainTypeValue === 'kol' || discoverStore.mainTypeValue === 'all') && (
              <div className="col-12 col-lg-6 d-flex flex-column gap-2 featured-column-offset">
                {featuredTraders.map((item, idx) => (
                  <TrackingAddressCard key={idx} item={item as any} variant="compact" />
                ))}
              </div>
            )}
          </div>


          <div className="discovery-content-section">
            {discoverStore.mainTypeValue !== 'kol' ? (
              <>


                {/* Filter Box */}
                {!isPopular && (
                  <div className="d-flex flex-column mb-4" style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '8px'
                  }}>
                    {/* Top Row */}
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 p-3 px-4 border-bottom" style={{ borderColor: 'rgba(255, 255, 255, 0.04)' }}>
                      <div className="d-flex align-items-center gap-4 flex-wrap">
                        <span className="font-size-14 fw-bold" style={{ color: '#FAFAFA' }}>已收录 {displayTotal.toLocaleString()} 个地址</span>
                        <div className="d-flex align-items-center gap-2">
                          <span className="font-size-12" style={{ color: '#808080' }}>排序</span>
                          <DropdownMenu
                            items={[
                              { label: '总盈亏', value: 'pnl' },
                              { label: '胜率', value: 'winRate' },
                              { label: '收益率', value: 'roi' },
                              { label: '交易量', value: 'vlm' },
                              { label: '总资产', value: 'accountTotalValue' },
                              { label: '当前持仓', value: 'currentPosition' },
                            ]}
                            selectedValue={discoverStore.sortByKey}
                            onSelect={async (value: string) => {
                              discoverStore.sortByKey = value
                              await handleUpdateList(true)
                            }}
                          />
                        </div>
                        <div className="d-flex align-items-center gap-2 cursor-pointer font-size-12" style={{ color: '#FAFAFA' }}>
                          <span>降序显示</span>
                          <IOutlineMenu1 />
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="font-size-12" style={{ color: '#808080' }}>周期</span>
                          <DropdownMenu
                            items={discoverStore.cycles}
                            selectedValue={discoverStore.selectedCycleValue}
                            onSelect={handleChangeSelectCycle}
                          />
                        </div>
                      </div>
                      {/* Right: 筛选币种 + 高级筛选 */}
                      <div className="d-flex align-items-center gap-2 ms-auto">
                        <div className="d-flex align-items-center justify-content-between px-3 cursor-pointer transition-2 hover-bg-white-5"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', height: '36px', minWidth: '200px' }}
                          onClick={() => setMemberModalOpen(true)}>
                          <span className="font-size-12" style={{ color: 'rgba(255,255,255,0.5)' }}>筛选币种</span>
                          <span className="font-size-10" style={{ color: 'rgba(255,255,255,0.3)' }}>▼</span>
                        </div>
                        <div className="d-flex align-items-center gap-2 px-3 cursor-pointer transition-2 hover-bg-white-5"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', height: '36px' }}
                          onClick={() => setMemberModalOpen(true)}>
                          <IOutlineFilter className="font-size-13" style={{ color: 'rgba(255,255,255,0.6)' }} />
                          <span className="font-size-12" style={{ color: 'rgba(255,255,255,0.6)' }}>高级筛选</span>
                        </div>
                      </div>
                    </div>

                    {/* Filter Rows */}
                    <div className="p-4 px-4 pb-3">
                      {/* Row 1: 账户总价值 | 盈利规模 | 方向偏好 */}
                      <div className="row g-4 mb-3">
                        <div className="col-12 col-md-4">
                          <div className="d-flex flex-column gap-2">
                            <span className="font-size-12" style={{ color: '#808080' }}>{t('discover.accountValue')}</span>
                            <div className="d-flex flex-wrap gap-4">
                              {[
                                { label: t('discover.smallFunds'), value: 'small' },
                                { label: t('discover.mediumFunds'), value: 'medium' },
                                { label: t('discover.whaleFunds'), value: 'whale' }
                              ].map(item => (
                                <label key={item.value} className="d-flex align-items-center gap-2 cursor-pointer font-size-12 transition-2 hover-color-primary"
                                  style={{ color: discoverStore.filterAccountValue.includes(item.value) ? '#13C2C2' : '#808080' }}>
                                  <input type="checkbox" className="premium-checkbox"
                                    checked={discoverStore.filterAccountValue.includes(item.value)}
                                    onChange={(e) => { discoverStore.filterAccountValue = e.target.checked ? [item.value] : [] }}
                                  /> {item.label}
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="col-12 col-md-4">
                          <div className="d-flex flex-column gap-2">
                            <span className="d-flex align-items-center gap-1 font-size-12" style={{ color: '#808080' }}>{t('discover.profitScale')} <MemberBadge /></span>
                            <div className="d-flex flex-wrap gap-4">
                              {[
                                { label: t('discover.smallProfit'), value: 'small' },
                                { label: t('discover.mediumProfit'), value: 'medium' },
                                { label: t('discover.largeProfit'), value: 'large' }
                              ].map(item => (
                                <div key={item.value} className="d-flex align-items-center gap-2 cursor-pointer font-size-12" style={{ color: '#808080' }}
                                  onClick={() => setMemberModalOpen(true)}>
                                  <input type="checkbox" className="premium-checkbox" readOnly checked={false} style={{ pointerEvents: 'none' }} /> {item.label}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="col-12 col-md-4">
                          <div className="d-flex flex-column gap-2">
                            <span className="d-flex align-items-center gap-1 font-size-12" style={{ color: '#808080' }}>{t('discover.sidePreference')} <MemberBadge /></span>
                            <div className="d-flex flex-wrap gap-4">
                              {[
                                { label: t('discover.bearish'), value: 'bearish' },
                                { label: t('discover.neutral'), value: 'neutral' },
                                { label: t('discover.bullish'), value: 'bullish' }
                              ].map(item => (
                                <div key={item.value} className="d-flex align-items-center gap-2 cursor-pointer font-size-12" style={{ color: '#808080' }}
                                  onClick={() => setMemberModalOpen(true)}>
                                  <input type="checkbox" className="premium-checkbox" readOnly checked={false} style={{ pointerEvents: 'none' }} /> {item.label}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Row 2: 交易节奏 | 盈利状态 | 联系客服 */}
                      <div className="row g-4 mb-3">
                        <div className="col-12 col-md-4">
                          <div className="d-flex flex-column gap-2">
                            <span className="d-flex align-items-center gap-1 font-size-12" style={{ color: '#808080' }}>{t('discover.tradingRhythm')} <MemberBadge /></span>
                            <div className="d-flex flex-wrap gap-4">
                              {[
                                { label: t('discover.longTerm'), value: 'long' },
                                { label: t('discover.swing'), value: 'swing' },
                                { label: t('discover.shortTerm'), value: 'short' },
                                { label: t('discover.scalping'), value: 'scalping' }
                              ].map(item => (
                                <div key={item.value} className="d-flex align-items-center gap-2 cursor-pointer font-size-12" style={{ color: '#808080' }}
                                  onClick={() => setMemberModalOpen(true)}>
                                  <input type="checkbox" className="premium-checkbox" readOnly checked={false} style={{ pointerEvents: 'none' }} /> {item.label}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="col-12 col-md-4">
                          <div className="d-flex flex-column gap-2">
                            <span className="d-flex align-items-center gap-1 font-size-12" style={{ color: '#808080' }}>{t('discover.profitStatus')} <MemberBadge /></span>
                            <div className="d-flex flex-wrap gap-4">
                              {[
                                { label: t('discover.consistentProfit'), value: 'consistent' },
                                { label: t('discover.volatileProfit'), value: 'volatile' },
                                { label: t('discover.breakEven'), value: 'breakeven' }
                              ].map(item => (
                                <div key={item.value} className="d-flex align-items-center gap-2 cursor-pointer font-size-12" style={{ color: '#808080' }}
                                  onClick={() => setMemberModalOpen(true)}>
                                  <input type="checkbox" className="premium-checkbox" readOnly checked={false} style={{ pointerEvents: 'none' }} /> {item.label}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="col-12 col-md-4 d-flex align-items-center">
                          <a href={import.meta.env.VITE_OFFICIAL_TELEGRAM || 'https://t.me/addlist/I1c2HyB-cYg4NDc8'}
                            target="_blank" rel="noopener noreferrer"
                            className="d-flex align-items-center gap-2 px-4 py-2 transition-2 hover-bg-white-5 text-decoration-none"
                            style={{ border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                            ✈ 联系客服 →
                          </a>
                        </div>
                      </div>

                      {/* Row 3: 交易风格 (full width) + 筛选 button */}
                      <div className="d-flex flex-column gap-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <span className="d-flex align-items-center gap-1 font-size-12" style={{ color: '#808080' }}>{t('discover.tradingStyle')} <MemberBadge /></span>
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                          <div className="d-flex flex-wrap gap-3 flex-grow-1">
                            {[
                              { label: t('discover.highFreqStable'), value: 'hfs' },
                              { label: t('discover.highFreqAggressive'), value: 'hfa' },
                              { label: t('discover.lowFreqStable'), value: 'lfs' },
                              { label: t('discover.lowFreqAggressive'), value: 'lfa' },
                              { label: t('discover.riskStable'), value: 'stable' },
                              { label: t('discover.highRiskHighReturn'), value: 'hrhr' },
                              { label: t('discover.asymmetricHigh'), value: 'ah' },
                              { label: t('discover.lowDrawdown'), value: 'ld' },
                              { label: t('discover.volatilityStrategy'), value: 'vs' }
                            ].map(item => (
                              <div key={item.value} className="d-flex align-items-center gap-2 cursor-pointer font-size-12" style={{ color: '#808080' }}
                                onClick={() => setMemberModalOpen(true)}>
                                <input type="checkbox" className="premium-checkbox" readOnly checked={false} style={{ pointerEvents: 'none' }} /> {item.label}
                              </div>
                            ))}
                          </div>
                          <Button className="px-4 d-flex align-items-center gap-2 flex-shrink-0"
                            style={{ height: '36px', borderColor: '#13C2C2', color: '#13C2C2', backgroundColor: 'transparent', borderRadius: '20px' }}
                            onClick={() => handleUpdateList(true)}>
                            <IOutlineFilter className="font-size-13" /> 筛选
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}



                {/* 5. Address List */}
                <Busy spinning={isPopular ? reqStore.discoverRecommendBusy : reqStore.discoverListBusy}>
                  <div className='row g-4 pb-5'>
                    {finalItems.length === 0 ? (
                      <div className="col-12 py-5 text-center opacity-40">
                        <Empty description="暂无数据" />
                      </div>
                    ) : (
                      finalItems.map((item, idx) => (
                        <div key={idx} className={discoverStore.mainTypeValue === 'all' ? 'col-12' : 'col-12 col-md-6 col-lg-4'}>
                          <TrackingAddressCard
                            item={item as any}
                            variant={
                              discoverStore.mainTypeValue === 'all' ? 'wide' :
                                discoverStore.mainTypeValue === 'popular' ? 'popular' : 'grid'
                            }
                          />
                        </div>
                      ))
                    )}

                    {!isPopular && (
                      <div className="col-12 d-flex justify-content-center pt-4">
                        {!discoverStore.isEnd ? (
                          <Button type='primary' ghost className='px-5' size='large' onClick={handleNextPagePush}>
                            {t('common.loadMore')}
                          </Button>
                        ) : (
                          <span className='color-unimportant'>{t('common.noMoreResults')}</span>
                        )}
                      </div>
                    )}
                  </div>
                </Busy>
              </>
            ) : (
              <DiscoverKOL />
            )}
          </div>
        </div >
      </div >

      <ModalTradingStatistics />
      <TrackingCreateTrack />
      <ModalCreateCopyTrading />

      {/* Member-only filter modal */}
      {memberModalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setMemberModalOpen(false)}
        >
          <div
            style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '28px 32px', minWidth: '320px', maxWidth: '400px', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMemberModalOpen(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}
            >×</button>
            <div className="d-flex align-items-center gap-2 mb-3">
              <svg width="18" height="18" viewBox="0 0 14 14" fill="none"><path d="M7 0.8L13.2 7L7 13.2L0.8 7L7 0.8Z" fill="#13C2C2"/><path d="M7 3.5L10.5 7L7 10.5L3.5 7L7 3.5Z" fill="rgba(255,255,255,0.45)"/></svg>
              <span className="fw-bold font-size-16" style={{ color: '#FAFAFA' }}>会员专享权益</span>
            </div>
            <p className="font-size-13 mb-2" style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
              需要会员才可以继续搜索，非会员只可以使用以下标签：
            </p>
            <p className="font-size-13 mb-4" style={{ color: '#13C2C2' }}>
              小资金，中等资金，巨鲸
            </p>
            <button
              style={{ width: '100%', padding: '10px 0', borderRadius: '8px', border: 'none', background: 'linear-gradient(90deg, #7C3AED, #06B6D4)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
            >开通会员</button>
          </div>
        </div>
      )}

      <style>{`
        .discover-container {
            min-height: 100vh;
            background: radial-gradient(circle at 50% 0%, rgba(23, 125, 220, 0.05) 0%, transparent 50%), #0d0d0d;
        }
        .discover-title-gradient {
            background: linear-gradient(90deg, #F8F8F8 50%, #939393 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .smart-trader-gradient {
            background: linear-gradient(90deg, #DEFAF6 -0.03%, #FFABFF 34.99%, #00B8D9 100.03%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 700;
        }
        .custom-radio-group-tabs-dark {
            display: flex !important;
            flex-wrap: nowrap !important;
            border-radius: 6px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.15);
        }
        .custom-radio-group-tabs-dark .ant-radio-button-wrapper {
            background: rgba(255, 255, 255, 0.02) !important;
            border: 0 !important;
            border-left: 1px solid rgba(255, 255, 255, 0.15) !important;
            color: #808080 !important;
            height: 40px !important;
            line-height: 38px !important;
            border-radius: 0 !important;
            margin-right: 0 !important;
            transition: all 0.3s;
            font-family: 'Roboto', sans-serif;
            font-size: 14px;
            box-shadow: none !important;
        }
        .custom-radio-group-tabs-dark .ant-radio-button-wrapper:first-child {
            border-left: 0 !important;
            border-radius: 6px 0 0 6px !important;
        }
        .custom-radio-group-tabs-dark .ant-radio-button-wrapper:last-child {
            border-radius: 0 6px 6px 0 !important;
        }
        .custom-radio-group-tabs-dark .ant-radio-button-wrapper-checked {
            background: rgba(19, 194, 194, 0.05) !important;
            color: #13C2C2 !important;
            box-shadow: 0 0 0 1px #13C2C2 inset !important;
            border-left-color: transparent !important;
            position: relative;
            z-index: 2;
        }
        .custom-radio-group-tabs-dark .ant-radio-button-wrapper-checked + .ant-radio-button-wrapper {
            border-left-color: transparent !important;
        }
        .custom-radio-group-tabs-dark .ant-radio-button-wrapper:hover {
            color: #FAFAFA !important;
        }
        .custom-radio-group-tabs-dark .ant-radio-button-wrapper-checked::after {
            display: none !important;
        }
        .custom-radio-group-tabs-dark .ant-radio-button-wrapper::before {
            display: none !important;
        }
        
        .featured-column-offset {
            margin-top: -10px;
        }
        .transition-2 {
            transition: all 0.2s ease;
        }
        .transition-3 {
            transition: all 0.3s ease;
        }
        .border-white-5 {
            border-color: rgba(255,255,255,0.05) !important;
        }
        
        /* Premium UI Styles */
        .glass-row {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .featured-column-offset {
          padding-top: 0px;
        }
        @media (max-width: 991px) {
          .featured-column-offset { padding-top: 0; margin-top: 24px; }
        }

        .discovery-filter-panel {
          background: transparent;
        }
        
        .premium-checkbox {
          appearance: none;
          width: 16px;
          height: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.05);
          cursor: pointer;
          position: relative;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .premium-checkbox:checked {
          background: #13C2C2;
          border-color: #13C2C2;
        }
        .premium-checkbox:checked::after {
          content: '';
          position: absolute;
          left: 4.5px;
          top: 1.5px;
          width: 4px;
          height: 8px;
          border: solid white;
          border-width: 0 1.5px 1.5px 0;
          transform: rotate(45deg);
        }
        .premium-checkbox:hover {
          border-color: rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.1);
        }
        
        .teal-outline-btn {
          height: 38px !important;
          background: transparent !important;
          border: 1px solid #13C2C2 !important;
          color: #13C2C2 !important;
          font-weight: 500 !important;
          box-shadow: none !important;
        }
        .teal-outline-btn:hover {
          background: rgba(19, 194, 194, 0.05) !important;
          border-color: #13C2C2 !important;
          color: #13C2C2 !important;
          opacity: 0.85;
        }

        .ls-1 { letter-spacing: 1px; }
        .bg-white-2 { background: rgba(255, 255, 255, 0.02); }
        .border-start-white-5 { border-left: 1px solid rgba(255, 255, 255, 0.05); }
        @media (max-width: 768px) {
          .border-start-white-5 { border-left: none; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 16px; margin-top: 16px; }
        }
      `}</style>
    </>
  )
}

export default Discover
