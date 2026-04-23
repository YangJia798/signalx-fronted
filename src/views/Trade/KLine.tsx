import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, LineData, HistogramData, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts'
import { useLocation } from 'react-router-dom'
import { hyperApi, asterApi } from '@/stores/req/helper'
import { useTradeStore } from '@/stores'
import { useHyperWSContext, ReadyState } from '@/components/Hyper/WSContext'

export const INTERVAL_MAP = [
  { label: '1分钟', value: '1m', resolution: 60 * 1000 },
  { label: '5分钟', value: '5m', resolution: 5 * 60 * 1000 },
  { label: '15分钟', value: '15m', resolution: 15 * 60 * 1000 },
  { label: '1小时', value: '1h', resolution: 60 * 60 * 1000 },
  { label: '4小时', value: '4h', resolution: 4 * 60 * 60 * 1000 },
  { label: '1天', value: '1d', resolution: 24 * 60 * 60 * 1000 },
  { label: '1周', value: '1W', resolution: 7 * 24 * 60 * 60 * 1000 },
  { label: '1月', value: '1M', resolution: 30 * 24 * 60 * 60 * 1000 },
]

export const calculateMA = (data: CandlestickData[], period: number): LineData[] => {
  const maData: LineData[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) continue
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close
    }
    maData.push({ time: data[i].time, value: sum / period })
  }
  return maData
}

const isValidCandle = (c: any): boolean => {
  return (
    c &&
    typeof c.time !== 'undefined' &&
    !isNaN(Number(c.time)) &&
    !isNaN(Number(c.open)) &&
    !isNaN(Number(c.high)) &&
    !isNaN(Number(c.low)) &&
    !isNaN(Number(c.close)) &&
    c.open !== null &&
    c.high !== null &&
    c.low !== null &&
    c.close !== null
  )
}

const filterAndSortData = <T extends { time: any }>(data: T[]): T[] => {
  const seenTime = new Set()
  return data
    .filter(item => {
      const timeVal = Number(item.time)
      if (isNaN(timeVal) || seenTime.has(timeVal)) return false
      seenTime.add(timeVal)
      return true
    })
    .sort((a, b) => Number(a.time) - Number(b.time))
}

