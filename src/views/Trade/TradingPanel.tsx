import { useState } from 'react'
import { Input, Slider, Checkbox, Select, Modal } from 'antd'
import { useTranslation } from 'react-i18next'
import { useTradeStore, useAccountStore, usePrivateWalletStore } from '@/stores'
import { IOutlineEdit } from '@/components/icon'
import MarginModeModal from '@/components/Modal/Trade/MarginMode'
import LeverageModal from '@/components/Modal/Trade/Leverage'

const TradeTradingPanel = () => {
  const tradeStore = useTradeStore()
  const accountStore = useAccountStore()
  const privateWalletStore = usePrivateWalletStore()
  const { t } = useTranslation()

  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy')
  const [orderType, setOrderType] = useState('market')
  const [marginMode, setMarginMode] = useState('cross')
  const [leverage, setLeverage] = useState(40)
  const [quantity, setQuantity] = useState('')
  const [quantityUnit, setQuantityUnit] = useState('USD')
  const [pctValue, setPctValue] = useState(0)
  const [reduceOnly, setReduceOnly] = useState(false)
  const [tpsl, setTpsl] = useState(false)
  const [showMarginModal, setShowMarginModal] = useState(false)
  const [showLeverageModal, setShowLeverageModal] = useState(false)
  const [showNoWalletModal, setShowNoWalletModal] = useState(false)

  const isBuy = orderSide === 'buy'

  const handleActionClick = () => {
    if (privateWalletStore.list.length === 0) {
      setShowNoWalletModal(true)
    } else {
      // Execute trade logic here
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
      <div className="d-flex justify-content-between font-size-12" style={{ color: 'rgba(255,255,255,0.45)' }}>
        <span>可用</span>
        <span className="color-white">N/A</span>
      </div>
      <div className="d-flex justify-content-between font-size-12" style={{ color: 'rgba(255,255,255,0.45)' }}>
        <span>当前持仓</span>
        <span className="color-white">N/A</span>
      </div>

      {/* Quantity Input */}
      <div>
        <div className="font-size-12 mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
          数量
        </div>
        <div className="d-flex gap-2 align-items-center">
          <Input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            className="flex-grow-1"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              height: '40px',
            }}
          />
          <Select
            value={quantityUnit}
            onChange={setQuantityUnit}
            size="middle"
            popupMatchSelectWidth={false}
            style={{ 
              width: '85px', 
              height: '40px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '8px',
              padding: '0 4px'
            }}
            variant="borderless"
            className="unit-select-custom"
            options={[
              { label: 'USD', value: 'USD' },
              { label: tradeStore.coin || 'BTC', value: 'COIN' },
            ]}
          />
        </div>
      </div>

      {/* Percentage Slider */}
      <div className="d-flex align-items-center gap-2">
        <Slider
          min={0}
          max={100}
          value={pctValue}
          onChange={setPctValue}
          className="flex-grow-1"
          tooltip={{ open: false }}
          styles={{
            track: { background: isBuy ? '#16c784' : '#ea3943' },
            handle: { borderColor: isBuy ? '#16c784' : '#ea3943' },
          }}
        />
        <div
          className="d-flex align-items-center font-size-12"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '4px',
            padding: '4px 8px',
            color: '#fff',
            minWidth: '52px',
            justifyContent: 'center',
          }}
        >
          {pctValue} <span className="ms-1" style={{ color: 'rgba(255,255,255,0.35)' }}>%</span>
        </div>
      </div>

      {/* Reduce Only + TP/SL */}
      <div className="d-flex gap-4 font-size-12">
        <Checkbox
          checked={reduceOnly}
          onChange={(e) => setReduceOnly(e.target.checked)}
        >
          <span style={{ color: 'rgba(255,255,255,0.65)' }}>{t('common.reduceOnly') || '仅减仓'}</span>
        </Checkbox>
        <Checkbox
          checked={tpsl}
          onChange={(e) => setTpsl(e.target.checked)}
        >
          <span style={{ color: 'rgba(255,255,255,0.65)' }}>{t('common.tpSl') || '止盈/止损'}</span>
        </Checkbox>
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
          }}
          onClick={handleActionClick}
        >
          {isBuy ? '买入/做多' : '卖出/做空'}
        </button>
      )}

      {/* Order Info Table */}
      <div className="d-flex flex-column gap-2 font-size-12">
        {[
          { label: t('common.liquidationPrice') || '清算价', value: 'N/A' },
          { label: '订单价值', value: 'N/A' },
          { label: '所需保证金', value: 'N/A' },
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
        coin={tradeStore.coin || 'BTC'}
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