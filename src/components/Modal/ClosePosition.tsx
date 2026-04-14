import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next'
import { Input, message } from 'antd';

import BaseModal from './Base';
import { useTraderDetailsPositionsStore, useHyperStore, usePrivateWalletStore, useReqStore, useTradeStore, useAccountStore } from '@/stores'
import PositionItemSide from '@/components/PositionItem/Side'

const ModalClosePosition = () => {
  const traderDetailsPositionsStore = useTraderDetailsPositionsStore();
  const hyperStore = useHyperStore();
  const privateWalletStore = usePrivateWalletStore();
  const reqStore = useReqStore();
  const tradeStore = useTradeStore();
  const accountStore = useAccountStore();
  const { t } = useTranslation()

  const [quantity, setQuantity] = useState('');
  const [closePrice, setClosePrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    traderDetailsPositionsStore.openClosePositionModal = false;
    setTimeout(() => {
      setQuantity('');
      setClosePrice('');
    }, 300);
  };

  const item = traderDetailsPositionsStore.currentClosePositionItem;
  const isMarket = traderDetailsPositionsStore.closePositionType === 'market';
  const liveMarkPrice = item ? (hyperStore.perpMarket[item.coin]?.markPrice || item.markPrice) : null;

  useEffect(() => {
    if (traderDetailsPositionsStore.openClosePositionModal && item?.size) {
      if (isMarket) {
        setQuantity(item.size.toString());
      } else {
        setQuantity('');
      }
    }
  }, [item, traderDetailsPositionsStore.openClosePositionModal, isMarket])

  const handleSubmit = async () => {
    if (!item) return;
    if (!quantity || Number(quantity) <= 0) {
      message.warning(t('common.pleaseInputQuantity') || '请输入数量');
      return;
    }
    if (!isMarket && (!closePrice || Number(closePrice) <= 0)) {
      message.warning(t('common.pleaseInputPrice') || '请输入价格');
      return;
    }

    const activeWallet = privateWalletStore.list[privateWalletStore.operaWalletIdx === -1 ? 0 : privateWalletStore.operaWalletIdx] || privateWalletStore.list[0];
    if (!activeWallet) {
      message.warning(t('common.noWallet') || '请先创建交易钱包');
      return;
    }

    try {
      setSubmitting(true);

      const params: any = {
        wallet_id: activeWallet.walletId,
        coin: item.coin,
        sz: Number(quantity),
        order_type: isMarket ? 'market' : 'limit',
        leverage: Number(item.leverage),
        margin_mode: item.type || 'cross',
        reduce_only: true,
      };

      if (!isMarket) {
        params.limit_px = Number(closePrice);
      }

      // Long position → close by selling; Short position → close by buying
      if (item.direction === 'long') {
        await reqStore.hyperOrderLimitSell(params);
      } else {
        await reqStore.hyperOrderLimitBuy(params);
      }

      message.success(t('common.closePositionSuccess') || '平仓订单提交成功');
      
      // Refresh positions and orders
      tradeStore.refreshTradeData()
      // Refresh wallet balance
      reqStore.userPrivateWallet(accountStore, privateWalletStore)
      
      handleClose();
    } catch (e: any) {
      message.error(e.message || t('common.closePositionFailed') || '平仓订单提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const isLong = useMemo(() => {
    if (!item) return true;
    const side = item.side || item.direction;
    if (side) {
        return ['buy', 'long'].includes(side.toLowerCase());
    }
    return parseFloat(item.szi || item.position?.szi || '0') > 0;
  }, [item]);

  const entryPrice = item ? parseFloat(item.openPrice) : 0;

  const expectedProfit = useMemo(() => {
    const qty = parseFloat(quantity);
    if (!qty || isNaN(qty)) return null;
    
    let price;
    if (isMarket) {
      if (!liveMarkPrice) return null;
      const strPrice = liveMarkPrice.toString().replace(/,/g, '');
      price = parseFloat(strPrice);
    } else {
      if (!closePrice || isNaN(parseFloat(closePrice))) return null;
      price = parseFloat(closePrice);
    }
    if (!price || isNaN(price)) return null;

    return isLong ? (price - entryPrice) * qty : (entryPrice - price) * qty;
  }, [quantity, closePrice, isMarket, liveMarkPrice, entryPrice, isLong]);

  const directionText = item?.direction === 'long' ? t('common.long', '多') : t('common.short', '空');
  const isDisabled = submitting || (!isMarket && !closePrice);

  return (
    <BaseModal
      title={item ? (
        <div className="d-flex align-items-center gap-2">
          <span className="fw-bold">{item.coin}</span> 
          <PositionItemSide item={item} /> 
          <span className="fw-bold">{item.leverage}x</span>
        </div>
      ) : ''}
      open={traderDetailsPositionsStore.openClosePositionModal}
      onClose={handleClose}
      width={480}
    >
      {item && (
        <div className='d-flex flex-column gap-3'>
          <div className="d-flex justify-content-between mb-2">
             <div className="d-flex flex-column gap-1">
               <span className="color-unimportant font-size-12">{t('common.openingPrice', '开盘价')}</span>
               <span className="fw-bold color-white font-size-14">$ {item.openPrice}</span>
             </div>
             <div className="d-flex flex-column gap-1 text-end">
               <span className="color-unimportant font-size-12">{t('common.markPrice', '标记价')}</span>
               <span className="fw-bold color-white font-size-14">$ {liveMarkPrice || '---'}</span>
             </div>
          </div>

          <div className="d-flex flex-column gap-1">
             <div className="d-flex align-items-center br-2 px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {isMarket ? (
                  <span className="color-unimportant text-nowrap py-1">{t('common.marketPrice', '市价')}</span>
                ) : (
                   <>
                     <span className="color-unimportant text-nowrap" style={{ width: '60px' }}>{t('common.price', '价格')}</span>
                     <Input className="col bg-transparent border-0 text-white shadow-none px-2" style={{ boxShadow: 'none' }} value={closePrice} onChange={e => setClosePrice(e.target.value)} />
                     <div className="d-flex align-items-center gap-1 cursor-pointer" onClick={() => setClosePrice(liveMarkPrice || '')}>
                        <span className="color-unimportant font-size-12">{t('common.price', '价格')}</span>
                        <span className="font-size-12 fw-500" style={{ color: '#00d1b2' }}>{t('common.midPrice', '盘中价')}</span>
                     </div>
                   </>
                )}
             </div>
          </div>

          <div className="d-flex flex-column gap-1">
             <div className="d-flex align-items-center br-2 px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="color-unimportant text-nowrap" style={{ width: '60px' }}>{t('common.quantity', '数量')}</span>
                <Input className="col bg-transparent border-0 text-white shadow-none px-2 font-size-14" style={{ boxShadow: 'none' }} value={quantity} onChange={e => setQuantity(e.target.value)} />
                <div className="cursor-pointer" onClick={() => setQuantity(item.size)}>
                  <span className="fw-bold color-white font-size-12" style={{ opacity: 0.85 }}>{item.size} {item.coin}</span>
                </div>
             </div>
          </div>

          <span className="color-unimportant font-size-12 mt-1">
            {t('common.closeAtPrice', '以')} <span className="color-white fw-bold">$ {isMarket ? (liveMarkPrice || '---') : (closePrice || '0')}</span> {t('common.priceToClose', '价格进行平仓')}
            {t('common.comma', '，')}
            {t('common.expectedProfitIs', '预期利润为')} <span className="fw-bold" style={{ color: expectedProfit === null ? 'white' : (expectedProfit >= 0 ? '#00d1b2' : '#ff4d4f') }}>
              $ {expectedProfit === null ? '-' : expectedProfit.toFixed(2)}
            </span>
          </span>

          <div 
             className={`w-100 d-flex align-items-center justify-content-center fw-bold rounded-pill cursor-pointer transition-2 mt-3 ${isDisabled ? 'disabled' : ''}`}
             style={{
                background: isDisabled ? 'rgba(255,255,255,0.08)' : 'linear-gradient(90deg, #fce0fc 0%, #c4f1ff 40%, #00e5ff 100%)',
                color: isDisabled ? 'rgba(255,255,255,0.4)' : '#1a1d2d',
                height: '48px',
                fontSize: '16px',
                pointerEvents: isDisabled ? 'none' : 'auto',
                opacity: submitting ? 0.7 : 1
             }}
             onClick={handleSubmit}
          >
             {submitting ? (t('common.submitting') || '提交中...') : `${t('common.close', '平')}${directionText}`}
          </div>
        </div>
      )}
    </BaseModal>
  );
};

export default ModalClosePosition;