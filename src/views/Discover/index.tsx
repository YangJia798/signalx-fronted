import { useEffect } from 'react'
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

  const displayTotal = isPopular ? (discoverRecommendStore.list.length || DISCOVER_MOCK_POPULAR.length) : (discoverStore.total || finalItems.length)

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


                {/* 2 & 3. Unified Statistical & Advanced Filter Box */}
                {!isPopular && (
                  <div className="d-flex flex-column mb-4" style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '8px'
                  }}>
                    {/* Top Row: Statistics, Sorting, VIP Dropdown */}
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 p-3 px-4 border-bottom" style={{ borderColor: 'rgba(255, 255, 255, 0.04)' }}>
                      <div className="d-flex align-items-center gap-4">
                        <span className="font-size-14 fw-bold" style={{ color: '#FAFAFA' }}>已收录 {displayTotal.toLocaleString()} 个地址</span>

                        <div className="d-flex align-items-center gap-4">
                          <div className="d-flex align-items-center gap-2">
                            <span className="font-size-12" style={{ color: '#808080' }}>排序</span>
                            <DropdownMenu
                              items={[
                                { label: '总盈亏', value: 'pnl' },
                                { label: '收益率', value: 'roi' },
                                { label: '交易量', value: 'vlm' },
                                { label: '总资产', value: 'accountTotalValue' },
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
                      </div>

                      {/* Right End: Premium Tool */}
                      <div className="d-flex flex-column align-items-start" style={{ background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.05) 100%)', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '12px 16px', borderRadius: '6px', minWidth: '320px', marginLeft: 'auto' }}>
                        <span className="font-size-12 fw-bold mb-2" style={{ color: '#FAFAFA' }}>会员专享权益，限时体验</span>
                        <div className="d-flex w-100 align-items-center gap-3">
                          <div className="d-flex justify-content-between align-items-center px-3 py-1 flex-grow-1 cursor-pointer transition-2 hover-bg-white-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', height: '32px' }}>
                            <span className="font-size-12" style={{ color: 'rgba(255,255,255,0.6)' }}>筛选币种</span>
                            <span className="font-size-10" style={{ color: 'rgba(255,255,255,0.4)' }}>▼</span>
                          </div>
                          <div className="d-flex justify-content-center align-items-center gap-2 px-2 py-1 cursor-pointer transition-2 hover-bg-white-5" style={{ height: '32px', borderRadius: '4px' }}>
                            <IOutlineFilter className="font-size-14" style={{ color: 'rgba(255,255,255,0.8)' }} />
                            <span className="font-size-12" style={{ color: 'rgba(255,255,255,0.8)' }}>高级筛选</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Checkboxes */}
                    <div className="p-4 px-4 pb-0">
                      <div className="row g-4 mb-4">
                        {/* Col 1: Account Value */}
                        <div className="col-12 col-md-4">
                          <div className="d-flex flex-column gap-2 mb-3">
                            <span className="font-size-12 mb-1" style={{ color: '#808080' }}>{t('discover.accountValue')}</span>
                            <div className="d-flex flex-wrap gap-4">
                              {[
                                { label: t('discover.smallFunds'), value: 'small' },
                                { label: t('discover.mediumFunds'), value: 'medium' },
                                { label: t('discover.whaleFunds'), value: 'whale' }
                              ].map(item => (
                                <label key={item.value} className="d-flex align-items-center gap-2 cursor-pointer font-size-12 transition-2 hover-color-primary" style={{ color: discoverStore.filterAccountValue.includes(item.value) ? '#13C2C2' : '#808080' }}>
                                  <input type="checkbox" className="premium-checkbox"
                                    checked={discoverStore.filterAccountValue.includes(item.value)}
                                    onChange={(e) => {
                                      if (e.target.checked) discoverStore.filterAccountValue.push(item.value)
                                      else discoverStore.filterAccountValue = discoverStore.filterAccountValue.filter(v => v !== item.value)
                                    }}
                                  /> {item.label}
                                </label>
                              ))}
                            </div>
                          </div>
                          
                          <div className="d-flex flex-column gap-2 mt-4">
                            <span className="font-size-12 mb-1" style={{ color: '#808080' }}>{t('discover.tradingRhythm')}</span>
                            <div className="d-flex flex-wrap gap-4">
                              {[
                                { label: t('discover.longTerm'), value: 'long' },
                                { label: t('discover.swing'), value: 'swing' },
                                { label: t('discover.shortTerm'), value: 'short' },
                                { label: t('discover.scalping'), value: 'scalping' }
                              ].map(item => (
                                <label key={item.value} className="d-flex align-items-center gap-2 cursor-pointer font-size-12 transition-2 hover-color-primary" style={{ color: discoverStore.filterTradingRhythm.includes(item.value) ? '#13C2C2' : '#808080' }}>
                                  <input type="checkbox" className="premium-checkbox"
                                    checked={discoverStore.filterTradingRhythm.includes(item.value)}
                                    onChange={(e) => {
                                      if (e.target.checked) discoverStore.filterTradingRhythm.push(item.value)
                                      else discoverStore.filterTradingRhythm = discoverStore.filterTradingRhythm.filter(v => v !== item.value)
                                    }}
                                  /> {item.label}
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Col 2: Profit Scale & Status */}
                        <div className="col-12 col-md-4">
                          <div className="d-flex flex-column gap-2 mb-3">
                            <span className="font-size-12 mb-1" style={{ color: '#808080' }}>{t('discover.profitScale')}</span>
                            <div className="d-flex flex-wrap gap-4">
                              {[
                                { label: t('discover.smallProfit'), value: 'small' },
                                { label: t('discover.mediumProfit'), value: 'medium' },
                                { label: t('discover.largeProfit'), value: 'large' }
                              ].map(item => (
                                <label key={item.value} className="d-flex align-items-center gap-2 cursor-pointer font-size-12 transition-2 hover-color-primary" style={{ color: discoverStore.filterPnlScale.includes(item.value) ? '#13C2C2' : '#808080' }}>
                                  <input type="checkbox" className="premium-checkbox"
                                    checked={discoverStore.filterPnlScale.includes(item.value)}
                                    onChange={(e) => {
                                      if (e.target.checked) discoverStore.filterPnlScale.push(item.value)
                                      else discoverStore.filterPnlScale = discoverStore.filterPnlScale.filter(v => v !== item.value)
                                    }}
                                  /> {item.label}
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="d-flex flex-column gap-2 mt-4">
                            <span className="font-size-12 mb-1" style={{ color: '#808080' }}>{t('discover.profitStatus')}</span>
                            <div className="d-flex flex-wrap gap-4">
                              {[
                                { label: t('discover.consistentProfit'), value: 'consistent' },
                                { label: t('discover.volatileProfit'), value: 'volatile' },
                                { label: t('discover.breakEven'), value: 'breakeven' }
                              ].map(item => (
                                <label key={item.value} className="d-flex align-items-center gap-2 cursor-pointer font-size-12 transition-2 hover-color-primary" style={{ color: discoverStore.filterPnlStatus.includes(item.value) ? '#13C2C2' : '#808080' }}>
                                  <input type="checkbox" className="premium-checkbox"
                                    checked={discoverStore.filterPnlStatus.includes(item.value)}
                                    onChange={(e) => {
                                      if (e.target.checked) discoverStore.filterPnlStatus.push(item.value)
                                      else discoverStore.filterPnlStatus = discoverStore.filterPnlStatus.filter(v => v !== item.value)
                                    }}
                                  /> {item.label}
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Col 3: Side Preference */}
                        <div className="col-12 col-md-4">
                          <div className="d-flex flex-column gap-2 mb-3">
                            <span className="font-size-12 mb-1" style={{ color: '#808080' }}>{t('discover.sidePreference')}</span>
                            <div className="d-flex flex-wrap gap-4">
                              {[
                                { label: t('discover.bearish'), value: 'bearish' },
                                { label: t('discover.neutral'), value: 'neutral' },
                                { label: t('discover.bullish'), value: 'bullish' }
                              ].map(item => (
                                <label key={item.value} className="d-flex align-items-center gap-2 cursor-pointer font-size-12 transition-2 hover-color-primary" style={{ color: discoverStore.filterSidePreference.includes(item.value) ? '#13C2C2' : '#808080' }}>
                                  <input type="checkbox" className="premium-checkbox"
                                    checked={discoverStore.filterSidePreference.includes(item.value)}
                                    onChange={(e) => {
                                      if (e.target.checked) discoverStore.filterSidePreference.push(item.value)
                                      else discoverStore.filterSidePreference = discoverStore.filterSidePreference.filter(v => v !== item.value)
                                    }}
                                  /> {item.label}
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Trading Style Row (Full Width) */}
                      <div className="d-flex flex-column gap-2 pb-3 mb-1" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                         <span className="font-size-12 mb-1" style={{ color: '#808080' }}>{t('discover.tradingStyle')}</span>
                         <div className="d-flex align-items-center justify-content-between flex-wrap gap-4">
                            <div className="d-flex flex-wrap gap-y-3 col" style={{ maxWidth: 'calc(100% - 180px)' }}>
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
                                <label key={item.value} className="d-flex align-items-center gap-2 cursor-pointer font-size-12 transition-2 hover-color-primary" style={{ marginRight: '24px', color: discoverStore.filterTradingStyle.includes(item.value) ? '#13C2C2' : '#808080' }}>
                                  <input type="checkbox" className="premium-checkbox"
                                    checked={discoverStore.filterTradingStyle.includes(item.value)}
                                    onChange={(e) => {
                                      if (e.target.checked) discoverStore.filterTradingStyle.push(item.value)
                                      else discoverStore.filterTradingStyle = discoverStore.filterTradingStyle.filter(v => v !== item.value)
                                    }}
                                  /> {item.label}
                                </label>
                              ))}
                            </div>
                            <Button type="primary" className="px-4 transition-3 rounded-pill teal-outline-btn d-flex align-items-center gap-2"
                              style={{ height: '32px', borderColor: '#13C2C2', color: '#13C2C2', backgroundColor: 'transparent' }}
                              onClick={() => handleUpdateList(true)}>
                              <IOutlineFilter className="font-size-14" /> 筛选
                            </Button>
                         </div>
                      </div>

                      {/* Very Bottom Bar: "平均杠杆 < 5 [移除]" ... */}
                      <div className="d-flex align-items-center py-3">
                         <div className="d-flex align-items-center gap-2 cursor-pointer font-size-12" style={{ color: '#FAFAFA' }}>
                            <span style={{ color: '#808080' }}>平均杠杆 {'<'} 5</span>
                            <span className="ms-1 px-1">🗑️ 移除</span>
                         </div>
                         <div className="ms-auto font-size-12 cursor-pointer hover-color-white" style={{ color: '#808080' }}>清除</div>
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
