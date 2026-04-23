import { useEffect, useState } from 'react'
import { useAccountStore, usePrivateWalletStore, useReqStore } from '@/stores'
import { addressShortener, formatNumber } from '@/utils'
import TimeAgo from '@/components/TimeAgo'

const CHAIN_LABEL: Record<number, string> = {
  56: 'BSC',
  42161: 'Arbitrum',
  1: 'ETH',
}

const TX_PREFIX: Record<number, string> = {
  56: 'https://bscscan.com/tx/',
  42161: 'https://arbiscan.io/tx/',
  1: 'https://etherscan.io/tx/',
}

const STATE_STYLE: Record<string, { color: string; label: string }> = {
  SUCCESS:    { color: '#16c784', label: '成功' },
  PROCESSING: { color: '#f5a623', label: '处理中' },
  FAILED:     { color: '#ea3943', label: '失败' },
}

const COL_CLASS = 'font-size-12 color-secondary text-nowrap'
const HL_CHAIN_ID = 42161

type HLRecord = {
  type: string
  amount: string | number
  amountToken: string
  usdcValue: string | number
  destinationAddress: string
  tx: string
  createTs: number
}

type AsterRecord = {
  type: 'DEPOSIT' | 'WITHDRAW'
  asset: string
  amount: string
  state: 'PROCESSING' | 'SUCCESS' | 'FAILED'
  txHash: string
  time: number
  chainId: number
}

