import { useEffect, useState } from 'react'
import { Button, Drawer, Progress } from 'antd'
import BN from 'bignumber.js'
import { useTranslation, withTranslation, Trans } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom';
import { Dropdown } from 'antd';
import { asterApi } from '@/stores/req/helper'
import { constants, useHyperStore, useTradeStore, useTradeCoinsStore, useReqStore, IPerpMarketItem, IPerpMetaItem } from '@/stores'
import { forEach, formatNumber, sortArrayByKey, merge, infiniteLoop } from '@/utils'
import InputSearch from '@/components/Input/Search'
import CoinIcon from '@/components/CoinIcon'
import ColumnList from '@/components/Column/List'
import PositionItemCommonPnl from '@/components/PositionItem/CommonPnl'
import PositionItemActivity from '@/components/PositionItem/Activity'
import HyperAutoUpdatePerpMetaAndMarket from '@/components/Hyper/AutoUpdatePerpMetaAndMarket'

const AreaDrawerCoins = ({ onClose = (item) => {} }) => {
  const hyperStore = useHyperStore()
  const tradeStore = useTradeStore()
  const tradeCoinsStore = useTradeCoinsStore()
  const reqStore = useReqStore()

  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(location.search)
  const platform = searchParams.get('platform') || 'hyperliquid'

  const { t, i18n } = useTranslation()
  const autoRefreshCD = 5000

  const handleClose = () => {
    tradeStore.openSelectCoins = false
  }

  const handlePlatformSwitch = (newPlatform: string) => {
    if (newPlatform === platform) return;
    searchParams.set('platform', newPlatform);

    // Auto-switch coin intelligently to defaults
    let newCoin = tradeStore.coin;
    if (newPlatform === 'aster' && !newCoin?.endsWith('USD1') && !newCoin?.endsWith('USDT')) {
      newCoin = 'BTCUSD1';
    } else if (newPlatform === 'hyperliquid' && (newCoin?.endsWith('USD1') || newCoin?.endsWith('USDT'))) {
      newCoin = 'BTC';
    }

    navigate({
      pathname: `/trade/${newCoin}`,
      search: searchParams.toString()
    });
  };

  const column = [
    { id: 'symbol', label: t('common.symbol'), className: 'col-6 col-sm-3' },
    { id: 'midPrice', sort: true, sortByKey: 'midPrice', label: t('common.lastPrice'), className: 'justify-content-end text-end col-3 col-sm-2' },
    { id: 'priceChange24h', sort: true, sortByKey: 'priceChange24hPct', label: t('common.pct24h'), className: 'justify-content-end text-end col-3 col-sm' },
    { id: 'funding', sort: true, sortByKey: 'fundingPct', label: t('common.eightHFunding'), className: 'justify-content-end text-end col-3 col-sm' },
    { id: 'dayNtlVolume', sort: true, sortByKey: 'dayNtlVolume', label: t('common.volume'), className: 'justify-content-end text-end col-5 col-sm-3' },
    { id: 'dayTradingActivity', sort: true, sortByKey: 'dayTradingActivityPct', label: t('common.activity'), className: 'justify-content-end text-end col-2 col-sm-1' },
  ]

  const renderItem = (item, columnIndex) => {
    const coin = item.coin
    // NOTE: 为了能 sort
    // const market = hyperStore.perpMarket[coin]
    // const meta = hyperStore.perpMeta[coin]

    switch (column[columnIndex].id) {
      case 'symbol':
        return <span className='d-flex flex-wrap align-items-center'>
          <CoinIcon size='sm' id={item.baseCoin || coin} className='me-2' />
          <span className='color-white fw-bold font-size-14'>{platform === 'aster' ? coin : `${coin}-USD`}</span>
          <span className='br-1 px-1'>{item.maxLeverage}x</span>
        </span>
      case 'midPrice':
        return <span className='color-white'>{item.midPrice ?? '-'}</span>
      case 'priceChange24h':
        return <span className='d-flex gap-1'>
          {/* <PositionItemCommonPnl prefix='' value={item.priceChange24h} />/ */}
          <PositionItemCommonPnl prefix='' value={item.priceChange24hPct} suffix=' %' />
        </span>
      case 'funding':
        return <>{item.fundingPct} %</>
      case 'dayNtlVolume':
        {/* { market.openInterest} <br/>
        { market.dayBaseVlm} */}
        return <>$ {formatNumber(new BN(item.dayNtlVolume).toFixed(constants.decimalPlaces.__COMMON__))}</>
      case 'dayTradingActivity':
        return <PositionItemActivity value={item.dayTradingActivityPct} />
      default:
        return null
    }
  }

  const handleLoopMarket = () => {
    return infiniteLoop(async () => {
      // 关闭时，退出 loop
      if (!tradeStore.openSelectCoins) return true

      const _perpList = []

      if (tradeCoinsStore.init) {
        tradeCoinsStore.init = false
      }

      if (platform === 'aster') {
        try {
          const [tickersRes, premiumRes] = await Promise.all([
             asterApi.get('/fapi/v1/ticker/24hr'),
             asterApi.get('/fapi/v1/premiumIndex')
          ])

          if (tickersRes.data && Array.isArray(tickersRes.data)) {
             const premiumMap: Record<string, string> = {}
             if (premiumRes.data && Array.isArray(premiumRes.data)) {
                premiumRes.data.forEach((p: any) => {
                   premiumMap[p.symbol] = p.lastFundingRate
                })
             }

             let processedList = tickersRes.data.map((item: any) => {
                 const coinStr = item.symbol
                 const funding = premiumMap[coinStr] ? new BN(premiumMap[coinStr]).times(100).toFixed(4) : '0.0000'
                 return {
                     coin: coinStr,
                     baseCoin: coinStr.replace(/USDT?1?$/, ''),
                     maxLeverage: 25, 
                     midPrice: item.lastPrice,
                     priceChange24h: item.priceChange,
                     priceChange24hPct: item.priceChangePercent,
                     fundingPct: funding,
                     dayNtlVolume: item.quoteVolume,
                     dayTradingActivityPct: ''
                 }
             })

             // Match official site's ~24 curated coins by sorting by volume
             processedList.sort((a: any, b: any) => Number(b.dayNtlVolume) - Number(a.dayNtlVolume))
             
             // Promote *USD1 coins typical in Aster to the top slightly (as seen on official site)
             processedList.sort((a: any, b: any) => {
               const aScore = a.coin.endsWith('USD1') ? 1 : 0;
               const bScore = b.coin.endsWith('USD1') ? 1 : 0;
               return bScore - aScore;
             })

             tradeCoinsStore.perpList = processedList.slice(0, 24)
             handleChangeSort()
          }
        } catch (e) {
          console.error('Failed to fetch Aster markets', e)
          return true
        }
        return
      }

      // NOTE: 必须要有 midPrice 和 meta
      forEach(hyperStore.perpMeta, (item, key) => {
        const market = hyperStore.perpMarket[key]

        if (market && market.midPrice) {
          // NOTE: 其他数值用于排序
          _perpList.push({
            coin: key,
            ...item,
            ...market
          })
        }
      })

      // NOTE: 不使用 merge，优化性能
      tradeCoinsStore.perpList = _perpList
      handleChangeSort()
    }, autoRefreshCD)
  }

  const handleChangeSort = (columnId: string = tradeCoinsStore.sortColumnId, sortByKey: string = '', ascending: boolean = tradeCoinsStore.sortAscending) => {
    if (!sortByKey) {
      sortByKey = column.find(item => item.id === columnId).sortByKey ?? ''
    }
    // update
    merge(tradeCoinsStore, {
      sortColumnId: columnId,
      sortAscending: ascending,
      perpList: sortArrayByKey(tradeCoinsStore.perpList, sortByKey, ascending)
    })
  }

  const handleSearchFilterCoin = (value: string) => {
    const content = (value ?? '').trim()
    tradeCoinsStore.searchCoinInput = content
    tradeCoinsStore.searchCoin = content.toLocaleUpperCase()
  }

  // init
  useEffect(() => {
    if (!tradeStore.openSelectCoins) return

    // Clear list when platform switches so we don't flash old platform data
    tradeCoinsStore.perpList = []

    let isCancelled = false
    let cancelFunc: any = null

    handleLoopMarket().then((res: any) => {
      if (isCancelled) {
        res.cancel()
      } else {
        cancelFunc = res.cancel
      }
    })

    return () => {
      isCancelled = true
      if (cancelFunc) cancelFunc()

      if (!tradeStore.openSelectCoins) {
        // NOTE: 不做整体 reset，因为数据是一直在完整覆盖更新，清掉后，再 open，会有先加载再显示的闪效果
        // tradeCoinsStore.reset()
        tradeCoinsStore.resetSearch()
      }
    }
  }, [tradeStore.openSelectCoins, platform])

  return (
    <>
      <Drawer
        placement='left'
        width={760}
        closable={false}
        destroyOnHidden
        onClose={handleClose}
        extra={null}
        open={tradeStore.openSelectCoins}
        drawerRender={() => (
          <div className='d-flex flex-column bg-gray-6 h-100vh pointer-events-auto'>
            {/* Header / Platform Switcher */}
            <div className="d-flex align-items-center px-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <Dropdown menu={{
                items: [
                  {
                    key: 'hyperliquid',
                    label: (
                      <div className="d-flex align-items-center gap-2" style={{ width: '140px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 8A4 4 0 0 0 4 16C7.5 16 9.5 13.5 12 13.5C14.5 13.5 16.5 16 20 16A4 4 0 0 0 20 8C16.5 8 14.5 10.5 12 10.5C9.5 10.5 7.5 8 4 8Z" fill="#38d1b3"/>
                        </svg>
                        <span className="font-size-14">Hyperliquid</span>
                      </div>
                    ),
                    onClick: () => handlePlatformSwitch('hyperliquid')
                  },
                  {
                    key: 'aster',
                    label: (
                      <div className="d-flex align-items-center gap-2">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0ZM12 3C12 7.97 16.03 12 21 12C16.03 12 12 16.03 12 21C12 16.03 7.97 12 3 12C7.97 12 12 7.97 12 3Z" fill="#ffc89a"/>
                        </svg>
                        <span className="font-size-14">Aster</span>
                      </div>
                    ),
                    onClick: () => handlePlatformSwitch('aster')
                  }
                ]
              }} trigger={['click']}>
                <div className="d-flex align-items-center cursor-pointer px-2 py-1 br-3 hover-bg-gray transition-2">
                  <div className="d-flex align-items-center gap-2">
                    {platform === 'hyperliquid' ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 8A4 4 0 0 0 4 16C7.5 16 9.5 13.5 12 13.5C14.5 13.5 16.5 16 20 16A4 4 0 0 0 20 8C16.5 8 14.5 10.5 12 10.5C9.5 10.5 7.5 8 4 8Z" fill="#38d1b3"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0ZM12 3C12 7.97 16.03 12 21 12C16.03 12 12 16.03 12 21C12 16.03 7.97 12 3 12C7.97 12 12 7.97 12 3Z" fill="#ffc89a"/>
                      </svg>
                    )}
                    <span className="fw-bold font-size-16">{platform === 'hyperliquid' ? 'Hyperliquid' : 'Aster'}</span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.6 }} className="mt-1">
                      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </Dropdown>
              <div className="d-flex align-items-center ms-3">
                <span className="font-size-15 fw-500" style={{ color: '#fff' }}>{t('common.perpetual')}</span>
                <span className="font-size-15 ms-1" style={{ color: 'rgba(255,255,255,0.45)' }}>({tradeCoinsStore.perpList.length})</span>
              </div>
              <div className="flex-grow-1"></div>
              <div className="cursor-pointer d-flex align-items-center justify-content-center p-2 hover-bg-gray br-3 transition-2" onClick={handleClose}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div>
              <InputSearch size='small'
                className='col position-relative z-index-9 m-1'
                value={tradeCoinsStore.searchCoinInput}
                placeholder={t('common.searchSymbol')}
                onChange={handleSearchFilterCoin} />
            </div>
            <ColumnList
              columns={column}
              className='col'
              headClassName='ps-2 pe-1 py-2'
              rowClassName='ps-2 pe-1 py-2'
              data={!tradeCoinsStore.searchCoin ? tradeCoinsStore.perpList : tradeCoinsStore.perpList.filter(item => (new RegExp(tradeCoinsStore.searchCoin)).test(item.coin))}
              busy={tradeCoinsStore.init}
              sortColumnId={tradeCoinsStore.sortColumnId}
              renderItem={renderItem}
              onRowClick={(item)=> {
                handleClose()
                onClose(item)
              }}
              onChangeSort={handleChangeSort} />
          </div>
        )}>
      </Drawer>
      <HyperAutoUpdatePerpMetaAndMarket />
    </>
  )
}

export default AreaDrawerCoins
