import { useState, useEffect } from 'react'
import { Input, Slider, Checkbox, Select, Modal, Dropdown, message } from 'antd'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTradeStore, useAccountStore, usePrivateWalletStore, useHyperStore, useReqStore } from '@/stores'
import { IOutlineEdit } from '@/components/icon'
import MarginModeModal from '@/components/Modal/Trade/MarginMode'
import LeverageModal from '@/components/Modal/Trade/Leverage'
import WalletProviderIcon from '@/components/Wallet/ProviderIcon'
import { formatNumber } from '@/utils'

const TradeTradingPanel = () => {
  const tradeStore = useTradeStore()
  const accountStore = useAccountStore()
  const privateWalletStore = usePrivateWalletStore()
  const { t } = useTranslation()
  const hyperStore = useHyperStore()
  const displayCoin = (tradeStore.coin || 'BTC').replace(/USDT?1?$/, '')

  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const platform = searchParams.get('platform') || 'hyperliquid'
  
  const hlMaxLeverage = hyperStore.perpMeta[displayCoin]?.maxLeverage ?? 40
  const maxLeverage = platform === 'aster' ? 25 : hlMaxLeverage

  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy')
  const [orderType, setOrderType] = useState('market')
  const [marginMode, setMarginMode] = useState('cross')
  const [leverage, setLeverage] = useState(platform === 'aster' ? 25 : hlMaxLeverage)

  // Ensure leverage stays within bounds if maxLeverage drops.
  // Also switch to the new platform's max leverage for convenience when platform switches.
  useEffect(() => {
    setLeverage(prev => prev > maxLeverage ? maxLeverage : prev)
  }, [maxLeverage])

  useEffect(() => {
    setLeverage(maxLeverage)
  }, [platform])
  const [quantity, setQuantity] = useState('')
  const [quantityUnit, setQuantityUnit] = useState('USD')
  const [pctValue, setPctValue] = useState(0)
  const [reduceOnly, setReduceOnly] = useState(false)
  const [tpsl, setTpsl] = useState(false)
  const [showMarginModal, setShowMarginModal] = useState(false)
  const [showLeverageModal, setShowLeverageModal] = useState(false)
  const [showNoWalletModal, setShowNoWalletModal] = useState(false)

  const [tpPx, setTpPx] = useState('')
  const [slPx, setSlPx] = useState('')
  const [limitPx, setLimitPx] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const reqStore = useReqStore()

  const isBuy = orderSide === 'buy'

  const marketPrice = Number(hyperStore.perpMarket[displayCoin]?.markPrice || 0)
  const price = orderType === 'limit' && limitPx ? Number(limitPx) : marketPrice

  const activeWallet = privateWalletStore.list[privateWalletStore.operaWalletIdx === -1 ? 0 : privateWalletStore.operaWalletIdx] || privateWalletStore.list[0];
  const availableBalance = activeWallet?.balance ? Number(activeWallet.balance) : 0;

  const getMaxOrderValue = () => availableBalance * leverage;

  const handleSliderChange = (val: number) => {
    setPctValue(val);
    const maxOrderValue = getMaxOrderValue();
    
    let newQtyNum = 0;
    if (quantityUnit === 'USD') {
      newQtyNum = (maxOrderValue * val) / 100;
      setQuantity(newQtyNum > 0 ? newQtyNum.toFixed(2) : '');
    } else {
      if (price > 0) {
        newQtyNum = (maxOrderValue / price * val) / 100;
        const sizeDecimals = hyperStore.perpMeta[displayCoin]?.sizeDecimals || 4;
        setQuantity(newQtyNum > 0 ? newQtyNum.toFixed(sizeDecimals) : '');
      }
    }
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuantity(val);
    const qtyNum = Number(val);
    const maxOrderValue = getMaxOrderValue();
    
    if (maxOrderValue <= 0 || !qtyNum) {
      if (pctValue !== 0) setPctValue(0);
      return;
    }

    const currentOrderValue = quantityUnit === 'USD' ? qtyNum : qtyNum * price;

    let pct = (currentOrderValue / maxOrderValue) * 100;
    if (pct <= 0) pct = 0;
    if (pct >= 100) pct = 100;
    setPctValue(Math.round(pct));
  }

  const handleQuantityUnitChange = (newUnit: string) => {
    setQuantityUnit(newUnit);
    const maxOrderValue = getMaxOrderValue();
    if (newUnit === 'USD') {
      const newQtyNum = (maxOrderValue * pctValue) / 100;
      setQuantity(newQtyNum > 0 ? newQtyNum.toFixed(2) : '');
    } else {
      if (price > 0) {
        const newQtyNum = (maxOrderValue / price * pctValue) / 100;
        const sizeDecimals = hyperStore.perpMeta[displayCoin]?.sizeDecimals || 4;
        setQuantity(newQtyNum > 0 ? newQtyNum.toFixed(sizeDecimals) : '');
      }
    }
  }

  const quantityNum = Number(quantity || 0)
  const orderValue = quantityUnit === 'USD' ? quantityNum : quantityNum * price
  const requiredMargin = leverage > 0 ? orderValue / leverage : 0

  let liquidationPrice = 0
  if (price > 0 && leverage > 0) {
    if (isBuy) {
      liquidationPrice = price * (1 - 1 / leverage + 0.004)
      if (liquidationPrice < 0) liquidationPrice = 0
    } else {
      liquidationPrice = price * (1 + 1 / leverage - 0.004)
    }
  }

  const handleActionClick = async () => {
    if (privateWalletStore.list.length === 0) {
      setShowNoWalletModal(true)
    } else {
      if (!quantity) {
        message.warning(t('common.pleaseInputQuantity') || '请输入数量')
        return
      }

      if (platform === 'hyperliquid') {
        try {
          if (orderType === 'limit' && !limitPx) {
            message.warning(t('common.pleaseInputPrice') || '请输入限价')
            return
          }

          setSubmitting(true)

          // 构建接口参数，对照 API 文档
          const params: any = {
            wallet_id: activeWallet.walletId,  // 本系统钱包ID
            coin: displayCoin,                  // 币种，如 BTC
            order_type: orderType,              // "limit" | "market"
            leverage: leverage,                 // 1~50
            margin_mode: marginMode,            // "cross" | "isolated"
            reduce_only: reduceOnly,            // boolean
          }

          // sz 与 usd_sz 二选一
          // usd_sz：以本位币(USDC)表示的名义金额，后端会自动结合 leverage 和市价换算 sz
          // sz：直接传合约数量（COIN 单位）
          if (quantityUnit === 'USD') {
            params.usd_sz = Number(quantity)   // 直接传 USD 名义金额，不需要除以杠杆
          } else {
            params.sz = Number(quantity)        // COIN 数量
          }

          // 限价单需传入价格
          if (orderType === 'limit') {
            params.limit_px = Number(limitPx)
          }

          // 止盈止损（可选）
          if (tpsl) {
            if (tpPx) params.tp_px = Number(tpPx)
            if (slPx) params.sl_px = Number(slPx)
          }

          if (isBuy) {
            await reqStore.hyperOrderLimitBuy(params)
            message.success(t('common.buySuccess') || '买入订单提交成功')
          } else {
            await reqStore.hyperOrderLimitSell(params)
            message.success(t('common.sellSuccess') || '卖出订单提交成功')
          }
          
          // 刷新持仓和挂单
          tradeStore.refreshTradeData()
          // Refresh wallet balance
          reqStore.userPrivateWallet(accountStore, privateWalletStore)
        } catch (e: any) {
          message.error(e.message || t('common.submitFailed') || '订单提交失败')
        } finally {
          setSubmitting(false)
        }
      } else {
        message.info('Aster 接口尚未适配')
      }
    }
  }

  return (
    <div className="d-flex flex-column w-100 gap-3">
      {/* Tab: Manual / Strategy */}
      <div className="d-flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div
          className="py-2 px-3 cursor-pointer font-size-13 fw-500"
          style={{ color: '#fff', borderBottom: '2px solid #00d1b2' }}
        >
          {t('common.perpetual') || '手动交易'}
        </div>
        <div
          className="py-2 px-3 cursor-pointer font-size-13"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          策略交易 <span className="font-size-11" style={{ color: '#00d1b2' }}>Beta</span>
        </div>
      </div>

      {/* Buy / Sell Buttons */}
      <div className="d-flex w-100" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', overflow: 'hidden' }}>
        <button
          className="flex-grow-1 py-1 fw-600 font-size-14 border-0 cursor-pointer transition-2"
          style={{
            background: isBuy ? 'rgba(22, 199, 132, 0.25)' : 'transparent',
            color: isBuy ? '#16c784' : 'rgba(255,255,255,0.45)',
            borderRight: '1px solid rgba(255,255,255,0.04)'
          }}
          onClick={() => setOrderSide('buy')}
        >
          买入/做多
        </button>
        <button
          className="flex-grow-1 py-1 fw-600 font-size-14 border-0 cursor-pointer transition-2"
          style={{
            background: !isBuy ? 'rgba(234, 57, 67, 0.25)' : 'transparent',
            color: !isBuy ? '#ea3943' : 'rgba(255,255,255,0.45)',
          }}
          onClick={() => setOrderSide('sell')}
        >
          卖出/做空
        </button>
      </div>

      {/* Order Type + Margin Mode + Leverage */}
      <div className="d-flex gap-2 align-items-center">
        <Select
          value={orderType}
          onChange={setOrderType}
          size="middle"
          popupMatchSelectWidth={false}
          className="flex-grow-1"
          style={{ height: '40px' }}
          options={[
            { label: t('common.marketPrice') || '市价', value: 'market' },
            { label: t('common.limitPrice') || '限价', value: 'limit' },
          ]}
        />
        <div
          className="d-flex align-items-center justify-content-center px-3 py-2 cursor-pointer font-size-13 fw-500 gap-2"
          style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '8px',
            color: '#13c2c2',
            height: '40px',
            flexShrink: 0
          }}
          onClick={() => setShowMarginModal(true)}
        >
          {marginMode === 'cross' ? '全仓' : '逐仓'}
          <IOutlineEdit width={14} height={14} />
        </div>
        <div
          className="d-flex align-items-center justify-content-center px-3 py-2 cursor-pointer font-size-13 fw-500 gap-2"
          style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '8px',
            color: '#13c2c2',
            height: '40px',
            flexShrink: 0
          }}
          onClick={() => setShowLeverageModal(true)}
        >
          {leverage}x
          <IOutlineEdit width={14} height={14} />
        </div>
      </div>

      {/* Available + Current Position */}
      <div className="d-flex justify-content-between font-size-12" style={{ color: 'rgba(255,255,255,0.65)' }}>
        <span>可用</span>
        <span className="color-white fw-500">$ {formatNumber(availableBalance.toFixed(2))}</span>
      </div>
      <div className="d-flex justify-content-between font-size-12" style={{ color: 'rgba(255,255,255,0.65)' }}>
        <span>当前持仓</span>
        <span className="color-white fw-500">0 {displayCoin}</span>
      </div>

      {/* Limit Price Input (Only for limit orders) */}
      {orderType === 'limit' && (
        <div className="d-flex align-items-center" style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            height: '40px',
            position: 'relative',
        }}>
          <Input
            value={limitPx}
            onChange={(e) => setLimitPx(e.target.value)}
            placeholder="价格 (USD)"
            variant="borderless"
            style={{ color: '#fff', height: '100%' }}
            className="flex-grow-1 px-3"
          />
          <span className="cursor-pointer pe-3 font-size-12 fw-500" style={{ color: '#00d1b2', whiteSpace: 'nowrap' }}>盘中价</span>
        </div>
      )}

      {/* Quantity Input */}
      <div>
        <div className="d-flex align-items-center" style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            height: '40px',
            position: 'relative',
        }}>
          <Input
            value={quantity}
            onChange={handleQuantityChange}
            placeholder="数量"
            variant="borderless"
            style={{ color: '#fff', height: '100%' }}
            className="flex-grow-1 px-3"
          />
          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }}></div>
          <Select
            value={quantityUnit}
            onChange={handleQuantityUnitChange}
            popupMatchSelectWidth={false}
            style={{ 
              width: '85px', 
              height: '38px',
            }}
            variant="borderless"
            className="unit-select-custom d-flex align-items-center"
            options={[
              { label: 'USD', value: 'USD' },
              { label: displayCoin, value: 'COIN' },
            ]}
          />
        </div>
      </div>

      {/* Percentage Slider */}
      <div className="d-flex align-items-center gap-3">
        <Slider
          min={0}
          max={100}
          value={pctValue}
          onChange={handleSliderChange}
          className="flex-grow-1 m-0"
          tooltip={{ open: false }}
          styles={{
            track: { background: isBuy ? '#16c784' : '#ea3943', height: '3px' },
            handle: { 
              borderColor: isBuy ? '#16c784' : '#ea3943',
              width: '10px',
              height: '10px',
              marginTop: '-3.5px',
              backgroundColor: '#1f2937',
              borderWidth: '2px',
              boxShadow: 'none'
            },
            rail: { background: 'rgba(255,255,255,0.1)', height: '3px' }
          }}
        />
        <div
          className="d-flex align-items-center justify-content-between font-size-12 fw-500"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            padding: '0 8px',
            color: '#fff',
            width: '64px',
            height: '28px',
          }}
        >
          <span>{pctValue}</span>
          <span style={{ color: 'rgba(255,255,255,0.45)' }}>%</span>
        </div>
      </div>

      {/* Reduce Only + TP/SL */}
      <div className="d-flex flex-column gap-2 font-size-13">
        <div className="d-flex align-items-center justify-content-between">
          <Checkbox
            checked={reduceOnly}
            onChange={(e) => {
              const checked = e.target.checked
              setReduceOnly(checked)
              if (checked) setTpsl(false)
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.85)' }}>{t('common.reduceOnly') || '仅减仓'}</span>
          </Checkbox>
          
          {orderType === 'limit' && (
            <div className="d-flex align-items-center gap-2">
              <span className="font-size-12 fw-500" style={{ color: 'rgba(255,255,255,0.45)' }}>TIF</span>
              <Select
                defaultValue="GTC"
                variant="borderless"
                style={{ 
                  background: 'rgba(255,255,255,0.06)', 
                  borderRadius: '6px',
                  width: '74px',
                  height: '26px'
                }}
                className="font-size-12 color-white tif-select d-flex align-items-center custom-select-icon"
                options={[
                  { label: 'GTC', value: 'GTC' },
                  { label: 'IOC', value: 'IOC' },
                  { label: 'ALO', value: 'ALO' },
                ]}
              />
            </div>
          )}
        </div>

        <div className="d-flex flex-column gap-2">
          <Checkbox
            checked={tpsl}
            onChange={(e) => {
              const checked = e.target.checked
              setTpsl(checked)
              if (checked) setReduceOnly(false)
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.85)' }}>{t('common.tpSl') || '止盈/止损'}</span>
          </Checkbox>

          {tpsl && (
            <div className="d-flex flex-column gap-2 mt-1">
              <div className="d-flex align-items-center" style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                height: '36px',
              }}>
                <Input
                  value={tpPx}
                  onChange={(e) => setTpPx(e.target.value)}
                  placeholder={t('common.tpPrice', '止盈价')}
                  variant="borderless"
                  style={{ color: '#fff', height: '100%' }}
                  className="px-3 font-size-12"
                />
              </div>
              <div className="d-flex align-items-center" style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                height: '36px',
              }}>
                <Input
                  value={slPx}
                  onChange={(e) => setSlPx(e.target.value)}
                  placeholder={t('common.slPrice', '止损价')}
                  variant="borderless"
                  style={{ color: '#fff', height: '100%' }}
                  className="px-3 font-size-12"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

      {/* Action Button */}
      {!accountStore.logged ? (
        <button
          className="w-100 py-2 fw-600 font-size-14 cursor-pointer transition-2 d-flex align-items-center justify-content-center gap-2"
          style={{
            background: 'transparent',
            border: '1.5px solid #00d1b2',
            borderRadius: '8px',
            color: '#00d1b2',
            height: '44px',
          }}
          onClick={() => accountStore.openModalLogin = true}
        >
          <span style={{ fontSize: '16px' }}>→</span>
          {t('common.logIn') || '登录'}
        </button>
      ) : (
        <button
          className="w-100 py-2 fw-600 font-size-14 cursor-pointer transition-2 d-flex align-items-center justify-content-center"
          style={{
            background: isBuy ? '#16c784' : '#ea3943',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            height: '44px',
            opacity: submitting ? 0.7 : 1,
            pointerEvents: submitting ? 'none' : 'auto'
          }}
          onClick={handleActionClick}
        >
          {submitting ? (t('common.submitting') || '提交中...') : (isBuy ? '买入/做多' : '卖出/做空')}
        </button>
      )}

      {/* Order Info Table */}
      <div className="d-flex flex-column gap-2 font-size-12">
        {[
          { label: t('common.liquidationPrice') || '清算价', value: (quantityNum > 0 && price > 0) ? formatNumber(liquidationPrice.toFixed(2)) : 'N/A' },
          { label: '订单价值', value: quantityNum > 0 ? `$ ${formatNumber(orderValue.toFixed(2))}` : 'N/A' },
          { label: '所需保证金', value: quantityNum > 0 ? `$ ${formatNumber(requiredMargin.toFixed(2))}` : 'N/A' },
          {
            label: (
              <span className="d-flex align-items-center gap-1">
                滑点 <span style={{ color: 'rgba(255,255,255,0.25)', cursor: 'pointer' }}>ⓘ</span>
              </span>
            ),
            value: '最大值: 8.00 %',
          },
        ].map((row, idx) => (
          <div key={idx} className="d-flex justify-content-between" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <span>{row.label}</span>
            <span className="color-white fw-500">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Wallet Selector Dropdown */}
      {privateWalletStore.list.length > 0 && (
        <div className="mt-2">
          <Dropdown
            menu={{
              items: privateWalletStore.list.map((wallet: any, idx: number) => ({
                key: idx,
                label: (
                  <div className="d-flex align-items-center justify-content-between gap-3 font-size-13">
                    <span className="d-flex align-items-center gap-2 color-white fw-500">
                      <WalletProviderIcon platform={wallet.platform} />
                      {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-6)}
                      <span className="color-unimportant ms-1">{wallet.nickname || 'h'}</span>
                    </span>
                    <span className="color-white fw-bold">$ {formatNumber(wallet.balance) || 0}</span>
                  </div>
                ),
                onClick: () => {
                  privateWalletStore.operaWalletIdx = idx;
                }
              }))
            }}
            trigger={['click']}
            placement="bottom"
          >
            <div
              className="d-flex align-items-center justify-content-between p-2 br-2 cursor-pointer transition-2"
              style={{
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '8px',
              }}
            >
              {(() => {
                const activeWallet = privateWalletStore.list[privateWalletStore.operaWalletIdx === -1 ? 0 : privateWalletStore.operaWalletIdx] || privateWalletStore.list[0];
                return (
                  <>
                    <span className="d-flex align-items-center gap-2 color-white fw-500 font-size-13">
                      <WalletProviderIcon platform={activeWallet?.platform || 'hyperliquid'} />
                      {activeWallet?.address?.slice(0, 6)}...{activeWallet?.address?.slice(-6)}
                      <span className="color-unimportant ms-1">{activeWallet?.nickname || 'h'}</span>
                    </span>
                    <span className="d-flex align-items-center gap-2 color-white fw-bold font-size-13">
                      $ {formatNumber(activeWallet.balance) || 0}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="color-unimportant"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </span>
                  </>
                );
              })()}
            </div>
          </Dropdown>
        </div>
      )}

      <MarginModeModal
        open={showMarginModal}
        onClose={() => setShowMarginModal(false)}
        currentMode={marginMode}
        onConfirm={setMarginMode}
      />

      <LeverageModal
        open={showLeverageModal}
        onClose={() => setShowLeverageModal(false)}
        currentLeverage={leverage}
        maxLeverage={maxLeverage}
        coin={displayCoin}
        onConfirm={setLeverage}
      />

      {/* No Wallet Prompt */}
      <Modal
        open={showNoWalletModal}
        centered
        onCancel={() => setShowNoWalletModal(false)}
        footer={null}
        closable={false}
        width={380}
        styles={{
          mask: { backgroundColor: 'rgba(0, 0, 0, 0.45)' },
          content: {
            backgroundColor: '#1f1f1f',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
          },
          body: {
            padding: 0
          }
        }}
      >
        <div className="d-flex flex-column">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <span className="color-white fw-500 font-size-16">提醒</span>
            <span 
              className="cursor-pointer d-flex align-items-center justify-content-center" 
              style={{ color: 'rgba(255,255,255,0.45)', fontSize: '20px', width: '24px', height: '24px' }}
              onClick={() => setShowNoWalletModal(false)}
            >
              ×
            </span>
          </div>
          <div className="font-size-14 mb-4" style={{ lineHeight: '1.5', color: 'rgba(255,255,255,0.85)' }}>
            请前往"我的钱包"创建交易钱包，才能继续操作
          </div>
          <button
            className="w-100 py-2 fw-600 font-size-14 cursor-pointer text-center d-flex align-items-center justify-content-center gap-1"
            style={{
              background: 'linear-gradient(90deg, #e5f6fd 0%, #f9cce9 45%, #2dc5d6 100%)',
              border: 'none',
              borderRadius: '24px',
              color: '#1a1b20',
              height: '44px',
            }}
            onClick={() => {
              setShowNoWalletModal(false)
              privateWalletStore.openCreatePrivateWallet = true
            }}
          >
            访问我的钱包 <span style={{ fontSize: '12px', marginTop: '2px' }}>&gt;</span>
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default TradeTradingPanel