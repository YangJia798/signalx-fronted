import BN from 'bignumber.js'
import { baseCheck, baseApi } from '@/stores/req/helper'
import { constants, TAccountStore } from '@/stores'
import { formatUPnlStatus, formatStatusClassName } from '../utils'

// "BTCUSD1" | "ETHUSDT" → "BTC" | "ETH"
const extractCoin = (symbol: string) =>
  symbol.replace(/USD1$|USDT$|USDC$|BUSD$/, '')

const ORDER_STATUS_MAP: Record<string, string> = {
  FILLED:           'filled',
  CANCELED:         'canceled',
  NEW:              'open',
  PARTIALLY_FILLED: 'open',
  REJECTED:         'perpmarginrejected',
  EXPIRED:          'canceled',
}

const TRIGGER_TYPES = new Set(['STOP', 'TAKE_PROFIT', 'STOP_MARKET', 'TAKE_PROFIT_MARKET'])

// ─── Types ────────────────────────────────────────────────────────────────────

type Result<T = Record<string, any>> = { data: T; error: boolean }

export type TAsterAccountPositions = {
  asterAccountPositions: (accountStore: TAccountStore, walletId: number) => Promise<Result>
  asterAccountPositionsBusy: boolean
}

export type TAsterOpenOrders = {
  asterOpenOrders: (accountStore: TAccountStore, walletId: number) => Promise<Result>
  asterOpenOrdersBusy: boolean
}

export type TAsterHistoricalOrders = {
  asterHistoricalOrders: (accountStore: TAccountStore, walletId: number) => Promise<Result>
  asterHistoricalOrdersBusy: boolean
}

export type TAsterUserFills = {
  asterUserFills: (accountStore: TAccountStore, walletId: number) => Promise<Result>
  asterUserFillsBusy: boolean
}

// ─── Positions ────────────────────────────────────────────────────────────────
// Backend: POST /wallet/aster/positions
//   → signs EIP-712, proxies GET /fapi/v3/positionRisk + GET /fapi/v3/accountWithJoinMargin
//   response: { positions: Aster positionRisk[], account: Aster accountWithJoinMargin }

