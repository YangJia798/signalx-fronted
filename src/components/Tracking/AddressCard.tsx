import { useTranslation } from 'react-i18next'
import BN from 'bignumber.js'
import { formatNumber } from '@/utils'

import { IOutlineChart2, IOutlineMonitor, IOutlineShare } from '@/components/icon'
import { useDiscoverTradingStatisticsStore, useCopyTradingStore, useTrackingCreateStore } from '@/stores'
import PositionItemAddress from '@/components/PositionItem/Address'
import PositionItemCommonPnl from '@/components/PositionItem/CommonPnl'
import MiniChartBaseline from '@/components/MiniChart/Baseline'
import SideButtonIcon from '@/components/Side/ButtonIcon'

interface TTradersItem {
  address: string
  sharpe?: string
  maxDrawdown?: string
  totalPositions?: number
  winRate?: number | string
  longWinRate?: number | string
  shortWinRate?: number | string
  accountTotalValue?: number | string
  perpValue?: number | string
  spotValue?: number | string
  pnl?: number | string
  longPnl?: number | string
  shortPnl?: number | string
  pnlList?: any[]
  rank?: number
  name?: string
  label?: string
  tags?: string[]
}

const TrackingAddressCard = ({ item, variant = 'grid' }: { item: TTradersItem, variant?: 'grid' | 'wide' | 'compact' | 'popular' }) => {
  const copyTradingStore = useCopyTradingStore()
  const trackingCreateStore = useTrackingCreateStore()
  const discoverTradingStatisticsStore = useDiscoverTradingStatisticsStore()
  const { t } = useTranslation()

  const handleOpenQuickerCreateCopyTrade = (itemAddress: string) => {
    copyTradingStore.quickerOpenPositionTargetAddress = itemAddress
    copyTradingStore.openCopyTradingTarget = true
  }

  const handleOpenTradingStatistics = (itemAddress: string) => {
    discoverTradingStatisticsStore.address = itemAddress
    discoverTradingStatisticsStore.openModal = true
  }

  const handleOpenCreateTrackAddress = async (itemAddress: string) => {
    trackingCreateStore.quickCreateTrackAddress = itemAddress
    trackingCreateStore.openCreateTracking = true
  }

  if (variant === 'compact') {
    return (
      <div className="d-flex flex-column p-3 mb-2 hover-bg-white-5 transition-3" style={{ borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(255, 255, 255, 0.03)' }}>
        <div className="d-flex justify-content-between mb-2">
          <div className="d-flex align-items-center gap-2">
            <PositionItemAddress avatar className="fw-bold font-size-14 m-0" item={item} />
            <span className="font-size-12 text-truncate" style={{ maxWidth: '180px', color: '#808080' }}>{item.name || 'Trader'} 【{item.label || '...'}】</span>
          </div>
          <div className="d-flex gap-2">
            {[
              { icon: <IOutlineChart2 className="zoom-80 opacity-60" />, title: t('common.tradingStatistics'), onClick: () => handleOpenTradingStatistics(item.address) },
              { icon: <IOutlineMonitor className="zoom-80 opacity-60" />, title: t('common.trackAddress'), logged: true, onClick: () => handleOpenCreateTrackAddress(item.address) },
              { icon: <IOutlineShare className="zoom-80 opacity-60" />, title: t('common.copyTrading'), logged: true, onClick: () => handleOpenQuickerCreateCopyTrade(item.address) },
            ].map((action, idx) => (
              <SideButtonIcon key={idx} title={action.title} onClick={action.onClick} logged={action.logged} icon={action.icon} />
            ))}
          </div>
        </div>
        <div className="d-flex justify-content-between align-items-start mt-2">
          <div className="d-flex flex-column" style={{ flex: '1 1 0' }}>
             <span className="font-size-13 mb-1" style={{ color: '#808080' }}>账户总价值</span>
             <span className="font-size-12" style={{ color: '#FAFAFA' }}>$ {Number(item.accountTotalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="d-flex flex-column" style={{ flex: '1 1 0' }}>
             <span className="font-size-12 mb-1" style={{ color: '#808080' }}>净盈亏</span>
             <PositionItemCommonPnl value={item.pnl || 0} className="font-size-12" />
          </div>
          <div className="d-flex flex-column" style={{ flex: '1 1 0' }}>
             <span className="font-size-12 mb-1" style={{ color: '#808080' }}>平仓次数</span>
             <span className="font-size-12" style={{ color: '#FAFAFA' }}>{item.totalPositions || 0}</span>
          </div>
          <div className="d-flex flex-column" style={{ flex: '1 1 0' }}>
             <span className="font-size-12 mb-1" style={{ color: '#808080' }}>胜率</span>
             <span className="font-size-12" style={{ color: '#FAFAFA' }}>{item.winRate ? `${item.winRate}%` : '-%'}</span>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'popular') {
    return (
      <div className="d-flex flex-column h-100 transition-3" style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '4px',
        padding: '20px'
      }}>
        {/* Header: Address & Actions */}
        <div className="d-flex align-items-center justify-content-between mb-1">
          <PositionItemAddress avatar className="fw-bold font-size-14 mb-0" item={item} />
          <div className="d-flex gap-1">
            {[
              { icon: <IOutlineChart2 className="zoom-75 opacity-60" />, title: t('common.tradingStatistics'), onClick: () => handleOpenTradingStatistics(item.address) },
              { icon: <IOutlineMonitor className="zoom-75 opacity-60" />, title: t('common.trackAddress'), logged: true, onClick: () => handleOpenCreateTrackAddress(item.address) },
              { icon: <IOutlineShare className="zoom-75 opacity-60" />, title: t('common.copyTrading'), logged: true, onClick: () => handleOpenQuickerCreateCopyTrade(item.address) },
            ].map((action, idx) => (
              <SideButtonIcon key={idx} title={action.title} onClick={action.onClick} logged={action.logged} icon={action.icon} />
            ))}
          </div>
        </div>

        {/* Bio/Description */}
        <div className="mb-3">
          <span className="font-size-12 d-block" style={{ color: '#808080' }}>{item.name || 'Professional Trader'} 【{item.label || '...'}】</span>
        </div>

        {/* Account Total Value */}
        <div className="d-flex flex-column mb-3">
          <span className="font-size-12 mb-1" style={{ color: '#808080' }}>账户总价值</span>
          <span className="fw-bold" style={{ color: '#FAFAFA', fontSize: '20px', lineHeight: '24px' }}>$ {Number(item.accountTotalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>

        {/* Secondary Metrics Row */}
        <div className="d-flex mb-3" style={{ gap: '0' }}>
          <div className="d-flex flex-column" style={{ flex: '1 1 0' }}>
            <span className="font-size-12" style={{ color: '#808080' }}>净盈亏(1月)</span>
            <div className="font-size-12 fw-500 mt-1">
              <PositionItemCommonPnl value={item.pnl || 0} />
            </div>
          </div>
          <div className="d-flex flex-column" style={{ flex: '0 0 auto', minWidth: '70px' }}>
            <span className="font-size-12" style={{ color: '#808080' }}>当前持仓</span>
            <span className="font-size-12 fw-500 mt-1" style={{ color: '#FAFAFA' }}>{item.totalPositions || 0}</span>
          </div>
          <div className="d-flex flex-column" style={{ flex: '0 0 auto', minWidth: '70px' }}>
            <span className="font-size-12" style={{ color: '#808080' }}>胜率(1月)</span>
            <span className="font-size-12 fw-500 mt-1" style={{ color: '#FAFAFA' }}>{item.winRate || '-'}%</span>
          </div>
        </div>

        {/* Tags Footer */}
        {item.tags && item.tags.length > 0 && (
          <div className="d-flex flex-column mt-auto">
            <span className="font-size-12 mb-2" style={{ color: '#808080' }}>AI 标签</span>
            <div className="d-flex flex-wrap gap-2">
              {item.tags.map((tag: string) => (
                <span key={tag} className="px-2 font-size-12"
                  style={{ color: '#13C2C2', background: 'rgba(19, 194, 194, 0.08)', borderRadius: '2px', lineHeight: '22px' }}>
                  {t(tag)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (variant === 'wide') {
    return (
      <div className="d-flex flex-column br-3 p-3 mb-3 bg-gray-alpha-2 border-white-5 hover-border-primary transition-3 shadow-sm">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <PositionItemAddress avatar className="fw-bold h6 mb-0" item={item} />
          <div className="d-flex gap-2">
            {[
              { icon: <IOutlineChart2 className="zoom-85" />, title: t('common.tradingStatistics'), onClick: () => handleOpenTradingStatistics(item.address) },
              { icon: <IOutlineMonitor className="zoom-85" />, title: t('common.trackAddress'), logged: true, onClick: () => handleOpenCreateTrackAddress(item.address) },
              { icon: <IOutlineShare className="zoom-85" />, title: t('common.copyTrading'), logged: true, onClick: () => handleOpenQuickerCreateCopyTrade(item.address) },
            ].map((action, idx) => (
              <SideButtonIcon key={idx} title={action.title} onClick={action.onClick} logged={action.logged} icon={action.icon} />
            ))}
          </div>
        </div>

        <div className="row g-4 align-items-center">
          <div className="col-lg-2 col-md-4">
            <div className="d-flex flex-column gap-2">
              <div className="d-flex flex-wrap gap-1 mb-1">
                {(item.tags || []).map((tag: string) => {
                  const cls =
                    tag === '偏多头' ? 'bg-buy-alpha-2 color-buy border-buy-alpha-2' :
                    tag === '偏空头' ? 'bg-sell-alpha-2 color-sell border-sell-alpha-2' :
                    ['大额盈利','中等盈利','小额盈利'].includes(tag) ? 'bg-primary-alpha-2 color-primary border-primary-alpha-2' :
                    ['巨鲸','中等资金','小资金'].includes(tag) ? 'bg-orange-alpha-2 color-orange border-orange-alpha-2' :
                    'bg-purple-alpha-2 color-purple border-purple-alpha-2'
                  return <span key={tag} className={`px-1 py-0.5 br-1 font-size-10 fw-500 ${cls}`}>{tag}</span>
                })}
              </div>
              <div className="d-flex flex-column gap-1">
                <div className="d-flex justify-content-between"><span className="opacity-60 font-size-11">盈亏比</span><span className="fw-bold font-size-12">{item.sharpe || '-'}</span></div>
                <div className="d-flex justify-content-between"><span className="opacity-60 font-size-11">最大回撤</span><span className="fw-bold font-size-12 text-danger">{item.maxDrawdown || '0.00'}%</span></div>
                <div className="d-flex justify-content-between"><span className="opacity-60 font-size-11">持仓</span><span className="fw-bold font-size-12">{item.totalPositions || 0}</span></div>
              </div>
            </div>
          </div>

          <div className="col-lg-2 col-md-4 border-start border-white-5">
            <div className="d-flex flex-column gap-1">
              <span className="opacity-60 font-size-11">胜率</span>
              <span className="fw-bold font-size-18">{item.winRate || '0'}%</span>
              <div className="d-flex flex-column gap-1 mt-1 opacity-80">
                <div className="d-flex justify-content-between"><small className="font-size-10">做多</small><small className="font-size-10">{item.longWinRate || '0'}%</small></div>
                <div className="d-flex justify-content-between"><small className="font-size-10">做空</small><small className="font-size-10">{item.shortWinRate || '0'}%</small></div>
              </div>
            </div>
          </div>

          <div className="col-lg-2 col-md-4 border-start border-white-5">
            <div className="d-flex flex-column gap-1">
              <span className="opacity-60 font-size-11">账户总价值</span>
              <span className="fw-bold font-size-18">$ {formatNumber(item.accountTotalValue || '0.00')}</span>
              <div className="d-flex flex-column gap-1 mt-1 opacity-80">
                <div className="d-flex justify-content-between"><small className="font-size-10">永续合约</small><small className="font-size-10">$ {formatNumber(item.perpValue || '0.00')}</small></div>
                <div className="d-flex justify-content-between"><small className="font-size-10">现货</small><small className="font-size-10">$ {formatNumber(item.spotValue || '0.00')}</small></div>
              </div>
            </div>
          </div>

          <div className="col-lg-2 col-md-4 border-start border-white-5">
            {(() => {
              const lp = parseFloat(String(item.longPnl || 0))
              const sp = parseFloat(String(item.shortPnl || 0))
              const netPnl = (lp !== 0 || sp !== 0) ? new BN(lp).plus(sp).toFixed(2) : item.pnl
              return (
                <div className="d-flex flex-column gap-1">
                  <span className="opacity-60 font-size-11">净盈亏</span>
                  <PositionItemCommonPnl value={netPnl || 0} className="fw-bold font-size-18" />
                  <div className="d-flex flex-column gap-1 mt-1 opacity-80">
                    <div className="d-flex justify-content-between"><small className="font-size-10">做多</small><PositionItemCommonPnl value={item.longPnl || 0} className="font-size-10" /></div>
                    <div className="d-flex justify-content-between"><small className="font-size-10">做空</small><PositionItemCommonPnl value={item.shortPnl || 0} className="font-size-10" /></div>
                  </div>
                </div>
              )
            })()}
          </div>

          <div className="col-lg-4 col-md-12 d-flex flex-column align-items-end">
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="opacity-60 font-size-11">总盈亏</span>
              <PositionItemCommonPnl value={item.pnl || 0} className="font-size-11" />
            </div>
            <div className="w-100 h-60px mt-1">
              <MiniChartBaseline data={item.pnlList || []} width={280} height={60} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="d-flex flex-column br-3 p-3 mb-3 h-100 bg-gray-alpha-2 border-white-5 hover-bg-white-5 transition-3 shadow-sm">
      {/* Header: Address & Actions */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <PositionItemAddress avatar className="fw-bold h6 mb-0" item={item} />
        <div className="d-flex gap-2">
          {[
            { icon: <IOutlineChart2 className="zoom-85" />, title: t('common.tradingStatistics'), onClick: () => handleOpenTradingStatistics(item.address) },
            { icon: <IOutlineMonitor className="zoom-85" />, title: t('common.trackAddress'), logged: true, onClick: () => handleOpenCreateTrackAddress(item.address) },
            { icon: <IOutlineShare className="zoom-85" />, title: t('common.copyTrading'), logged: true, onClick: () => handleOpenQuickerCreateCopyTrade(item.address) },
          ].map((action, idx) => (
            <SideButtonIcon key={idx} title={action.title} onClick={action.onClick} logged={action.logged} icon={action.icon} />
          ))}
        </div>
      </div>

      {/* Main Grid: 5 Blocks */}
      <div className="row g-3 flex-grow-1">
        {/* Block 1: Multi-Metrics + Tags */}
        <div className="col-4">
          <div className="d-flex flex-column gap-2">
            <div className="d-flex flex-wrap gap-1 mb-1">
              <span className="px-1 py-0.5 br-1 font-size-10 fw-500" style={{ background: 'rgba(0, 210, 255, 0.1)', color: '#00d2ff', border: '1px solid rgba(0, 210, 255, 0.2)' }}>低回撤</span>
              <span className="px-1 py-0.5 br-1 font-size-10 fw-500" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.2)' }}>波段</span>
            </div>
            <div className="d-flex justify-content-between align-items-center">
              <span className="color-secondary font-size-11 opacity-60">Sharpe</span>
              <span className="fw-bold font-size-12">{item.sharpe || '0.00'}</span>
            </div>
            <div className="d-flex justify-content-between align-items-center">
              <span className="color-secondary font-size-11 opacity-60">Max DD</span>
              <span className="fw-bold font-size-12 text-danger">{item.maxDrawdown || '0.00'} %</span>
            </div>
            <div className="d-flex justify-content-between align-items-center">
              <span className="color-secondary font-size-11 opacity-60">Pos</span>
              <span className="fw-bold font-size-12">{item.totalPositions || 0}</span>
            </div>
          </div>
        </div>

        {/* Block 2: Win Rate */}
        <div className="col-4 border-start border-white-5 ps-3">
          <div className="d-flex flex-column gap-1">
            <span className="color-secondary font-size-11 opacity-60">Win Rate</span>
            <span className="fw-bold font-size-16 mb-1">{item.winRate}%</span>
            <div className="d-flex flex-column gap-0 opacity-80">
              <div className="d-flex justify-content-between">
                <small className="color-secondary font-size-10">L</small>
                <small className="fw-500 font-size-10">{item.longWinRate}%</small>
              </div>
              <div className="d-flex justify-content-between">
                <small className="color-secondary font-size-10">S</small>
                <small className="fw-500 font-size-10">{item.shortWinRate}%</small>
              </div>
            </div>
          </div>
        </div>

        {/* Block 3: Account Value */}
        <div className="col-4 border-start border-white-5 ps-3">
          <div className="d-flex flex-column gap-1">
            <span className="color-secondary font-size-11 opacity-60">Value</span>
            <div className="fw-bold font-size-12 text-truncate">
              <PositionItemCommonPnl value={item.accountTotalValue || 0} />
            </div>
            <div className="d-flex flex-column gap-0 opacity-80 mt-1">
              <div className="d-flex justify-content-between">
                <small className="color-secondary font-size-10">Perp</small>
                <small className="fw-500 font-size-10 text-truncate ms-1"><PositionItemCommonPnl value={item.perpValue || 0} /></small>
              </div>
              <div className="d-flex justify-content-between">
                <small className="color-secondary font-size-10">Spot</small>
                <small className="fw-500 font-size-10 text-truncate ms-1"><PositionItemCommonPnl value={item.spotValue || 0} /></small>
              </div>
            </div>
          </div>
        </div>

        {/* Block 4: Net PnL */}
        <div className="col-7 pt-2 border-top border-white-5">
          <div className="d-flex flex-column gap-1">
            <span className="color-secondary font-size-11 opacity-60">Net PnL</span>
            <div className="fw-bold font-size-16">
              <PositionItemCommonPnl value={item.pnl || 0} />
            </div>
            <div className="d-flex gap-3">
              <div className="d-flex flex-column">
                <small className="color-secondary font-size-10">Long PnL</small>
                <small className="fw-500 font-size-10"><PositionItemCommonPnl value={item.longPnl || 0} /></small>
              </div>
              <div className="d-flex flex-column">
                <small className="color-secondary font-size-10">Short PnL</small>
                <small className="fw-500 font-size-10"><PositionItemCommonPnl value={item.shortPnl || 0} /></small>
              </div>
            </div>
          </div>
        </div>

        {/* Block 5: Chart */}
        <div className="col-5 pt-2 border-top border-white-5">
          <div className="d-flex flex-column gap-1 align-items-end h-100">
            <span className="color-secondary font-size-11 opacity-60 w-100 text-end">7D History</span>
            <div className="mt-auto pointer-events-none" style={{ width: '100%', height: '32px' }}>
              <MiniChartBaseline data={item.pnlList || []} mini width={100} height={32} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrackingAddressCard