import { useEffect, FC, HTMLProps, useImperativeHandle, forwardRef } from 'react'
import { useTranslation, withTranslation, Trans } from 'react-i18next'
import { message } from 'antd'

import { formatNumber, sortArrayByKey, merge } from '@/utils'
import { constants, useTraderDetailsOpenOrdersAdditionalStore, useReqStore, formatSideByRaw, useTradeStore, usePrivateWalletStore } from '@/stores'
import ColumnList from '@/components/Column/List'
import PositionItemUPnl from '@/components/PositionItem/UPnl'
import PositionItemDirectionLeverage from '@/components/PositionItem/DirectionLeverage'
import PositionItemPositionValue from '@/components/PositionItem/PositionValue'
import PositionItemFunding from '@/components/PositionItem/Funding'
import PositionItemMarkPrice from '@/components/PositionItem/MarkPrice'
import TimeAgo from '@/components/TimeAgo'
import PositionItemSize from '@/components/PositionItem/Size'
import { useHyperWSContext, ReadyState } from '@/components/Hyper/WSContext';
import CoinIcon from '@/components/CoinIcon'
import PositionItemSide from '@/components/PositionItem/Side'
interface TraderDetailsOpenOrdersAdditionalProps extends HTMLProps<HTMLDivElement> {
  address: string
  filterCoin?: string
  autoRefreshing?: boolean
  unReset?: boolean
  className?: string
  isOwnWallet?: boolean
}

