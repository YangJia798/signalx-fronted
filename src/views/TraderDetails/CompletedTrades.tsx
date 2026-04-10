import { useEffect } from 'react'
import { useTranslation, withTranslation, Trans } from 'react-i18next'

import { formatNumber, sortArrayByKey, merge } from '@/utils'
import { constants, useTraderDetailsCompletedTradesStore, useReqStore } from '@/stores'
import ColumnList from '@/components/Column/List'
import TimeAgo from '@/components/TimeAgo'
import PositionItemTx from '@/components/PositionItem/Tx'
import PositionItemSide from '@/components/PositionItem/Side'
import PositionItemCommonPnl from '@/components/PositionItem/CommonPnL'

const TraderDetailsCompletedTrades = ({ address, filterCoin = '', displayedRecordsMessage = 2000, className = '' }) => {
  const traderDetailsCompletedTradesStore = useTraderDetailsCompletedTradesStore()
  const reqStore = useReqStore()

  const { t, i18n } = useTranslation()

  const column = [
    { id: 'time', sort: true, sortByKey: 'createTs', label: t('common.endTime', '结束时间'), className: 'col-4 col-md-2' },
    { id: 'symbol', filter: 'symbol', label: t('common.symbol', '币种'), className: 'col-4 col-md-1' },
    { id: 'side', label: t('common.action', '方向'), className: 'col-3 col-md-1' },
    { id: 'duration', sort: true, sortByKey: 'duration', label: t('common.duration', '持续时间'), className: 'justify-content-end text-end col-4 col-md-2' },
    { id: 'closedPnl', sort: true, sortByKey: 'closedPnl', label: t('common.netPnl', '净盈亏'), className: 'justify-content-end text-end col-6 col-md-2' },
    { id: 'size', sort: true, sortByKey: 'size', label: t('common.scale', '规模'), className: 'justify-content-end text-end col-6 col-md-2' },
    { id: 'price', sort: true, sortByKey: 'price', label: t('common.closePrice', '平仓价'), className: 'justify-content-end text-end col-6 col-md-1' },
    { id: 'fee', sort: true, sortByKey: 'fee', label: t('common.fee', '费用'), className: 'justify-content-end text-end col-4 col-md-1' },
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
        return <>-</> // Mock duration as hyperliquid userFills lacks start time
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
  }, [address])

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