const TradeDepositsWithdrawals = ({ className = '' }: { className?: string }) => {
  const accountStore = useAccountStore()
  const privateWalletStore = usePrivateWalletStore()
  const reqStore = useReqStore()

  const [tab, setTab] = useState<'deposit' | 'withdraw'>('deposit')
  const [hlList, setHlList] = useState<HLRecord[]>([])
  const [asterList, setAsterList] = useState<AsterRecord[]>([])
  const [busy, setBusy] = useState(false)

  const activeWallet = privateWalletStore.list[
    privateWalletStore.operaWalletIdx === -1 ? 0 : privateWalletStore.operaWalletIdx
  ] || privateWalletStore.list[0]

  const platform = activeWallet?.platform || 'hyperliquid'
  const address = activeWallet?.address || ''
  const walletId = activeWallet?.walletId

  useEffect(() => {
    if (!address) return

    let cancelled = false
    setBusy(true)

    const load = async () => {
      if (platform === 'aster') {
        if (!walletId) { setBusy(false); return }
        const { data, error } = await reqStore.asterDepositWithdrawHistory(accountStore, walletId)
        if (cancelled) return
        if (!error) setAsterList(data.list)
      } else {
        const { data, error } = await reqStore.hyperUserNonFunding(address)
        if (cancelled) return
        if (!error) setHlList(data.list || [])
      }
      setBusy(false)
    }

    load()
    return () => { cancelled = true }
  }, [platform, address, walletId])

  const isDeposit = tab === 'deposit'

  // ── Hyperliquid rows ─────────────────────────────────────────────────────
  const hlFiltered = hlList.filter(item =>
    isDeposit ? item.type === 'deposit' : item.type === 'withdrawal'
  )

  // ── Aster rows ───────────────────────────────────────────────────────────
  const asterFiltered = asterList.filter(item =>
    isDeposit ? item.type === 'DEPOSIT' : item.type === 'WITHDRAW'
  )

  const isEmpty = platform === 'aster' ? asterFiltered.length === 0 : hlFiltered.length === 0

  return (
    <div className={`d-flex flex-column w-100 ${className}`}>
      {/* 存款/提现 tabs */}
      <div className="d-flex align-items-center gap-3 mb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
        {(['deposit', 'withdraw'] as const).map(t => (
          <span
            key={t}
            className={`cursor-pointer font-size-13 fw-500 pb-1 transition-2 ${tab === t ? 'color-white' : 'color-secondary hover-text-white'}`}
            style={tab === t ? { borderBottom: '2px solid white', marginBottom: '-9px' } : {}}
            onClick={() => setTab(t)}
          >
            {t === 'deposit' ? '存款记录' : '提现记录'}
          </span>
        ))}
      </div>

      {/* Table header */}
      <div className="d-flex gap-2 px-2 py-1 mb-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className={`${COL_CLASS} col-2`}>时间</span>
        <span className={`${COL_CLASS} col-1`}>链</span>
        <span className={`${COL_CLASS} col-2`}>地址</span>
        <span className={`${COL_CLASS} col-2 justify-content-end text-end`}>金额</span>
        <span className={`${COL_CLASS} col-3 justify-content-end text-end`}>交易记录</span>
        <span className={`${COL_CLASS} col-2 justify-content-end text-end`}>状态</span>
      </div>

      {/* Loading */}
      {busy && (
        <div className="d-flex align-items-center justify-content-center py-5 color-secondary font-size-13">
          加载中...
        </div>
      )}

      {/* Empty */}
      {!busy && isEmpty && (
        <div className="d-flex flex-column align-items-center justify-content-center py-5 gap-2">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="color-secondary font-size-13">无数据</span>
        </div>
      )}

      {/* Hyperliquid rows */}
      {!busy && platform === 'hyperliquid' && hlFiltered.map((item, idx) => (
        <div key={idx} className="d-flex gap-2 px-2 py-2 align-items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <span className="col-2 font-size-12 color-secondary">
            <TimeAgo ts={item.createTs} />
          </span>
          <span className="col-1 font-size-12 color-white">Arbitrum</span>
          <span className="col-2 font-size-12 color-secondary" title={item.destinationAddress}>
            {item.destinationAddress ? addressShortener(item.destinationAddress) : '-'}
          </span>
          <span className="col-2 font-size-12 color-white justify-content-end text-end">
            {formatNumber(Number(item.usdcValue))} {item.amountToken || 'USDC'}
          </span>
          <span className="col-3 font-size-12 justify-content-end text-end">
            {item.tx ? (
              <a href={`https://arbiscan.io/tx/${item.tx}`} className="linker-hover-secondary" target="_blank" rel="noreferrer">
                {addressShortener(item.tx)}
              </a>
            ) : '-'}
          </span>
          <span className="col-2 font-size-12 justify-content-end text-end" style={{ color: '#16c784' }}>成功</span>
        </div>
      ))}

      {/* Aster rows */}
      {!busy && platform === 'aster' && asterFiltered.map((item, idx) => {
        const stateStyle = STATE_STYLE[item.state] || { color: 'rgba(255,255,255,0.45)', label: item.state }
        const chainLabel = CHAIN_LABEL[item.chainId] || `Chain ${item.chainId}`
        const txPrefix = TX_PREFIX[item.chainId] || 'https://arbiscan.io/tx/'
        return (
          <div key={idx} className="d-flex gap-2 px-2 py-2 align-items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <span className="col-2 font-size-12 color-secondary">
              <TimeAgo ts={item.time} />
            </span>
            <span className="col-1 font-size-12 color-white">{chainLabel}</span>
            <span className="col-2 font-size-12 color-secondary" title={address}>
              {address ? addressShortener(address) : '-'}
            </span>
            <span className="col-2 font-size-12 color-white justify-content-end text-end">
              {formatNumber(Number(item.amount))} {item.asset}
            </span>
            <span className="col-3 font-size-12 justify-content-end text-end">
              {item.txHash ? (
                <a href={`${txPrefix}${item.txHash}`} className="linker-hover-secondary" target="_blank" rel="noreferrer">
                  {addressShortener(item.txHash)}
                </a>
              ) : '-'}
            </span>
            <span className="col-2 font-size-12 justify-content-end text-end" style={{ color: stateStyle.color }}>
              {stateStyle.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default TradeDepositsWithdrawals
