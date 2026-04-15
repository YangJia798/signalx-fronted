import { useEffect, HTMLProps, FC } from 'react'
import BN from 'bignumber.js'
import { useTranslation, withTranslation, Trans } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom';
import { asterApi } from '@/stores/req/helper'

import { formatNumber, infiniteLoop } from '@/utils'
import { constants, useReqStore, useHyperStore, useTradeStore, hyperRawByWsActiveAssetCtx } from '@/stores'
import { IOutlineFlash } from '@/components/icon'
import AreaDrawerCoins from '@/components/Area/DrawerCoins'
import PositionItemCommonPnl from '@/components/PositionItem/CommonPnl'
import CoinIcon from '@/components/CoinIcon'
import { useHyperWSContext, ReadyState } from '@/components/Hyper/WSContext';

interface TradeMetaAndMarketProps extends HTMLProps<HTMLDivElement> {
  coin: string
  autoRefreshing?: boolean
  unReset?: boolean // 组件销毁时不触发原本针对数据源的清理流程
  className?: string
}

export const TradeMetaAndMarket: FC<TradeMetaAndMarketProps> = ({
  coin,
  autoRefreshing = true,
  unReset = false,
  className = ''
}) => {
  const hyperStore = useHyperStore()
  const tradeStore = useTradeStore()
  const reqStore = useReqStore()

  const navigator = useNavigate()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const platform = searchParams.get('platform') || 'hyperliquid'

  const { t, i18n } = useTranslation()
  const { decimalPlaces } = constants
  const { sendMessage, lastMessage, readyState } = useHyperWSContext()

  const handleSendMessage = (unsubscribe: boolean = false) => {
    const _coin = tradeStore.coin
    const methodContent = unsubscribe ? 'unsubscribe' : 'subscribe'

    if (readyState !== ReadyState.OPEN || !_coin) return

    sendMessage(`{ "method": "${methodContent}", "subscription": { "type": "activeAssetCtx", "coin": "${_coin}" } }`)
  }

  const onInitUpdate = async () => {
    // 地址
    if (coin !== tradeStore.coin) {
      if (tradeStore.coin) {
        // unsubscribe
        handleSendMessage(true)
      }
      tradeStore.coin = coin
    }

    // NOTE: 必须要有 meta 数据
    await reqStore.hyperPerpMetaAndAssetCtxs(hyperStore)
    handleSendMessage()
  }

  // init
  useEffect(() => {
    let isCancelled = false;
    let cancelFunc: any = null;

    const asyncFunc = async () => {
      // NOTE: 不能 tradeStore.reset()
      if (!coin) return

      if (!autoRefreshing) return

      if (platform === 'aster') {
          // Address updating
          if (coin !== tradeStore.coin) {
              tradeStore.coin = coin
          }

          // Start aster REST loop for active coin
          infiniteLoop(async () => {
            if (tradeStore.coin !== coin) return true; // auto-stop on change

            try {
                const [tickerRes, premiumRes, openInterestRes] = await Promise.all([
                   asterApi.get(`/fapi/v1/ticker/24hr?symbol=${coin}`).catch(() => null),
                   asterApi.get(`/fapi/v1/premiumIndex?symbol=${coin}`).catch(() => null),
                   asterApi.get(`/fapi/v1/openInterest?symbol=${coin}`).catch(() => null)
                ])

                const ticker = Array.isArray(tickerRes?.data) ? tickerRes.data[0] : tickerRes?.data;
                const premium = Array.isArray(premiumRes?.data) ? premiumRes.data[0] : premiumRes?.data;
                const openInterestData = openInterestRes?.data;

                if (ticker && ticker.symbol) {
                    const funding = premium ? new BN(premium.lastFundingRate).times(100).toFixed(4) : '0.0000';
                    const oi = openInterestData ? new BN(openInterestData.openInterest).toString() : '0';

                    hyperStore.perpMarket[coin] = {
                        ...(hyperStore.perpMarket[coin] || {}),
                        markPrice: ticker.lastPrice,
                        priceChange24h: ticker.priceChange,
                        priceChange24hPct: ticker.priceChangePercent,
                        dayNtlVolume: ticker.quoteVolume,
                        fundingPct: funding,
                        openInterest: oi 
                    }
                    hyperStore.perpMarket = { ...hyperStore.perpMarket }
                }
            } catch (e) {}
          }, 3000).then((res: any) => {
            if (isCancelled) {
              res.cancel();
            } else {
              cancelFunc = res.cancel;
            }
          });
      } else {
          await onInitUpdate()
      }
    }

    asyncFunc()

    return () => {
      isCancelled = true;
      if (platform === 'hyperliquid') {
         handleSendMessage(true)
      }
      if (cancelFunc) {
         cancelFunc()
      }
      if (!unReset) {
        // NOTE: 不能 tradeStore.reset()
      }
    }
  }, [readyState, coin, autoRefreshing, platform])

  // 处理原始数据
  useEffect(() => {
    if (lastMessage == null) return

    try {
      const res = JSON.parse(lastMessage.data)

      switch (res.channel) {
        case 'activeAssetCtx':
          hyperStore.perpMarket[res.data.coin] = hyperRawByWsActiveAssetCtx(res.data.ctx)
          break
        default:
      }
    } catch (e) {
      console.error(e)
    }
  }, [lastMessage])

  return (
    <>
      <div className='d-flex flex-wrap'>
        <div className='d-flex col-12'>
          <div className='d-flex px-3 py-3 br-3 bg-gray-alpha-4 gap-4 mx-1 mb-2 col'>
            <div className='d-flex align-items-center col gap-4 overflow-hidden'>
              <div className='d-flex align-items-center gap-1 linker flex-shrink-0' onClick={() => tradeStore.openSelectCoins = true}>
                <CoinIcon size='smd' id={platform === 'aster' ? coin.replace(/USDT?1?$/, '') : coin} className='me-2' />
                <span className='h5 fw-bold'>{platform === 'aster' ? coin : `${coin}-USD`}</span>
                <IOutlineFlash className='w-20 color-secondary' />
              </div>
              <div className='d-flex gap-5 overflow-auto' style={{ flexWrap: 'nowrap' }}>
                {
                  [
                    {
                      label: t('common.markPrice'),
                      content: hyperStore.perpMarket[coin]?.markPrice ?? '-',
                    },
                    {
                      label: t('common.pct24h'),
                      content: <span className='d-flex gap-1'>
                        <PositionItemCommonPnl prefix='' value={hyperStore.perpMarket[coin]?.priceChange24h} />
                        <span className='color-secondary'>/</span>
                        <PositionItemCommonPnl prefix='' value={hyperStore.perpMarket[coin]?.priceChange24hPct} suffix=' %' />
                      </span>
                    },
                    {
                      label: t('common.24hVolume'),
                      content: <>$ {hyperStore.perpMarket[coin]?.dayNtlVolume ? formatNumber(new BN(hyperStore.perpMarket[coin]?.dayNtlVolume).toFixed(constants.decimalPlaces.__COMMON__)) : '-'}</>,
                    },
                    {
                      label: t('common.openInterest'),
                      content: <>$ {hyperStore.perpMarket[coin]?.markPrice ? formatNumber(new BN(hyperStore.perpMarket[coin]?.markPrice).times(hyperStore.perpMarket[coin]?.openInterest).toFixed(decimalPlaces.__COMMON__)) : '-'}</>,
                    },
                    {
                      label: t('common.fundingFee'),
                      content: <>{hyperStore.perpMarket[coin]?.fundingPct ?? '-'} %</>
                    },
                  ].map((item, idx) => (
                    <div key={idx} className='d-flex flex-column flex-shrink-0'>
                      <small className="color-unimportant pb-1" style={{ whiteSpace: 'nowrap' }}>{item.label}</small>
                      <span className="color-secondary">
                        <span className="d-flex flex-column">
                          <span className="color-white">{item.content}</span>
                        </span>
                      </span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <AreaDrawerCoins onClose={(item) => {
        if (item.coin) {
          navigator({
            pathname: `/trade/${item.coin}`,
            search: location.search
          })
        }
      }} />
    </>
  )
}

export default TradeMetaAndMarket