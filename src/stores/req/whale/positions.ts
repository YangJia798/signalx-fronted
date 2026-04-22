import BN from 'bignumber.js'

import { merge, getDecimalLength } from '@/utils'
import { hyperbotApi } from '@/stores/req/helper'
import { constants, TAccountStore, TWhalePositionsStore } from '@/stores'

import { formatUPnlStatus, formatStatusClassName } from '../utils'

type WhalePositionsResult = {
  data: Record<string, any>,
  error: boolean
}

export type TWhalePositions = {
  whalePositions: (accountStore: TAccountStore, whalePositionsStore: TWhalePositionsStore) => Promise<WhalePositionsResult>
  whalePositionsBusy: boolean
}

export const whalePositions: TWhalePositions = {
  async whalePositions(_accountStore, whalePositionsStore) {
    const result: WhalePositionsResult = { data: {}, error: true }

    if (this.whalePositionsBusy) return result
    this.whalePositionsBusy = true

    const sortItems: Record<string, string> = {
      createTs: 'create-time',
      uPnl: 'profit',
      margin: 'margin-balance',
    }

    try {
      const res = await hyperbotApi.get('/whales/open-positions', {
        params: {
          take: whalePositionsStore.pageSize,
          coin: whalePositionsStore.selectedCoin,
          dir: whalePositionsStore.selectedDirection,
          'npnl-side': whalePositionsStore.selectedUPnl,
          'fr-side': whalePositionsStore.selectedFundingFee,
          'top-by': sortItems[whalePositionsStore.sortColumnId],
        },
      })

      if (res.data?.code !== 0) throw new Error(res.data?.msg)

      const rows = res.data.data || []
      result.data = {
        list: rows.map((item: any, idx: number) => {
          const bnUPnl = new BN(item.unrealizedPnL ?? 0)
          const bnSize = new BN(item.positionSize ?? 0)
          const uPnlStatus = formatUPnlStatus(bnUPnl)
          const bnFundingFee = new BN(item.fundingFee ?? 0)
          const fundingFeeStatus = formatUPnlStatus(bnFundingFee)
          const openPrice = item.entryPrice ?? 0
          const liquidationPrice = item.liqPrice
          const priceDecimal = getDecimalLength(openPrice)

          return {
            idx,
            id: String(item.id ?? idx),
            address: item.user,
            liquidationPrice: liquidationPrice ? new BN(liquidationPrice).toFixed(priceDecimal) : '',
            leverage: item.leverage,
            direction: bnSize.gt(0) ? 'long' : 'short',
            coin: item.symbol,
            size: bnSize.toFixed(constants.decimalPlaces.__COMMON__),
            openPrice: new BN(openPrice).toString(),
            markPrice: item.markPrice ? new BN(item.markPrice).toString() : '0',
            marginUsed: new BN(item.marginBalance ?? 0).toFixed(constants.decimalPlaces.__COMMON__),
            positionValue: new BN(item.positionValueUsd ?? 0).toString(),
            uPnl: bnUPnl.toFixed(constants.decimalPlaces.__uPnl__),
            uPnlStatus,
            uPnlStatusClassName: formatStatusClassName(uPnlStatus),
            uPnlRatio: item.marginBalance
              ? bnUPnl.dividedBy(item.marginBalance).times(100).toFixed(2)
              : '0',
            fundingFee: bnFundingFee.toFixed(constants.decimalPlaces.__COMMON__),
            fundingFeeStatus,
            fundingFeeStatusClassName: formatStatusClassName(fundingFeeStatus),
            type: item.marginMode,
            createTs: item.createTime,
            updateTs: item.updateTime,
          }
        }),
      }
      result.error = false
      merge(whalePositionsStore, result.data)
    } catch {
      result.error = true
    } finally {
      this.whalePositionsBusy = false
    }

    return result
  },
  whalePositionsBusy: false,
}