export const asterAccountPositions: TAsterAccountPositions = {
  async asterAccountPositions(accountStore, walletId) {
    const result: Result = { data: {}, error: true }
    if (this.asterAccountPositionsBusy || !accountStore.logged) return result
    this.asterAccountPositionsBusy = true

    const res = await baseApi.post('/wallet/aster/positions', { walletId })
    result.error = baseCheck(res, accountStore)
    this.asterAccountPositionsBusy = false
    if (result.error) return result

    const { decimalPlaces } = constants
    const positionRisk: any[] = res.data?.data?.positions ?? []
    const account: any = res.data?.data?.account ?? {}

    let bnTotalUPnl = new BN(0)
    let bnTotalLongPositionValue = new BN(0)
    let bnTotalShortPositionValue = new BN(0)

    const positions = positionRisk
      .filter(item => Math.abs(Number(item.positionAmt)) > 1e-8)
      .map((item, idx) => {
        const positionAmt = Number(item.positionAmt)
        const isLong = positionAmt > 0
        const bnPositionValue = new BN(item.notional ?? 0).abs()
        const bnUPnl = new BN(item.unRealizedProfit ?? 0)
        const bnMarginUsed = new BN(item.isolatedMargin ?? 0)

        if (isLong) bnTotalLongPositionValue = bnTotalLongPositionValue.plus(bnPositionValue)
        else bnTotalShortPositionValue = bnTotalShortPositionValue.plus(bnPositionValue)
        bnTotalUPnl = bnTotalUPnl.plus(bnUPnl)

        const uPnlStatus = formatUPnlStatus(bnUPnl)
        const openPrice = item.entryPrice ?? '0'

        return {
          idx,
          coin: extractCoin(item.symbol ?? ''),
          leverage: item.leverage,
          direction: isLong ? 'long' : 'short',
          type: item.marginType === 'cross' ? 'cross' : 'isolated',
          marginMode: item.marginType === 'cross' ? 'cross' : 'isolated',
          size: Math.abs(positionAmt).toString(),
          positionValue: bnPositionValue.toFixed(decimalPlaces.__COMMON__),
          openPrice,
          markPrice: item.markPrice ?? '',
          uPnl: bnUPnl.toFixed(decimalPlaces.__uPnl__),
          uPnlRatio: bnMarginUsed.gt(0)
            ? bnUPnl.div(bnMarginUsed).times(100).toFixed(2)
            : '0.00',
          uPnlStatus,
          uPnlStatusClassName: formatStatusClassName(uPnlStatus),
          liquidationPrice: item.liquidationPrice && Number(item.liquidationPrice) > 0
            ? new BN(item.liquidationPrice).toFixed(2)
            : '',
          marginUsed: bnMarginUsed.toFixed(decimalPlaces.__COMMON__),
          funding: '0',
        }
      })

    const bnPerpEquity = new BN(account.totalMarginBalance ?? 0)
    const bnTotalMarginUsed = new BN(account.totalInitialMargin ?? 0)
    const bnTotalPositionValue = bnTotalLongPositionValue.plus(bnTotalShortPositionValue)
    const zeroPerpEquity = bnPerpEquity.isEqualTo(0)
    const hasPosition = bnTotalPositionValue.gt(0)
    const bnTotalMarginUsageRatio = zeroPerpEquity ? new BN(0) : bnTotalMarginUsed.div(bnPerpEquity)
    const bnWithdrawable = new BN(account.availableBalance ?? 0)

    result.data = {
      positions,
      summary: {
        hasPosition,
        totalPositionValue: bnTotalPositionValue.toFixed(decimalPlaces.__COMMON__),
        totalLongPositionValue: bnTotalLongPositionValue.toFixed(decimalPlaces.__COMMON__),
        totalShortPositionValue: bnTotalShortPositionValue.toFixed(decimalPlaces.__COMMON__),
        perpEquity: bnPerpEquity.toFixed(decimalPlaces.__COMMON__),
        totalMarginUsed: bnTotalMarginUsed.toFixed(decimalPlaces.__COMMON__),
        totalMarginUsagePct: bnTotalMarginUsageRatio.times(100).toFixed(decimalPlaces.__PCT__),
        totalMarginUsageRatio: bnTotalMarginUsageRatio.toFixed(decimalPlaces.__RATIO__),
        leverageRatio: zeroPerpEquity ? '0' : bnTotalPositionValue.div(bnPerpEquity).toFixed(2),
        totalUPnl: bnTotalUPnl.toFixed(decimalPlaces.__uPnl__),
        withdrawable: bnWithdrawable.toFixed(decimalPlaces.__COMMON__),
        withdrawableRatio: zeroPerpEquity ? '0' : bnWithdrawable.div(bnPerpEquity).toFixed(decimalPlaces.__RATIO__),
        withdrawablePct: zeroPerpEquity ? '0' : bnWithdrawable.div(bnPerpEquity).times(100).toFixed(decimalPlaces.__PCT__),
      }
    }
    return result
  },
  asterAccountPositionsBusy: false,
}

// ─── Open Orders ──────────────────────────────────────────────────────────────
// Backend: POST /wallet/aster/open-orders
//   → signs EIP-712, proxies GET /fapi/v3/openOrders
//   response: { orders: Aster openOrders[] }