const TradeKLine = () => {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const platform = searchParams.get('platform') || 'hyperliquid'
  const tradeStore = useTradeStore()
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  const seriesRef = useRef<{
    candle: ISeriesApi<"Candlestick"> | null,
    volume: ISeriesApi<"Histogram"> | null,
    ma5: ISeriesApi<"Line"> | null,
    ma10: ISeriesApi<"Line"> | null,
    ma20: ISeriesApi<"Line"> | null,
  }>({ candle: null, volume: null, ma5: null, ma10: null, ma20: null })

  // activeInterval gives instant button highlight; interval drives the data fetch (debounced)
  const [interval, setInterval] = useState('15m')
  const [activeInterval, setActiveInterval] = useState('15m')
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const { sendMessage, lastMessage, readyState } = useHyperWSContext()

  const handleIntervalChange = (value: string) => {
    setActiveInterval(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setInterval(value), 300)
  }

  // Track state for updates
  const candleDataRef = useRef<CandlestickData[]>([])
  // Store coin in a ref so the retry timer always uses the latest value
  const coinRef = useRef<string>('')

  // Keep coinRef in sync with store
  const coin = tradeStore.coin
  coinRef.current = coin

  // Subscribe/Unsubscribe WS
  const handleWS = (type: 'subscribe' | 'unsubscribe', currentCoin: string, currentInterval: string) => {
    if (platform === 'aster' || readyState !== ReadyState.OPEN || !currentCoin) return
    sendMessage(`{ "method": "${type}", "subscription": { "type": "candle", "coin": "${currentCoin}", "interval": "${currentInterval}" } }`)
  }

  // Create chart layout - runs once on mount
  useEffect(() => {
    if (!chartContainerRef.current) return

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'rgba(0, 0, 0, 0)' },
        textColor: 'rgba(255, 255, 255, 0.45)',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      crosshair: {
        mode: 1,
        vertLine: { width: 1, color: 'rgba(255, 255, 255, 0.2)', style: 1 },
        horzLine: { width: 1, color: 'rgba(255, 255, 255, 0.2)', style: 1 },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        autoScale: true,
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
      },
      height: 480,
    })
    chartRef.current = chart

    seriesRef.current.candle = chart.addSeries(CandlestickSeries, {
      upColor: '#16c784',
      downColor: '#ea3943',
      borderVisible: false,
      wickUpColor: '#16c784',
      wickDownColor: '#ea3943',
      // 保留实时价格红线
      lastValueVisible: true,
      priceLineVisible: true,
      priceLineColor: '#ea3943',
      priceLineWidth: 1,
      priceLineStyle: 2, // 虚线
    })

    seriesRef.current.volume = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      lastValueVisible: false,
      priceLineVisible: false,
    })

    seriesRef.current.volume.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })

    seriesRef.current.ma5 = chart.addSeries(LineSeries, { color: '#f5a623', lineWidth: 1, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false })
    seriesRef.current.ma10 = chart.addSeries(LineSeries, { color: '#b620e0', lineWidth: 1, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false })
    seriesRef.current.ma20 = chart.addSeries(LineSeries, { color: '#4a90e2', lineWidth: 1, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false })

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      chartRef.current = null
    }
  }, [])

  // Fetch REST data when coin or interval changes
  useEffect(() => {
    // coin is read from the proxy here so store tracks it
    if (!coin) return

    // Cancel any previous in-flight request
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal

    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    setLoading(true)

    const loadData = async () => {
      // Wait for chart if not yet ready (handles mount race)
      if (!chartRef.current) {
        retryTimer = setTimeout(() => {
          if (!cancelled) loadData()
        }, 150)
        return
      }

      try {
        const endTime = Date.now()
        const resolution = INTERVAL_MAP.find(i => i.value === interval)!.resolution
        const limit = interval.includes('W') || interval.includes('M') ? 200 : 1000
        const startTime = endTime - (limit * resolution)

        if (platform === 'aster') {
          let astInterval = interval
          if (astInterval === '1W') astInterval = '1w'
          const parseSymbol = coin.endsWith('USD1') || coin.endsWith('USDT') ? coin : `${coin}USD1`
          const asterSymbol = parseSymbol

          const res = await asterApi.get(`/fapi/v3/klines`, {
            params: {
              symbol: asterSymbol,
              interval: astInterval,
              startTime,
              endTime,
              limit
            },
            signal,
          })

          if (cancelled || !chartRef.current) return

          if (res.data && Array.isArray(res.data)) {
            const cData: CandlestickData[] = []
            const vData: HistogramData[] = []

            res.data.forEach((item: any) => {
              const time = Math.floor(item[0] / 1000) as any
              const open = Number(item[1])
              const high = Number(item[2])
              const low = Number(item[3])
              const close = Number(item[4])
              const volume = Number(item[5])
              
              const candle = { time, open, high, low, close }
              if (isValidCandle(candle)) {
                cData.push(candle)
                vData.push({ time, value: volume, color: close >= open ? 'rgba(22, 199, 132, 0.4)' : 'rgba(234, 57, 67, 0.4)' })
              }
            })

            const finalCData = filterAndSortData(cData)
            const finalVData = filterAndSortData(vData)

            candleDataRef.current = finalCData
            seriesRef.current.candle?.setData(finalCData)
            seriesRef.current.volume?.setData(finalVData)

            seriesRef.current.ma5?.setData(calculateMA(finalCData, 5))
            seriesRef.current.ma10?.setData(calculateMA(finalCData, 10))
            seriesRef.current.ma20?.setData(calculateMA(finalCData, 20))

            const timeScale = chartRef.current?.timeScale()
            if (timeScale && cData.length > 0) {
              timeScale.setVisibleLogicalRange({
                from: cData.length - 150,
                to: cData.length,
              })
            }
          }
        } else {
          const res = await hyperApi.post('/info', {
            type: 'candleSnapshot',
            req: { coin, interval, startTime, endTime }
          }, { signal })

          if (cancelled || !chartRef.current) return

          if (res.data && Array.isArray(res.data)) {
            const cData: CandlestickData[] = []
            const vData: HistogramData[] = []

            res.data.forEach((c: any) => {
              const time = Math.floor(c.t / 1000) as any
              const candle = { time, open: Number(c.o), high: Number(c.h), low: Number(c.l), close: Number(c.c) }
              if (isValidCandle(candle)) {
                cData.push(candle)
                vData.push({ time, value: Number(c.v), color: candle.close >= candle.open ? 'rgba(22, 199, 132, 0.4)' : 'rgba(234, 57, 67, 0.4)' })
              }
            })

            const finalCData = filterAndSortData(cData)
            const finalVData = filterAndSortData(vData)

            // Clear old data only when new data is ready
            candleDataRef.current = finalCData

            seriesRef.current.candle?.setData(finalCData)
            seriesRef.current.volume?.setData(finalVData)

            seriesRef.current.ma5?.setData(calculateMA(finalCData, 5))
            seriesRef.current.ma10?.setData(calculateMA(finalCData, 10))
            seriesRef.current.ma20?.setData(calculateMA(finalCData, 20))

            const timeScale = chartRef.current?.timeScale()
            if (timeScale && cData.length > 0) {
              timeScale.setVisibleLogicalRange({
                from: cData.length - 150,
                to: cData.length,
              })
            }
          }
        }
      } catch (err: any) {
        if (err?.name === 'CanceledError' || err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') return
        console.error('K-Line: Failed to fetch candles', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()
    handleWS('subscribe', coin, interval)

    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
      handleWS('unsubscribe', coin, interval)
      // Do NOT call setData([]) here - it wipes the chart before new data arrives
      // on interval switch, causing the blank chart bug. Data is managed inside loadData.
    }
  }, [coin, interval, platform])

  // Handle Real-time WS updates
  useEffect(() => {
    if (platform === 'aster' || !lastMessage) return

    try {
      const res = JSON.parse(lastMessage.data)
      if (res.channel === 'candle' && res.data && res.data.c) {
        const c = res.data.c
        const wsCoin = res.data.s
        const wsInterval = res.data.i

        if (wsCoin !== coinRef.current || wsInterval !== interval) return

        const time = Math.floor(c.t / 1000) as any
        const bar: CandlestickData = { time, open: Number(c.o), high: Number(c.h), low: Number(c.l), close: Number(c.c) }
        
        if (!isValidCandle(bar)) return

        const vol: HistogramData = { time, value: Number(c.v), color: bar.close >= bar.open ? 'rgba(22, 199, 132, 0.4)' : 'rgba(234, 57, 67, 0.4)' }

        seriesRef.current.candle?.update(bar)
        seriesRef.current.volume?.update(vol)

        if (candleDataRef.current.length > 0) {
          const lastNumTime = Number(candleDataRef.current[candleDataRef.current.length - 1].time)
          const newNumTime = Number(bar.time)

          if (newNumTime > lastNumTime) {
            candleDataRef.current.push(bar)
          } else if (newNumTime === lastNumTime) {
            candleDataRef.current[candleDataRef.current.length - 1] = bar
          }

          const ma5 = calculateMA(candleDataRef.current.slice(-6), 5)
          const ma10 = calculateMA(candleDataRef.current.slice(-11), 10)
          const ma20 = calculateMA(candleDataRef.current.slice(-21), 20)

          if (ma5.length) seriesRef.current.ma5?.update(ma5[ma5.length - 1])
          if (ma10.length) seriesRef.current.ma10?.update(ma10[ma10.length - 1])
          if (ma20.length) seriesRef.current.ma20?.update(ma20[ma20.length - 1])
        }
      }
    } catch (err) {
    }
  }, [lastMessage, platform])

  // Native Aster WebSocket connection
  useEffect(() => {
    if (platform !== 'aster' || !coin) return
     
    let astInterval = interval
    if (astInterval === '1W') astInterval = '1w'
    const parseSymbol = coin.endsWith('USD1') || coin.endsWith('USDT') ? coin : `${coin}USD1`
    const asterSymbol = parseSymbol.toLowerCase()
    const streamName = `${asterSymbol}@kline_${astInterval}`

    const asterWsUrl = import.meta.env.VITE_ASTER_WS_URL || 'wss://fstream.asterdex.com/ws'
    const ws = new WebSocket(asterWsUrl)

    ws.onopen = () => {
        ws.send(JSON.stringify({
          method: "SUBSCRIBE",
          params: [streamName],
          id: 1
        }))
    }

    ws.onmessage = (event) => {
        try {
          const res = JSON.parse(event.data)
          if (res.e === 'kline' && res.k) {
            const k = res.k
            const time = Math.floor(k.t / 1000) as any
            const bar: CandlestickData = { time, open: Number(k.o), high: Number(k.h), low: Number(k.l), close: Number(k.c) }
            
            if (!isValidCandle(bar)) return

            const vol: HistogramData = { time, value: Number(k.v), color: bar.close >= bar.open ? 'rgba(22, 199, 132, 0.4)' : 'rgba(234, 57, 67, 0.4)' }

            seriesRef.current.candle?.update(bar)
            seriesRef.current.volume?.update(vol)

            if (candleDataRef.current.length > 0) {
              const lastNumTime = Number(candleDataRef.current[candleDataRef.current.length - 1].time)
              const newNumTime = Number(bar.time)

              if (newNumTime > lastNumTime) {
                candleDataRef.current.push(bar)
              } else if (newNumTime === lastNumTime) {
                candleDataRef.current[candleDataRef.current.length - 1] = bar
              }

              const ma5 = calculateMA(candleDataRef.current.slice(-6), 5)
              const ma10 = calculateMA(candleDataRef.current.slice(-11), 10)
              const ma20 = calculateMA(candleDataRef.current.slice(-21), 20)

              if (ma5.length) seriesRef.current.ma5?.update(ma5[ma5.length - 1])
              if (ma10.length) seriesRef.current.ma10?.update(ma10[ma10.length - 1])
              if (ma20.length) seriesRef.current.ma20?.update(ma20[ma20.length - 1])
            }
          }
        } catch (e) {}
    }

    return () => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                method: "UNSUBSCRIBE",
                params: [streamName],
                id: 1
            }))
        }
        ws.close()
    }
  }, [platform, coin, interval])

  return (
    <div className="d-flex flex-column w-100 h-100 position-relative bg-gray-alpha-4 br-3 p-2">
      {/* K-Line Toolbar */}
      <div className="d-flex align-items-center gap-2 mb-2 px-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
        {INTERVAL_MAP.map((item) => (
          <div
            key={item.value}
            className={`cursor-pointer font-size-12 px-2 py-1 br-3 transition-2 ${activeInterval === item.value ? 'color-text-main fw-500' : 'color-secondary hover-bg-gray'}`}
            style={{ background: activeInterval === item.value ? 'rgba(255,255,255,0.08)' : 'transparent' }}
            onClick={() => handleIntervalChange(item.value)}
          >
            {item.label}
          </div>
        ))}
      </div>

      {/* Chart Container */}
      <div className="position-relative flex-grow-1 w-100" style={{ minHeight: '400px', flex: '1 1 auto' }}>
        <div ref={chartContainerRef} className="w-100 h-100" />
        {loading && (
          <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.35)', zIndex: 10 }}>
            <div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.15)', borderTopColor: 'rgba(255,255,255,0.7)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default TradeKLine