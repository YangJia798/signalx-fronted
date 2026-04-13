import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next'
import { Input, Button } from 'antd';

import BaseModal from './Base';
import { useTraderDetailsPositionsStore, useHyperStore } from '@/stores'
import PositionItemSide from '@/components/PositionItem/Side'

const ModalTPSL = () => {
  const traderDetailsPositionsStore = useTraderDetailsPositionsStore();
  const hyperStore = useHyperStore();
  const { t } = useTranslation()

  const [tpPrice, setTpPrice] = useState('');
  const [tpPercentage, setTpPercentage] = useState('');
  const [slPrice, setSlPrice] = useState('');
  const [slPercentage, setSlPercentage] = useState('');

  const handleClose = () => {
    traderDetailsPositionsStore.openTPSLModal = false;
    setTimeout(() => {
      setTpPrice('');
      setTpPercentage('');
      setSlPrice('');
      setSlPercentage('');
    }, 300);
  };

  const item = traderDetailsPositionsStore.currentTPSLItem;
  const liveMarkPrice = item ? (hyperStore.perpMarket[item.coin]?.markPrice || item.markPrice) : null;

  const handleSubmit = async () => {
    // API logic to be done later.
    handleClose();
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
  const size = item ? parseFloat(item.size || Math.abs(item.szi) || (item.position && Math.abs(item.position.szi)) || 0) : 0;
  const leverage = item ? parseFloat(item.leverage) : 1;
  const margin = leverage > 0 ? (entryPrice * size) / leverage : 0;

  const handleTpPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTpPrice(val);
    if (!val || isNaN(Number(val))) {
      setTpPercentage('');
      return;
    }
    const price = parseFloat(val);
    const profit = isLong ? (price - entryPrice) * size : (entryPrice - price) * size;
    const percentage = margin > 0 ? (profit / margin) * 100 : 0;
    setTpPercentage(percentage.toFixed(2));
  };

  const handleTpPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTpPercentage(val);
    if (!val || isNaN(Number(val))) {
      setTpPrice('');
      return;
    }
    const percentage = parseFloat(val);
    const profit = (percentage / 100) * margin;
    const price = isLong ? (profit / size) + entryPrice : entryPrice - (profit / size);
    setTpPrice(price > 0 ? Number(price.toFixed(4)).toString() : '0'); 
  };

  const handleSlPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSlPrice(val);
    if (!val || isNaN(Number(val))) {
      setSlPercentage('');
      return;
    }
    const price = parseFloat(val);
    const profit = isLong ? (price - entryPrice) * size : (entryPrice - price) * size;
    const percentage = margin > 0 ? (profit / margin) * 100 : 0;
    setSlPercentage(percentage.toFixed(2));
  };

  const handleSlPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSlPercentage(val);
    if (!val || isNaN(Number(val))) {
      setSlPrice('');
      return;
    }
    const percentage = parseFloat(val);
    const profit = (percentage / 100) * margin;
    const price = isLong ? (profit / size) + entryPrice : entryPrice - (profit / size);
    setSlPrice(price > 0 ? Number(price.toFixed(4)).toString() : '0'); 
  };

  const tpProfit = useMemo(() => {
    if (!tpPrice || isNaN(parseFloat(tpPrice))) return null;
    const price = parseFloat(tpPrice);
    return isLong ? (price - entryPrice) * size : (entryPrice - price) * size;
  }, [tpPrice, isLong, entryPrice, size]);

  const slProfit = useMemo(() => {
    if (!slPrice || isNaN(parseFloat(slPrice))) return null;
    const price = parseFloat(slPrice);
    return isLong ? (price - entryPrice) * size : (entryPrice - price) * size;
  }, [slPrice, isLong, entryPrice, size]);

  const hasInput = !!tpPrice || !!slPrice;

  return (
    <BaseModal
      title={item ? (
        <div className="d-flex align-items-center gap-2">
          <span className="fw-bold">{item.coin}</span> 
          <PositionItemSide item={item} /> 
          <span className="fw-bold">{item.leverage}x</span>的 TP/SL
        </div>
      ) : ''}
      open={traderDetailsPositionsStore.openTPSLModal}
      onClose={handleClose}
      width={480}
    >
      {item && (
        <div className='d-flex flex-column gap-3'>
          <div className="d-flex justify-content-between mb-2">
             <div className="d-flex flex-column gap-1">
               <span className="color-unimportant font-size-12">{t('common.positionValue', '持仓价值')}</span>
               <div className="d-flex flex-column">
                  <span className="fw-bold color-white font-size-14">{item.size} {item.coin}</span>
               </div>
             </div>
             <div className="d-flex flex-column gap-1 text-center">
               <span className="color-unimportant font-size-12">{t('common.openingPrice', '开盘价')}</span>
               <span className="fw-bold color-white font-size-14">$ {item.openPrice}</span>
             </div>
             <div className="d-flex flex-column gap-1 text-end">
               <span className="color-unimportant font-size-12">{t('common.markPrice', '标记价')}</span>
               <span className="fw-bold color-white font-size-14">$ {liveMarkPrice || '---'}</span>
             </div>
          </div>

          <div className="d-flex flex-column gap-1">
             <div className="d-flex gap-2">
               <div className="col d-flex align-items-center br-2 px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                 <span className="color-unimportant text-nowrap" style={{ width: '60px' }}>{t('common.tpPrice', '止盈价')}</span>
                 <Input className="col bg-transparent border-0 text-white shadow-none px-2" style={{ boxShadow: 'none' }} value={tpPrice} onChange={handleTpPriceChange} />
               </div>
               <div className="d-flex align-items-center br-2 px-3 py-2" style={{ width: '130px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                 <Input className="col bg-transparent border-0 text-white shadow-none px-0 text-end" style={{ boxShadow: 'none' }} value={tpPercentage} onChange={handleTpPercentageChange} />
                 <span className="color-unimportant ml-1">%</span>
               </div>
             </div>
             <span className="color-unimportant font-size-12 mt-1">
               当价格达到 <span className="color-white fw-bold">$ {tpPrice || '0'}</span> 时，市价单将被触发。预期利润为{' '}
               <span className="fw-bold" style={{ color: tpProfit === null ? 'white' : (tpProfit >= 0 ? '#00d1b2' : '#ff4d4f') }}>
                 $ {tpProfit === null ? '-' : tpProfit.toFixed(2)}
               </span>
             </span>
          </div>

          <div className="d-flex flex-column gap-1">
             <div className="d-flex gap-2">
               <div className="col d-flex align-items-center br-2 px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                 <span className="color-unimportant text-nowrap" style={{ width: '60px' }}>{t('common.slPrice', '止损价')}</span>
                 <Input className="col bg-transparent border-0 text-white shadow-none px-2" style={{ boxShadow: 'none' }} value={slPrice} onChange={handleSlPriceChange} />
               </div>
               <div className="d-flex align-items-center br-2 px-3 py-2" style={{ width: '130px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                 <Input className="col bg-transparent border-0 text-white shadow-none px-0 text-end" style={{ boxShadow: 'none' }} value={slPercentage} onChange={handleSlPercentageChange} />
                 <span className="color-unimportant ml-1">%</span>
               </div>
             </div>
             <span className="color-unimportant font-size-12 mt-1">
               当价格达到 <span className="color-white fw-bold">$ {slPrice || '0'}</span> 时，市价单将被触发。预期利润为{' '}
               <span className="fw-bold" style={{ color: slProfit === null ? 'white' : (slProfit >= 0 ? '#00d1b2' : '#ff4d4f') }}>
                 $ {slProfit === null ? '-' : slProfit.toFixed(2)}
               </span>
             </span>
          </div>

          <div 
             className='w-100 d-flex align-items-center justify-content-center fw-bold rounded-pill cursor-pointer transition-2 mt-3'
             style={{
                background: hasInput ? 'linear-gradient(90deg, #eecbf9, #0dcbe6)' : 'rgba(255,255,255,0.08)',
                color: hasInput ? '#000' : 'rgba(255,255,255,0.4)',
                height: '48px',
                fontSize: '15px'
             }}
             onClick={handleSubmit}
          >
             {t('common.confirm', '确认')}
          </div>
        </div>
      )}
    </BaseModal>
  );
};

export default ModalTPSL;

