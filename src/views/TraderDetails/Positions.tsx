import { useEffect } from 'react'
import { useTranslation, withTranslation, Trans } from 'react-i18next'

import { formatNumber, sortArrayByKey, merge } from '@/utils'
import { constants, useTraderDetailsPositionsStore, useReqStore, useTradeStore, useTraderDetailsOpenOrdersAdditionalStore } from '@/stores'
import ColumnList from '@/components/Column/List'
import PositionItemUPnl from '@/components/PositionItem/UPnl'
import PositionItemDirectionLeverage from '@/components/PositionItem/DirectionLeverage'
import PositionItemPositionValue from '@/components/PositionItem/PositionValue'
import PositionItemFunding from '@/components/PositionItem/Funding'
import PositionItemMarkPrice from '@/components/PositionItem/MarkPrice'
import HyperAutoUpdatePerpMetaAndMarket from '@/components/Hyper/AutoUpdatePerpMetaAndMarket'
import ModalTPSL from '@/components/Modal/TPSL'
import ModalClosePosition from '@/components/Modal/ClosePosition'

const TraderDetailsPositions = ({ address, unUpdate = false, unReset = false, className = '' }) => {
  const traderDetailsPositionsStore = useTraderDetailsPositionsStore()
  const reqStore = useReqStore()
  const tradeStore = useTradeStore()
  const traderDetailsOpenOrdersAdditionalStore = useTraderDetailsOpenOrdersAdditionalStore()

  const { t, i18n } = useTranslation()

  const tabPosition = [
    { id: 'symbol', label: t('common.symbol'), className: 'col-xl-1 col-md-2 col' },
    { id: 'positionValue', sort: true, sortByKey: 'positionValue', label: t('common.positionValue'), className: 'justify-content-end text-end col-2 text-nowrap' },
    { id: 'uPnl', sort: true, sortByKey: 'uPnl', label: t('common.uPnl'), className: 'justify-content-end text-end col text-nowrap' },
    { id: 'openingPrice', sort: true, sortByKey: 'openPrice', label: t('common.openingPrice'), className: 'justify-content-end text-end col text-nowrap' },
    { id: 'markPrice', sort: true, sortByKey: 'markPrice', label: t('common.markPrice'), className: 'justify-content-end text-end col text-nowrap' },
    { id: 'liquidationPrice', sort: true, sortByKey: 'liquidationPrice', label: t('common.liquidationPrice'), className: 'justify-content-end text-end col text-nowrap' },
    { id: 'margin', sort: true, sortByKey: 'marginUsed', label: t('common.margin'), className: 'justify-content-end text-end col' },
    { id: 'funding', sort: true, sortByKey: 'funding', label: t('common.fundingFee', '资金费用'), className: 'justify-content-end text-end col text-nowrap' },
    { id: 'tpSl', label: t('common.tpSl', '止盈/止损'), className: 'justify-content-end text-end col text-nowrap' },
    { id: 'closePosition', label: t('common.closePosition', '平仓'), className: 'justify-content-end text-end col-2 text-nowrap' },
  ]

  const renderPositionItem = (item, columnIndex) => {
    switch (tabPosition[columnIndex].id) {
      case 'walletId':
        return item.walletId
      case 'symbol':
        return (
          <div className="d-flex flex-column gap-1">
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold color-white font-size-14">{item.coin}</span>
              <span
                className={`font-size-11 fw-600 px-1 br-1 ${item.direction === 'long' ? 'bg-success-1' : 'bg-error-1'}`}
                style={{ whiteSpace: 'nowrap', lineHeight: '18px' }}
              >
                {t(`common.${item.direction}`)}
              </span>
            </div>
            <span className="font-size-12 color-gray-2 d-flex align-items-center gap-1" style={{ whiteSpace: 'nowrap' }}>
              <span>{item.marginMode === 'isolated' ? t('common.isolatedMargin') : t('common.crossMargin')}</span>
              <span className="fw-500">{item.leverage}x</span>
            </span>
          </div>
        )
      case 'positionValue':
        return <PositionItemPositionValue item={item} />
      case 'uPnl':
        return <PositionItemUPnl item={item} />
      case 'openingPrice':
        return <>$ {item.openPrice}</>
      case 'markPrice':
        return <PositionItemMarkPrice item={item} />
      case 'liquidationPrice':
        return item.liquidationPrice
          ? <>$ {item.liquidationPrice}</>
          : '-'
      case 'margin':
        return <>$ { formatNumber(item.marginUsed) }</>
      case 'funding':
        return <PositionItemFunding item={item} />
      case 'tpSl': {
        const positionOrders = traderDetailsOpenOrdersAdditionalStore.list.filter(
            (o: any) => o.coin === item.coin && (o.isTPSL || (o.reduceOnly && o.isTrigger))
        );
        let tpPrice = '-';
        let slPrice = '-';
        const isLong = item.direction === 'long';
        positionOrders.forEach((o: any) => {
            const px = o.triggerPrice || o.limitPrice;
            if (!px) return;
            const pxNum = Number(px);
            const openNum = Number(item.openPrice);
            if (isLong) {
                if (pxNum > openNum) tpPrice = px;
                else slPrice = px;
            } else {
                if (pxNum < openNum) tpPrice = px;
                else slPrice = px;
            }
        });

        return (
          <span className="color-gray-2 d-flex align-items-center justify-content-end gap-1 text-nowrap" style={{ whiteSpace: 'nowrap' }}>
            {tpPrice}/{slPrice}
            <svg 
              className="cursor-pointer" 
              style={{ color: '#00d1b2', flexShrink: 0 }} 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              onClick={() => {
                traderDetailsPositionsStore.currentTPSLItem = item;
                traderDetailsPositionsStore.openTPSLModal = true;
              }}
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </span>
        )
      }
      case 'closePosition':
        return (
          <div className="d-flex flex-wrap align-items-center justify-content-end gap-1 flex-nowrap" style={{ whiteSpace: 'nowrap' }}>
            <span 
              className="br-1 px-1 font-size-12 whitespace-nowrap" 
              style={{ background: 'rgba(255,255,255,0.1)', cursor: 'pointer', color: '#00d1b2', whiteSpace: 'nowrap' }}
              onClick={() => {
                traderDetailsPositionsStore.currentClosePositionItem = item;
                traderDetailsPositionsStore.closePositionType = 'limit';
                traderDetailsPositionsStore.openClosePositionModal = true;
              }}
            >
              {t('common.limitPrice', '限价')}
            </span>
            <span 
              className="br-1 px-1 font-size-12 whitespace-nowrap" 
              style={{ background: 'rgba(255,255,255,0.1)', cursor: 'pointer', color: '#00d1b2', whiteSpace: 'nowrap' }}
              onClick={() => {
                traderDetailsPositionsStore.currentClosePositionItem = item;
                traderDetailsPositionsStore.closePositionType = 'market';
                traderDetailsPositionsStore.openClosePositionModal = true;
              }}
            >
              {t('common.marketPrice', '市价')}
            </span>
          </div>
        )
      default:
        return null
    }
  }

  const handleChangeSort = (columnId: string, sortByKey: string = '', ascending: boolean = false) => {
    if (!sortByKey) {
      sortByKey = tabPosition.find(item => item.id === columnId).sortByKey
    }

    // update
    merge(traderDetailsPositionsStore, {
      sortColumnId: columnId,
      list: sortArrayByKey(traderDetailsPositionsStore.list, sortByKey, ascending)
    })
  }

  // init
  useEffect(() => {
    const asyncFunc = async () => {
      if (!(address)) {
        traderDetailsPositionsStore.reset()
        return
      }

      if (!unUpdate) {
        const { data, error } = await reqStore.hyperClearinghouseState(address)

        if (error) return

        // update
        traderDetailsPositionsStore.list = data.positions
        traderDetailsPositionsStore.summary = data.summary
      }
      handleChangeSort(traderDetailsPositionsStore.sortColumnId)
    }

    asyncFunc()

    return () => {
      if (!unReset) {
        traderDetailsPositionsStore.reset()
      }
    }
  }, [address, tradeStore.refreshTick])

  return (
    <>
      <ColumnList
        columns={tabPosition}
        className={className}
        headClassName="ps-4 pe-4 py-3 gap-3"
        rowClassName="ps-4 pe-4 py-3 gap-3"
        data={traderDetailsPositionsStore.list}
        busy={reqStore.hyperClearinghouseStateInit || !unUpdate && reqStore.hyperClearinghouseStateBusy}
        sortColumnId={traderDetailsPositionsStore.sortColumnId}
        renderItem={renderPositionItem}
        onChangeSort={handleChangeSort} />
      <HyperAutoUpdatePerpMetaAndMarket />
      <ModalTPSL />
      <ModalClosePosition />
    </>
  )
}

export default TraderDetailsPositions