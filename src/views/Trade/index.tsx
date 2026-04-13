import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next'

import { useHyperStore, useTradeStore, useTraderDetailsPositionsStore, useTraderDetailsOpenOrdersAdditionalStore, useAccountStore, usePrivateWalletStore, useReqStore } from '@/stores'
import { formatNumber } from '@/utils'
import TabSwitch from '@/components/Tab/Switch'
import { useHyperWSContext } from '@/components/Hyper/WSContext';

import TraderDetailsNonFunding from '@/views/TraderDetails/NonFunding'
import TraderDetailsTWAP from '@/views/TraderDetails/TWAP'
import TraderDetailsRecentFills from '@/views/TraderDetails/RecentFills'
import { TraderDetailsOpenOrdersAdditional } from '@/views/TraderDetails/OpenOrdersAdditional'
import TraderDetailsPositions from '@/views/TraderDetails/Positions'
import TraderDetailsHistoricalOrders from '@/views/TraderDetails/HistoricalOrders'
import TraderDetailsCompletedTrades from '@/views/TraderDetails/CompletedTrades'

import TradeTrades from './Trades'
import TradeMetaAndMarket from './MetaAndMarket'
import TradeKLine from './KLine'
import TradeTradingPanel from './TradingPanel'
import TradeOrderBook from './OrderBook'


