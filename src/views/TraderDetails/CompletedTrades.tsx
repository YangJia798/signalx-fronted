import { useEffect } from 'react'
import { useTranslation, withTranslation, Trans } from 'react-i18next'

import { formatNumber, sortArrayByKey, merge } from '@/utils'
import { constants, useTraderDetailsCompletedTradesStore, useReqStore, useTradeStore } from '@/stores'
import ColumnList from '@/components/Column/List'
import TimeAgo from '@/components/TimeAgo'
import PositionItemTx from '@/components/PositionItem/Tx'
import PositionItemSide from '@/components/PositionItem/Side'
import PositionItemCommonPnl from '@/components/PositionItem/CommonPnl'

const TraderDetailsCompletedTrades = ({ address, filterCoin = '', displayedRecordsMessage = 2000, className = '' }) => {
  const traderDetailsCompletedTradesStore = useTraderDetailsCompletedTradesStore()
  const reqStore = useReqStore()
  const tradeStore = useTradeStore()

  const { t, i18n } = useTranslation()

  const column = [
    { id: 'time', sort: true, sortByKey: 'createTs', label: t('common.endTime', '结束时间'), className: 'col-4 col-md-2 text-nowrap' },
    { id: 'symbol', filter: 'symbol', label: t('common.symbol', '币种'), className: 'col-4 col-md-1 text-nowrap' },
    { id: 'side', label: t('common.action', '方向'), className: 'col-3 col-md-1 text-nowrap' },
    { id: 'duration', sort: true, sortByKey: 'duration', label: t('common.duration', '持续时间'), className: 'justify-content-end text-end col-4 col-md-2 text-nowrap' },
    { id: 'closedPnl', sort: true, sortByKey: 'closedPnl', label: t('common.netPnl', '净盈亏'), className: 'justify-content-end text-end col-6 col-md-2 text-nowrap' },
    { id: 'size', sort: true, sortByKey: 'size', label: t('common.scale', '规模'), className: 'justify-content-end text-end col-6 col-md-2 text-nowrap' },
    { id: 'price', sort: true, sortByKey: 'price', label: t('common.closePrice', '平仓价'), className: 'justify-content-end text-end col-6 col-md-1 text-nowrap' },
    { id: 'fee', sort: true, sortByKey: 'fee', label: t('common.fee', '费用'), className: 'justify-content-end text-end col-4 col-md-1 text-nowrap' },
  ]

  const renderItem = (item, columnIndex) => {
    switch (column[columnIndex].id) {
      case 'time':
        return <TimeAgo ts={item.createTs} />
      case 'symbol':
        return item.coin
      case 'side':
        return <PositionItemSide size='small' item={item} />
      case 'duration':
        if (item.duration) {
          const ms = item.duration;
          const seconds = Math.floor(ms / 1000);
          const minutes = Math.floor(seconds / 60);
          const hours = Math.floor(minutes / 60);
          const days = Math.floor(hours / 24);
          
          if (days > 0) return <>{days} {t('common.day', '天')} {hours % 24} {t('common.hour', '小时')}</>;
          if (hours > 0) return <>{hours} {t('common.hour', '小时')} {minutes % 60} {t('common.minute', '分钟')}</>;
          if (minutes > 0) return <>{minutes} {t('common.minute', '分钟')}</>;
          return <>&lt; 1 {t('common.minute', '分钟')}</>;
        }
        return <>-</>
      case 'closedPnl':
        return <PositionItemCommonPnl value={item.closedPnl} />
      case 'size':
        return <span className='d-flex align-items-center gap-1'>{formatNumber(item.size)}<small>{item.coin}</small></span>
      case 'price':
        return <>$ {item.price}</>
      case 'fee':
        return <span className='d-flex align-items-center gap-1'>
          { formatNumber(item.fee) }
          <small>{ item.feeToken }</small>
        </span>
      default:
        return null
    }
  }

  const handleChangeSort = (columnId: string, sortByKey: string = '', ascending: boolean = false) => {
    if (!sortByKey) {
      sortByKey = column.find(item => item.id === columnId).sortByKey
    }

    // update
    merge(traderDetailsCompletedTradesStore, {
      sortColumnId: columnId,
      list: sortArrayByKey(traderDetailsCompletedTradesStore.list, sortByKey, ascending)
    })
  }

  // init
  useEffect(() => {
    const asyncFunc = async () => {
      if (!(address)) {
        traderDetailsCompletedTradesStore.reset()
        return
      }

      const { data, error } = await reqStore.hyperUserFills(address)

      if (error) return

      // update
      traderDetailsCompletedTradesStore.list = data.list.filter(item => item.closedPnl && parseFloat(item.closedPnl) !== 0)
      handleChangeSort(traderDetailsCompletedTradesStore.sortColumnId)
    }

    asyncFunc()

    return () => {
      traderDetailsCompletedTradesStore.reset()
    }
  }, [address, tradeStore.refreshTick])

  return (
    <ColumnList
      columns={column}
      className={className}
      data={traderDetailsCompletedTradesStore.list}
      busy={reqStore.hyperUserFillsBusy}
      sortColumnId={traderDetailsCompletedTradesStore.sortColumnId}
      renderItem={renderItem}
      pageCurrent={traderDetailsCompletedTradesStore.current}
      onPageChange={pageNumber => traderDetailsCompletedTradesStore.current = pageNumber }
      pageSize={traderDetailsCompletedTradesStore.size}
      onChangeSort={handleChangeSort}
      filterCoin={filterCoin}
      noMoreNote={displayedRecordsMessage ? t('common.displayedRecordsMessage', { num: displayedRecordsMessage }) : ''} />
  )
}

export default TraderDetailsCompletedTrades