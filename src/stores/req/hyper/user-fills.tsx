import BN from 'bignumber.js'

import { merge, defaults, getDecimalLength } from '@/utils'
import { baseCheck, hyperApi } from '@/stores/req/helper'
import { constants, TAccountStore, TLeaderboardStore, formatSideByRaw } from '@/stores'

import { formatUPnlStatus, formatStatusClassName } from '../utils'

type THyperUserFillsResult = {
  data: Record<string, any>,
  error: boolean
}

export type THyperUserFills = {
  /**
   * 获取账号的最近完成订单
   * （最多2000条，aggregateByTime为true会把同一时刻的订单合为一条）
   *  userFillsByTime接口（一次最多2000条，最多可查10000条（可能略高））
   */
  hyperUserFills: (address: string) => Promise<THyperUserFillsResult>
  hyperUserFillsBusy: boolean
}


export const hyperUserFills: THyperUserFills = {
  async hyperUserFills(address) {
    const result: THyperUserFillsResult = { data: {}, error: true }

    if (this.hyperUserFillsBusy) return result

    this.hyperUserFillsBusy = true

    const res = await hyperApi.post('/info', {
      'type': 'userFills',
      'user': address,
      'aggregateByTime': true
    })

    result.error = false
    this.hyperUserFillsBusy = false

    if (result.error) return result

    const { decimalPlaces } = constants
    // update
    const data = res.data

    // Natively calculate duration by scanning fills chronologically (oldest to newest)
    const positionCycleStart: Record<string, number> = {};
    const reversedData = [...data].reverse();

    reversedData.forEach((item: any) => {
      const coin = item.coin;
      const startPos = parseFloat(item.startPosition || '0');
      const sz = parseFloat(item.sz || '0');
      const closedPnl = parseFloat(item.closedPnl || '0');

      if (startPos === 0) {
        positionCycleStart[coin] = item.time;
      }
      if (closedPnl === 0 && !positionCycleStart[coin]) {
        // Fallback if the history doesn't reach back to startPosition 0
        positionCycleStart[coin] = item.time;
      }

      if (closedPnl !== 0 && positionCycleStart[coin]) {
        item.duration = item.time - positionCycleStart[coin];
      }

      // Determine if position flipped or zeroed out
      const sideMult = item.side === 'B' ? 1 : -1;
      const endPos = startPos + (sz * sideMult);

      if ((startPos > 0 && endPos < 0) || (startPos < 0 && endPos > 0)) {
        positionCycleStart[coin] = item.time;
      } else if (Math.abs(endPos) < 1e-8) {
        delete positionCycleStart[coin];
      }
    });

    result.data = {
      list: data.map((item: any, idx: number) => {
        return {
          idx,
          coin: item.coin,
          price: item.px,
          side: formatSideByRaw(item.side),
          startPosition: new BN(item.startPosition).toFixed(decimalPlaces.__COMMON__),
          closedPnl: new BN(item.closedPnl).toFixed(decimalPlaces.__uPnl__),
          tx: item.hash,
          fee: new BN(item.fee).toFixed(decimalPlaces.__COMMON__),
          size: item.sz,
          // crossed
          // dir
          feeToken: item.feeToken,
          createTs: item.time,
          duration: item.duration, // Pass duration
        }
      })
    }

    return result
  },
  hyperUserFillsBusy: false,
}