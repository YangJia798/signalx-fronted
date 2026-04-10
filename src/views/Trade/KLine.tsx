import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, LineData, HistogramData, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts'
import { useTradeStore } from '@/stores'
import { hyperApi } from '@/stores/req/helper'
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

const TradeKLine = () => {
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

  const [interval, setInterval] = useState('15m')
  const { sendMessage, lastMessage, readyState } = useHyperWSContext()

  // Track state for updates
  const candleDataRef = useRef<CandlestickData[]>([])
  // Store coin in a ref so the retry timer always uses the latest value
  const coinRef = useRef<string>('')

  // Keep coinRef in sync with store
  const coin = tradeStore.coin
  coinRef.current = coin

  // Subscribe/Unsubscribe WS
  const handleWS = (type: 'subscribe' | 'unsubscribe', currentCoin: string, currentInterval: string) => {
    if (readyState !== ReadyState.OPEN || !currentCoin) return
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

    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | null = null

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

        const res = await hyperApi.post('/info', {
          type: 'candleSnapshot',
          req: { coin, interval, startTime, endTime }
        })

        if (cancelled || !chartRef.current) return

        if (res.data && Array.isArray(res.data)) {
          const cData: CandlestickData[] = []
          const vData: HistogramData[] = []

          res.data.forEach((c: any) => {
            const time = Math.floor(c.t / 1000) as any
            cData.push({ time, open: Number(c.o), high: Number(c.h), low: Number(c.l), close: Number(c.c) })
            vData.push({ time, value: Number(c.v), color: Number(c.c) >= Number(c.o) ? 'rgba(22, 199, 132, 0.4)' : 'rgba(234, 57, 67, 0.4)' })
          })

          // Clear old data only when new data is ready
          candleDataRef.current = cData

          seriesRef.current.candle?.setData(cData)
          seriesRef.current.volume?.setData(vData)

          seriesRef.current.ma5?.setData(calculateMA(cData, 5))
          seriesRef.current.ma10?.setData(calculateMA(cData, 10))
          seriesRef.current.ma20?.setData(calculateMA(cData, 20))

          const timeScale = chartRef.current?.timeScale()
          if (timeScale && cData.length > 0) {
            timeScale.setVisibleLogicalRange({
              from: cData.length - 150,
              to: cData.length,
            })
          }
        }
      } catch (err) {
        console.error('K-Line: Failed to fetch candles', err)
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
  }, [coin, interval])

  // Handle Real-time WS updates
  useEffect(() => {
    if (!lastMessage) return

    try {
      const res = JSON.parse(lastMessage.data)
      if (res.channel === 'candle' && res.data && res.data.c) {
        const c = res.data.c
        const wsCoin = res.data.s
        const wsInterval = res.data.i

        if (wsCoin !== coinRef.current || wsInterval !== interval) return

        const time = Math.floor(c.t / 1000) as any
        const bar: CandlestickData = { time, open: Number(c.o), high: Number(c.h), low: Number(c.l), close: Number(c.c) }
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
  }, [lastMessage])

  return (
    <div className="d-flex flex-column w-100 h-100 position-relative bg-gray-alpha-4 br-3 p-2">
      {/* K-Line Toolbar */}
      <div className="d-flex align-items-center gap-2 mb-2 px-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
        {INTERVAL_MAP.map((item) => (
          <div
            key={item.value}
            className={`cursor-pointer font-size-12 px-2 py-1 br-3 transition-2 ${interval === item.value ? 'color-text-main fw-500' : 'color-secondary hover-bg-gray'}`}
            style={{ background: interval === item.value ? 'rgba(255,255,255,0.08)' : 'transparent' }}
            onClick={() => setInterval(item.value)}
          >
            {item.label}
          </div>
        ))}
      </div>

      {/* Chart Container */}
      <div ref={chartContainerRef} className="flex-grow-1 w-100" style={{ minHeight: '400px', flex: '1 1 auto' }} />
    </div>
  )
}

export default TradeKLine