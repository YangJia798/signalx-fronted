import BN from 'bignumber.js'

import { getDecimalLength } from '@/utils'
import { constants } from '@/stores'

export const formatUPnlStatus = (bn: BN) => {
  return bn.gt(0) && 1 || bn.lt(0) && -1 || 0
}

export const formatStatusClassName = (status: number) => {
  return status > 0 && 'color-success' || status < 0 && 'color-error' || ''
}

export const formatPositionByItem = (item: any, idx: number): Record<string, any> => {
  const bnUPnl = new BN(item.unrealizedPnl)
  const uPnlStatus = formatUPnlStatus(bnUPnl)
  const openPrice = item.entryPx
  const liquidationPrice = item.liquidationPx
  const priceDecimal = getDecimalLength(openPrice)

  return {
    idx,
    walletId: item.walletId, // 固定1
    coin: item.coin, // 
    leverage: item.leverage, // 
    direction: item.direction, // long，short
    type: item.type, // cross，isolated
    size: item.szi, // 仓位大小
    positionValue: new BN(item.positionValue).toFixed(constants.decimalPlaces.__COMMON__), // 
    openPrice, // 购买价
    markPrice: item.markPx, // 标记价格
    uPnl: bnUPnl.toFixed(constants.decimalPlaces.__uPnl__), //
    // NOTE: 过滤掉尾部百分比
    uPnlRatio: item.unrealizedPnlRatio.replace('%', ''), //
    uPnlStatus,
    uPnlStatusClassName: formatStatusClassName(uPnlStatus),
    liquidationPrice: liquidationPrice ? new BN(liquidationPrice).toFixed(priceDecimal) : '', // 强平价，可能为null
    marginUsed: new BN(item.marginUsed).toFixed(constants.decimalPlaces.__COMMON__), // 
  }
}

export const formatCopyTradingByItem = (item: any, idx: number): Record<string, any> => {
  const bnPnl = new BN(item.pnl || 0)
  const pnlStatus = formatUPnlStatus(bnPnl)
  const marginUsedRatioRaw = item.marginUsedRatio ?? '0'

  return {
    idx,
    id: item.id,
    balance: new BN(item.balance || 0).toFixed(constants.decimalPlaces.__COMMON__),
    pnl: bnPnl.toFixed(constants.decimalPlaces.__uPnl__),
    pnlStatus,
    pnlStatusClassname: formatStatusClassName(pnlStatus),
    marginUsedRatio: new BN(String(marginUsedRatioRaw).replace('%', '')).toFixed(2),
    ...formatOpenPositionByItem(item)
  }
}

export const formatOpenPositionByItem = (item: any): Record<string, any> => {
  return {
    address: item.masterAddress ?? item.targetWallet ?? item.wallet,
    operaAddress: item.apiWalletAddress ?? item.mainWallet,
    note: item.remark ?? '',
    leverage: item.maxLeverage ?? item.leverage,
    followModel: item.followModel ?? item.buyModel,
    followModelValue: String(item.followModelValue ?? item.buyModelValue ?? ''),
    marginMode: item.marginMode,
    followMasterLeverage: item.followMasterLeverage,
    maxMarginUsage: item.maxMarginUsage,
    isEnabled: item.isEnabled ?? item.status ?? 1,
  }
}

export function timeToLocal(originalTime: number) {
    const d = new Date(originalTime);
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
}