export const TraderDetailsOpenOrdersAdditional: FC<TraderDetailsOpenOrdersAdditionalProps> = ({
  address,
  filterCoin = '',
  autoRefreshing = true,
  unReset = false,
  className = '',
  isOwnWallet = false,
}) => {
  const traderDetailsOpenOrdersAdditionalStore = useTraderDetailsOpenOrdersAdditionalStore()
  const reqStore = useReqStore()
  const tradeStore = useTradeStore()

  const privateWalletStore = usePrivateWalletStore()
  const { sendMessage, lastMessage, readyState } = useHyperWSContext()
  const { t, i18n } = useTranslation()

  const column = [
    { id: 'time', sort: true, sortByKey: 'createTs', label: t('common.time'), className: 'col-5 col-md-2 text-nowrap' },
    { id: 'symbol', filter: 'symbol', label: t('common.symbol'), className: 'col-4 col-md-1 text-nowrap' },
    { id: 'orderType', label: t('common.type'), className: 'col-2 col-md-1 text-nowrap' },
    { id: 'side', label: t('common.side'), className: 'col-2 col-md-1 text-nowrap' },
    { id: 'value', sort: true, sortByKey: 'value', label: t('common.value'), className: 'justify-content-center text-center col-3 col-md-1 text-nowrap' },
    { id: 'size', sort: true, sortByKey: 'size', label: t('common.amount'), className: 'justify-content-end text-end col-4 col-md-1 text-nowrap' },
    { id: 'price', sort: true, sortByKey: 'limitPrice', label: t('common.price'), className: 'justify-content-end text-end col-6 col-md-2 text-nowrap' },
    { id: 'trigger', label: t('common.trigger'), className: 'justify-content-end text-end col-3 col-md-1 text-nowrap' },
    { id: 'status', label: t('common.status'), className: 'justify-content-end text-end col-4 col-md-1 text-nowrap' },
    ...(isOwnWallet ? [{ id: 'operator', label: t('common.cancelAll'), className: 'justify-content-end text-end col-5 col-md-1 text-nowrap' }] : []),
  ]

  const handleCancelOrder = async (item: any) => {
    try {
      const activeWallet = privateWalletStore.list[
        privateWalletStore.operaWalletIdx === -1 ? 0 : privateWalletStore.operaWalletIdx
      ] || privateWalletStore.list[0]

      if (!activeWallet) {
        message.warning(t('common.pleaseConnectWallet', '请先连接钱包'))
        return
      }

      const payload = {
        wallet_id: activeWallet.walletId,
        coin: item.coin,
        oid: Number(item.orderId),  // int64
      }

      // TPSL 单走 tpsl/cancel 接口，普通挂单走 order/cancel 接口
      if (item.isTPSL) {
        await reqStore.hyperOrderCancel(payload)
      } else {
        await reqStore.hyperOrderCancelNormal(payload)
      }

      message.success(t('common.success', '取消成功'))
      // 1s 后刷新列表，等待链上确认
      setTimeout(() => {
        handleOpenOrdersByApi()
      }, 1000)
    } catch(e: any) {
      message.error(e.message || t('common.error', '操作失败'))
      console.error(e)
    }
  }

  const renderItem = (item, columnIndex) => {
    switch (column[columnIndex].id) {
      case 'time':
        return <TimeAgo ts={item.createTs} />
      case 'symbol':
        return item.coin
      case 'orderType':
        return item.isTrigger && t('orderType.trigger')
          || t(`orderType.${item.orderType}`)
      case 'side':
        const isBuy = ['buy', 'long'].includes(item.side?.toLowerCase()) || item.side === 'B'
        const sideColor = isBuy ? 'bg-success-1' : 'bg-error-1';
        return <span className={`br-1 px-1 py-0 font-size-12 flex-shrink-0 text-nowrap color-white ${sideColor}`}>{isBuy ? t('common.buy', '买入') : t('common.sell', '卖出')}</span>
      case 'value':
        let orderValue = Number(item.limitPrice || 0) * Number(item.size || 0)
        return <>$ {formatNumber(orderValue.toFixed(2))}</>
      case 'size':
        return <PositionItemSize item={item} />
      case 'price':
        return <>$ {item.limitPrice}</>
      case 'trigger':
        return item.isTrigger ? `$ ${item.triggerPrice}` : '-'
      case 'status':
        // XXX: 缺 close 和其他
        return item.isTPSL && t('common.tpSl')
          || item.reduceOnly && t('common.reduceOnly', '仅减仓')
          || t('common.openPosition')
      case 'operator':
        return <span className="cursor-pointer fw-500" style={{ color: '#00d1b2' }} onClick={() => handleCancelOrder(item)}>
          {t('common.cancel', '取消')}
        </span>
      default:
        return null
    }
  }

  const handleChangeSort = (columnId: string, sortByKey: string = '', ascending: boolean = false) => {
    if (!sortByKey) {
      sortByKey = column.find(item => item.id === columnId)?.sortByKey || ''
    }
    if (!sortByKey) return  // no valid sort key, skip

    // 用展开符创建新数组，保证引用变化，让 ColumnList 的 useEffect([data]) 能检测到更新
    merge(traderDetailsOpenOrdersAdditionalStore, {
      sortColumnId: columnId,
      list: sortArrayByKey([...traderDetailsOpenOrdersAdditionalStore.list], sortByKey, ascending)
    })
  }

  const handleSendMessage = (unsubscribe: boolean = false) => {
    const _address = traderDetailsOpenOrdersAdditionalStore.address
    const methodContent = unsubscribe ? 'unsubscribe' : 'subscribe'
// console.log('handleSendMessage', readyState, ReadyState.OPEN, _address)

    /*  unsubscribe   autoRefreshing    
        True           True             False
        False          True             False
        True           False            False
        False          False            True    不更新时，不能进行订阅
     */
    if ((!unsubscribe && !autoRefreshing) || readyState !== ReadyState.OPEN || !_address) return

    sendMessage(`{ "method": "${methodContent}", "subscription": { "type": "orderUpdates", "user": "${_address}" } }`)
  }

  const handleOrderUpdatesByRaw = (raw: Array<any>, list: Array<any>) => {
    /* status
      open: 订单已创建但尚未执行，仍在市场中等待成交。
      filled: 订单已完全成交，所有指定的资产已成功买入或卖出。
      canceled: 订单已被用户或系统取消，不再有效。
      triggered: 订单条件已满足，已被激活但尚未完全成交。
      rejected: 订单未被接受，可能由于参数错误或市场条件不符合。
      marginCanceled: 边际订单因保证金不足而被取消。
    */

    const openOrders: Array<any> = []
    const wsRemovedOrders: Record<string, any> = {}
    // 记录 WS 消息中已存在于 list 的订单 ID（避免重复添加）
    const existingOrderIds = new Set(list.map(item => String(item.orderId)))

    raw.forEach((item: any) => {
      const { order, status } = item
      const orderId = order.oid

      switch(status) {
        case 'open':
          // 只添加 list 中还不存在的订单（避免与 API 数据重复）
          if (!existingOrderIds.has(String(orderId))) {
            openOrders.push({
              orderId,
              side: formatSideByRaw(order.side),
              coin: order.coin,
              size: order.sz,
              createTs: order.timestamp,
              limitPrice: order.limitPx,
              orderType: 'limit',
              reduceOnly: order.reduceOnly || false,
              isTrigger: order.isTrigger || false,
              isTPSL: order.isPositionTpsl || false,
              value: Number(order.limitPx || 0) * Number(order.sz || 0)
            })
          }
          break
        case 'filled':
        case 'canceled':
        case 'rejected':
        case 'marginCanceled':
          // 明确的终态才从列表删除，避免 'triggered' 等中间态误删
          wsRemovedOrders[String(orderId)] = true
          break
        default:
          // triggered 等中间态：不做处理，保留原 list 中的订单
          break
      }
    })

    return list.filter(item => !wsRemovedOrders[String(item.orderId)]).concat(openOrders)
  }

  const handleOpenOrdersByApi = async () => {
    const { data, error } = await reqStore.hyperUserOpenOrdersAdditional(traderDetailsOpenOrdersAdditionalStore.address)

    if (error) return

    // update
    traderDetailsOpenOrdersAdditionalStore.list = data.list
  }

  const onInitUpdate = async () => {
// console.log(address,  traderDetailsOpenOrdersAdditionalStore.address)
    // 地址
    if (address !== traderDetailsOpenOrdersAdditionalStore.address) {
      if (traderDetailsOpenOrdersAdditionalStore.address) {
        // unsubscribe
        handleSendMessage(true)
      }
      traderDetailsOpenOrdersAdditionalStore.address = address
    }

    await handleOpenOrdersByApi()
    handleSendMessage()
    handleChangeSort(traderDetailsOpenOrdersAdditionalStore.sortColumnId)
  }

  const onCleanUp = () => {
    handleSendMessage(true)

    if (!unReset) {
      traderDetailsOpenOrdersAdditionalStore.reset()
    }
  }

  // useImperativeHandle(ref, () => ({
  //   onInitUpdate,
  //   onCleanUp
  // }))

  // init: 加载 API 数据（不依赖 WS 连接状态）
  useEffect(() => {
    const asyncFunc = async () => {
      if (!address) {
        traderDetailsOpenOrdersAdditionalStore.reset()
        return
      }

      // 更新地址
      if (address !== traderDetailsOpenOrdersAdditionalStore.address) {
        traderDetailsOpenOrdersAdditionalStore.address = address
      }

      // 直接从 API 加载挂单数据，不等待 WS 连接
      await handleOpenOrdersByApi()
      handleChangeSort(traderDetailsOpenOrdersAdditionalStore.sortColumnId)
    }

    asyncFunc()

    return () => {
      if (!unReset) {
        traderDetailsOpenOrdersAdditionalStore.reset()
      }
    }
  }, [address, tradeStore.refreshTick])

  // WS 订阅（只有 WS 连接时才订阅，用于实时增量更新）
  useEffect(() => {
    if (!address || readyState !== ReadyState.OPEN) return

    handleSendMessage()

    return () => {
      handleSendMessage(true)
    }
  }, [readyState, address, autoRefreshing])

  // 处理原始数据
  useEffect(() => {
    if (lastMessage == null) return

    try {
      const res = JSON.parse(lastMessage.data)

      switch(res.channel) {
        case 'orderUpdates':
          traderDetailsOpenOrdersAdditionalStore.list = handleOrderUpdatesByRaw(res.data, traderDetailsOpenOrdersAdditionalStore.list)
          handleChangeSort(traderDetailsOpenOrdersAdditionalStore.sortColumnId)

          break
        default:
      }
    } catch(e) {
      console.error(e)
    }
  }, [lastMessage])

  return (
    <ColumnList
      columns={column}
      className={className}
      data={[...traderDetailsOpenOrdersAdditionalStore.list]}
      busy={reqStore.hyperUserOpenOrdersAdditionalBusy}
      sortColumnId={traderDetailsOpenOrdersAdditionalStore.sortColumnId}
      renderItem={renderItem}
      onChangeSort={handleChangeSort}
      filterCoin={filterCoin} />
  )
}