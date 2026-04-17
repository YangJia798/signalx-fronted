import BN from 'bignumber.js'

import { merge, getDecimalLength } from '@/utils'
import { hyperApi } from '@/stores/req/helper'
import { constants, TAccountStore, TCopyTradingStore } from '@/stores'

import { formatUPnlStatus, formatStatusClassName } from '../utils'

type CopyTradingTargetPositionResult = {
  data: Record<string, any>,
  error: boolean
}

export type TCopyTradingTargetPosition = {
  copyTradingTargetPosition: (accountStore: TAccountStore, copyTradingStore: TCopyTradingStore) => Promise<CopyTradingTargetPositionResult>
  copyTradingTargetPositionBusy: boolean
}

export const copyTradingTargetPosition: TCopyTradingTargetPosition = {
  async copyTradingTargetPosition(accountStore, copyTradingStore) {
    const result: CopyTradingTargetPositionResult = { data: {}, error: true }
    const { logged } = accountStore

    if (this.copyTradingTargetPositionBusy || !logged) return result

    this.copyTradingTargetPositionBusy = true

    try {
      const res = await hyperApi.post('/info', {
        type: 'clearinghouseState',
        user: copyTradingStore.copyTradingSearchTargetAddress
      })

      this.copyTradingTargetPositionBusy = false

      const data = res.data
      if (!data || !data.assetPositions) {
        result.error = true
        return result
      }

      let bnTotalUPnl = new BN(0)
      const { decimalPlaces } = constants

      const positions = data.assetPositions
        .filter((item: any) => item.position && new BN(item.position.szi).abs().gt(0))
        .map((item: any, idx: number) => {
          const position = item.position
          const bnSize = new BN(position.szi)
          const bnPositionValue = new BN(position.positionValue)
          const bnUPnl = new BN(position.unrealizedPnl)
          const bnMarginUsed = new BN(position.marginUsed)
          const isLong = bnSize.gte(0)
          const uPnlStatus = formatUPnlStatus(bnUPnl)
          const openPrice = position.entryPx
          const liquidationPrice = position.liquidationPx
          const priceDecimal = getDecimalLength(openPrice)

          bnTotalUPnl = bnTotalUPnl.plus(bnUPnl)

          return {
            idx,
            coin: position.coin,
            leverage: position.leverage.value,
            direction: isLong ? 'long' : 'short',
            type: position.leverage.type,
            size: bnSize.abs().toString(),
            positionValue: bnPositionValue.toFixed(decimalPlaces.__COMMON__),
            openPrice,
            uPnl: bnUPnl.toFixed(decimalPlaces.__uPnl__),
            uPnlRatio: bnMarginUsed.isZero() ? '0' : bnUPnl.div(bnMarginUsed).times(100).toFixed(2),
            uPnlStatus,
            uPnlStatusClassName: formatStatusClassName(uPnlStatus),
            liquidationPrice: liquidationPrice ? new BN(liquidationPrice).toFixed(priceDecimal) : '',
            marginUsed: bnMarginUsed.toFixed(decimalPlaces.__COMMON__),
          }
        })

      const bnTotalPositionValue = new BN(data.marginSummary?.totalNtlPos || 0)
      const copyTradingTargetTotalUPnlStatus = formatUPnlStatus(bnTotalUPnl)

      result.error = false
      result.data = {
        copyTradingTargetAddress: copyTradingStore.copyTradingSearchTargetAddress,
        copyTradingTargetTotalPositionValue: bnTotalPositionValue.toFixed(decimalPlaces.__COMMON__),
        copyTradingTargetTotalUPnl: bnTotalUPnl.toFixed(decimalPlaces.__uPnl__),
        copyTradingTargetTotalUPnlStatus,
        copyTradingTargetTotalUPnlStatusClassName: formatStatusClassName(copyTradingTargetTotalUPnlStatus),
        copyTradingTargetPositionList: positions
      }

      merge(copyTradingStore, result.data)
    } catch {
      this.copyTradingTargetPositionBusy = false
      result.error = true
    }

    return result
  },
  copyTradingTargetPositionBusy: false,
}