export const asterOpenOrders: TAsterOpenOrders = {
  async asterOpenOrders(accountStore, walletId) {
    const result: Result = { data: { list: [] }, error: true }
    if (this.asterOpenOrdersBusy || !accountStore.logged) return result
    this.asterOpenOrdersBusy = true

    const res = await baseApi.post('/wallet/aster/open-orders', { walletId })
    result.error = baseCheck(res, accountStore)
    this.asterOpenOrdersBusy = false
    if (result.error) return result

    const orders: any[] = res.data?.data?.orders ?? res.data?.data ?? []

    result.data = {
      list: orders.map((item, idx) => {
        const isTrigger = TRIGGER_TYPES.has(item.type ?? '')
        return {
          idx,
          orderId: item.orderId,
          side: item.side === 'BUY' ? 'buy' : 'sell',
          coin: extractCoin(item.symbol ?? ''),
          size: item.origQty,
          isTrigger,
          triggerPrice: isTrigger && item.stopPrice !== '0' ? item.stopPrice : null,
          isTPSL: isTrigger,
          createTs: item.time ?? item.updateTime,
          limitPrice: item.price,
          orderType: (item.type ?? '').toLowerCase(),
          reduceOnly: item.reduceOnly ?? false,
          value: Number(item.price ?? 0) * Number(item.origQty ?? 0),
        }
      })
    }
    return result
  },
  asterOpenOrdersBusy: false,
}

// ─── Historical Orders ────────────────────────────────────────────────────────
// Backend: POST /wallet/aster/historical-orders
//   → signs EIP-712, proxies GET /fapi/v3/allOrders (limit=500)
//   response: { orders: Aster allOrders[] }

export const asterHistoricalOrders: TAsterHistoricalOrders = {
  async asterHistoricalOrders(accountStore, walletId) {
    const result: Result = { data: { list: [] }, error: true }
    if (this.asterHistoricalOrdersBusy || !accountStore.logged) return result
    this.asterHistoricalOrdersBusy = true

    const res = await baseApi.post('/wallet/aster/historical-orders', { walletId })
    result.error = baseCheck(res, accountStore)
    this.asterHistoricalOrdersBusy = false
    if (result.error) return result

    const orders: any[] = res.data?.data?.orders ?? res.data?.data ?? []

    result.data = {
      list: orders.map((item, idx) => {
        const isTrigger = TRIGGER_TYPES.has(item.type ?? '')
        return {
          idx,
          orderId: item.orderId,
          side: item.side === 'BUY' ? 'buy' : 'sell',
          coin: extractCoin(item.symbol ?? ''),
          size: item.origQty,
          isTrigger,
          triggerPrice: isTrigger && item.stopPrice !== '0' ? item.stopPrice : null,
          isTPSL: isTrigger,
          createTs: item.time ?? item.updateTime,
          limitPrice: item.price,
          orderType: (item.type ?? '').toLowerCase(),
          reduceOnly: item.reduceOnly ?? false,
          executionStatus: ORDER_STATUS_MAP[item.status] ?? (item.status ?? '').toLowerCase(),
        }
      })
    }
    return result
  },
  asterHistoricalOrdersBusy: false,
}

// ─── User Fills / Trades ──────────────────────────────────────────────────────
// Backend: POST /wallet/aster/fills
//   → signs EIP-712, proxies GET /fapi/v3/userTrades (limit=1000)
//   response: { trades: Aster userTrades[] }

export const asterUserFills: TAsterUserFills = {
  async asterUserFills(accountStore, walletId) {
    const result: Result = { data: { list: [] }, error: true }
    if (this.asterUserFillsBusy || !accountStore.logged) return result
    this.asterUserFillsBusy = true

    const res = await baseApi.post('/wallet/aster/fills', { walletId })
    result.error = baseCheck(res, accountStore)
    this.asterUserFillsBusy = false
    if (result.error) return result

    const trades: any[] = res.data?.data?.trades ?? res.data?.data ?? []

    result.data = {
      list: trades.map((item, idx) => ({
        idx,
        coin: extractCoin(item.symbol ?? ''),
        price: item.price,
        side: item.side === 'BUY' ? 'buy' : 'sell',
        startPosition: '0',
        closedPnl: new BN(item.realizedPnl ?? 0).toFixed(constants.decimalPlaces.__uPnl__),
        tx: '',
        fee: new BN(item.commission ?? 0).toFixed(constants.decimalPlaces.__COMMON__),
        size: item.qty,
        feeToken: item.commissionAsset ?? 'USDT',
        createTs: item.time,
        duration: undefined,
      }))
    }
    return result
  },
  asterUserFillsBusy: false,
}