const Trade = () => {
  const hyperStore = useHyperStore()
  const tradeStore = useTradeStore()
  const traderDetailsPositionsStore = useTraderDetailsPositionsStore()
  const traderDetailsOpenOrdersAdditionalStore = useTraderDetailsOpenOrdersAdditionalStore()

  const { coin } = useParams()
  const { t, i18n } = useTranslation()
  const accountStore = useAccountStore()
  const privateWalletStore = usePrivateWalletStore()
  const reqStore = useReqStore()
  const { sendMessage, lastMessage, readyState } = useHyperWSContext()

  useEffect(() => {
    tradeStore.coin = coin ?? tradeStore.DEFAULT_COIN

    if (accountStore.logged) {
      reqStore.userPrivateWallet(accountStore, privateWalletStore).then(() => {
        if (privateWalletStore.list.length > 0 && privateWalletStore.operaWalletIdx === -1) {
          privateWalletStore.operaWalletIdx = 0
        }
      })
    }
  }, [coin, accountStore.logged])

  useEffect(() => {
    if (privateWalletStore.list.length > 0) {
      const activeWallet = privateWalletStore.list[privateWalletStore.operaWalletIdx === -1 ? 0 : privateWalletStore.operaWalletIdx] || privateWalletStore.list[0];
      tradeStore.address = activeWallet?.address || '';
    } else {
      tradeStore.address = '';
    }
  }, [privateWalletStore.list, privateWalletStore.operaWalletIdx])

  return (
    <>
      <div className="d-flex flex-column mt-5 pt-5 px-1 gap-2 mb-2 col official-bg-gradient">
        {/* Top Row: Chart + OrderBook + Trading Panel */}
        <div className='d-flex gap-2'>
          {/* Left: Meta bar + K-Line Chart */}
          <div className='d-flex flex-column br-3 overflow-hidden glass-container' style={{ flex: '1 1 0', minWidth: 0 }}>
            <TradeMetaAndMarket coin={tradeStore.coin} className="mb-0" />
            <TradeKLine />
          </div>

          {/* Middle: Order Book / Trades */}
          <div className='d-flex flex-column br-3 overflow-hidden glass-container' style={{ width: '280px', minWidth: '280px' }}>
            <TabSwitch className='' noMenu tiling data={tradeStore.sideTabs} currId={tradeStore.sideTabId} onClick={(item) => tradeStore.sideTabId = item.id} />
            {
              tradeStore.sideTabId === 'orderBook' &&
                <TradeOrderBook unReset coin={tradeStore.coin} />
            }
            {
              tradeStore.sideTabId === 'trades' &&
                <TradeTrades coin={tradeStore.coin} />
            }
          </div>

          {/* Right: Trading Panel */}
          <div className='d-flex flex-column p-3 br-3 glass-container' style={{ width: '300px', minWidth: '280px' }}>
            <TradeTradingPanel />
          </div>
        </div>

        {/* Bottom Row: Positions/Orders + Account Assets */}
        <div className='d-flex gap-2'>
          {/* Left: Tab records */}
          <div className='d-flex flex-column br-3 overflow-hidden glass-container' style={{ flex: '1 1 0', minWidth: 0 }}>
            <TabSwitch
              labelSuffixes={[` (${traderDetailsPositionsStore.list.length})`, ` (${traderDetailsOpenOrdersAdditionalStore.list.length})`]}
              data={tradeStore.recordTabs}
              currId={tradeStore.recordTabId}
              onClick={(item) => tradeStore.recordTabId = item.id} />
            <TraderDetailsPositions
              address={tradeStore.address}
              className={`col ${tradeStore.recordTabId === 'positions' ? '' : 'd-none'}`} />
            <TraderDetailsOpenOrdersAdditional
              address={tradeStore.address}
              filterCoin={tradeStore.coin}
              className={`col ${tradeStore.recordTabId === 'openOrders' ? '' : 'd-none'}`} />
            {
              tradeStore.recordTabId === 'historicalOrders' &&
                <TraderDetailsHistoricalOrders address={tradeStore.address} filterCoin={tradeStore.coin} />
            }
            {
              tradeStore.recordTabId === 'recentFills' &&
                <TraderDetailsRecentFills address={tradeStore.address} filterCoin={tradeStore.coin} className='col' />
            }
            {
              tradeStore.recordTabId === 'completedTrades' &&
                <TraderDetailsCompletedTrades address={tradeStore.address} filterCoin={tradeStore.coin} className='col' />
            }
            {
              tradeStore.recordTabId === 'twap' &&
                <TraderDetailsTWAP address={tradeStore.address} filterCoin={tradeStore.coin} className='col' />
            }
            {
              tradeStore.recordTabId === 'depositsAndWithdrawals' &&
                <TraderDetailsNonFunding address={tradeStore.address} className='col' />
            }
          </div>

          {/* Right: Account Assets */}
          <div className='d-flex flex-column p-3 br-3 glass-container gap-3' style={{ width: '300px', minWidth: '280px' }}>
            <div className="fw-500 font-size-14 color-white">账户资产</div>

            <div className="d-flex flex-column gap-2 font-size-12">
              <div className="d-flex justify-content-between" style={{ color: 'rgba(255,255,255,0.55)' }}>
                <span className="d-flex align-items-center gap-1">
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6' }}></span>
                  永续合约
                </span>
                <span className="color-white">$ {formatNumber(traderDetailsPositionsStore.summary?.perpEquity) || '0.00'}</span>
              </div>
              <div className="d-flex justify-content-between" style={{ color: 'rgba(255,255,255,0.55)' }}>
                <span className="d-flex align-items-center gap-1">
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6' }}></span>
                  现货 &gt;
                </span>
                <span className="color-white">$ 0.00</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

            <div className="d-flex flex-column gap-2 font-size-12">
              <div className="fw-500 font-size-12" style={{ color: 'rgba(255,255,255,0.55)' }}>永续合约</div>
              {[
                { label: '总持仓价值', value: `$ ${formatNumber(traderDetailsPositionsStore.summary?.totalPositionValue) || '0.00'}` },
                { label: '杠杆比', value: `${traderDetailsPositionsStore.summary?.leverageRatio || '0.00'}x` },
                { label: '保证金使用率', value: `${traderDetailsPositionsStore.summary?.totalMarginUsagePct || '0.00'}%` },
              ].map((row, idx) => (
                <div key={idx} className="d-flex justify-content-between" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  <span>{row.label}</span>
                  <span className="color-white">{row.value}</span>
                </div>
              ))}
            </div>

            <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
              <div style={{ 
                width: `${Math.min(Number(traderDetailsPositionsStore.summary?.totalMarginUsagePct || 0), 100)}%`, 
                height: '100%', 
                background: '#00d1b2', 
                borderRadius: '2px' 
              }} />
            </div>

            <div className="d-flex justify-content-between font-size-12" style={{ color: 'rgba(255,255,255,0.45)' }}>
              <span>未实现盈亏</span>
              <span className={Number(traderDetailsPositionsStore.summary?.totalUPnl) >= 0 ? 'color-buy' : 'color-sell'}>
                $ {formatNumber(traderDetailsPositionsStore.summary?.totalUPnl) || '0.00'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Trade