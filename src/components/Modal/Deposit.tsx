import { useEffect, useState } from 'react';
import { message, Input, QRCode, Dropdown } from 'antd';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useTranslation, withTranslation, Trans } from 'react-i18next'

import { formatNumber, inputIsNumber } from '@/utils';
import TokenIcon from '@/components/TokenIcon';
import { IOutlineCopy } from '@/components/icon'
import { useAccountStore, usePrivateWalletStore, useReqStore, useCopyTradingStore } from '@/stores'
import BaseModal from './Base';
import WalletChainIcon from '@/components/Wallet/ChainIcon';


const ModalDeposit = () => {
  const privateWalletStore = usePrivateWalletStore();
  const accountStore = useAccountStore()
  const { t } = useTranslation()
  const [step, setStep] = useState(1);
  const [asterNetwork, setAsterNetwork] = useState('bsc');

  const handleClose = () => {
    privateWalletStore.openDeposit = false;
    setTimeout(() => {
      setStep(1);
      setAsterNetwork('bsc');
    }, 300);
  };

  const handleSubmit = () => {
    handleClose();
    message.info(t('message.waitingSystemConfirmation', '已提交，等待系统确认，预计 1-40 分钟到账'));
  };

  // init
  useEffect(() => {
    if (!privateWalletStore.openDeposit) return

    privateWalletStore.resetDeposit()
  }, [privateWalletStore.openDeposit])

  return (
    <BaseModal
      title={(() => {
        const currentWallet = privateWalletStore.list[privateWalletStore.operaWalletIdx];
        const isAster = currentWallet?.platform === 'aster';
        return (
          <div className="d-flex align-items-center gap-2">
            {`${isAster ? 'Aster' : 'Hyperliquid'} ${t('common.deposit') || '存款'}`}
            {step === 2 && (
              <>
                <span className="color-unimportant mx-1">-</span>
                <TokenIcon id={isAster ? 'usdt' : 'usdc'} size='smd' />
                <span style={{ color: isAster ? '#26A17B' : '#ffb700' }}>{isAster ? 'USDT' : 'USDC'}</span>
              </>
            )}
          </div>
        )
      })()}
      open={privateWalletStore.openDeposit}
      onClose={handleClose}
    >
      {step === 1 && (
        <div className='d-flex flex-column'>
          <div className='d-flex flex-column gap-2'>
            <span className='color-unimportant'>1. {t('common.depositNetwork', '存款网络')}</span>
            {privateWalletStore.list[privateWalletStore.operaWalletIdx]?.platform === 'aster' ? (
              <Dropdown
                menu={{ 
                  items: [
                    { key: 'bsc', label: <div className="d-flex align-items-center gap-2"><TokenIcon size='sml' id='bsc' />BNB Chain</div> },
                    { key: 'arbitrum', label: <div className="d-flex align-items-center gap-2"><WalletChainIcon size='sml' id={42_161} />Arbitrum</div> },
                  ],
                  onClick: (e) => setAsterNetwork(e.key)
                }} 
                trigger={['click']} 
                placement="bottom"
              >
                <div className='d-flex align-items-center justify-content-between p-3 br-2 cursor-pointer hover-primary transition-2' style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <span className='d-flex align-items-center gap-2 h6 fw-bold mb-0'>
                    {asterNetwork === 'bsc' ? <><TokenIcon size='sml' id='bsc' />BNB Chain</> : <><WalletChainIcon size='sml' id={42_161} />Arbitrum</>}
                  </span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.9201 8.94995L13.4001 15.47C12.6301 16.24 11.3701 16.24 10.6001 15.47L4.08008 8.94995" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </Dropdown>
            ) : (
              <div className='d-flex align-items-center justify-content-between p-3 br-2' style={{ background: 'rgba(255,255,255,0.04)' }}>
                <span className='d-flex align-items-center gap-2 h6 fw-bold mb-0'>
                  <WalletChainIcon size='sml' id={42_161} />Arbitrum
                </span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.3 }}>
                  <path d="M19.9201 8.94995L13.4001 15.47C12.6301 16.24 11.3701 16.24 10.6001 15.47L4.08008 8.94995" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
          <div className='d-flex flex-column gap-2 mt-4'>
            <span className='color-unimportant'>2. {t('common.depositCoin', '存款币种')}</span>
            <div className='d-flex align-items-center justify-content-between p-3 br-2' style={{ background: 'rgba(255,255,255,0.04)' }}>
              <span className='d-flex align-items-center gap-2 h6 fw-bold mb-0'>
                {privateWalletStore.list[privateWalletStore.operaWalletIdx]?.platform === 'aster' ? (
                  <><TokenIcon id='usdt' size='sm' />USDT</>
                ) : (
                  <><TokenIcon id='usdc' size='sm' />USDC</>
                )}
              </span>
              <span className='color-unimportant'>{t('common.onlySupport', '仅支持')}</span>
            </div>
          </div>
          
          <div className='d-flex justify-content-center pt-4 mt-2'>
            <div 
              className='d-flex align-items-center justify-content-center fw-bold w-100 rounded-pill cursor-pointer'
              style={{
                background: 'linear-gradient(90deg, #ffffff 0%, #f7abff 25%, #5cbbfd 75%, #03d7db 100%)',
                color: '#1a1a1a',
                height: '48px',
                fontSize: '16px'
              }}
              onClick={() => setStep(2)}
            >
              {t('common.nextStep', '下一步')}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (() => {
        const currentWallet = privateWalletStore.list[privateWalletStore.operaWalletIdx];
        const isAster = currentWallet?.platform === 'aster';
        const walletAddress = currentWallet?.address ?? '-';
        return (
          <div className='d-flex flex-column'>
            <div className='color-unimportant mb-4'>3. {t('common.depositAddress', '存款地址')}</div>

            <div className='d-flex justify-content-center mb-4' style={{ width: 'fit-content', margin: '0 auto' }}>
              <div className='bg-white p-3 br-2 d-flex align-items-center justify-content-center'>
                <QRCode value={walletAddress} color="#000000" bgColor="#ffffff" bordered={false} size={220} />
              </div>
            </div>

            <div className='d-flex align-items-center justify-content-center gap-2 mb-4'>
              <span className='h5 fw-bold mb-0 text-white'>{walletAddress.length > 20 ? `${walletAddress.slice(0, 12)}...${walletAddress.slice(-10)}` : walletAddress}</span>
              <CopyToClipboard text={walletAddress} onCopy={() => message.success(t('message.addressCopied', '地址已复制'))}>
                <IOutlineCopy className='color-white cursor-pointer zoom-120 hover-primary' />
              </CopyToClipboard>
            </div>

            <div className='p-3 br-2 mb-3 d-flex flex-column gap-2' style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className='color-white font-size-13'>- 首次存款时，将自动转换 1 {isAster ? 'USDT' : 'USDC'} 用于支付 Gas 费。</div>
              <div className='color-white font-size-13'>- 预计到账时间： 1-40 分钟。</div>
            </div>

            <div className='p-3 br-2 mb-4 text-center' style={{ background: 'rgba(255,165,0,0.08)', border: '1px solid rgba(255,165,0,0.3)', color: '#ffb700', fontSize: '13px' }}>
              该地址仅接收{isAster ? `USDT (${asterNetwork === 'bsc' ? 'BNB Chain' : 'Arbitrum链'})` : 'USDC (Arbitrum链)'} 充值，20 {isAster ? 'USDT' : 'USDC'}起充，否则资金将会永久丢失。
            </div>

            <div className='d-flex gap-3 justify-content-between mt-2'>
              <div 
                className='d-flex align-items-center justify-content-center fw-bold rounded-pill cursor-pointer transition-2'
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#00e5ff',
                  height: '48px',
                  width: '120px',
                  fontSize: '15px'
                }}
                onClick={() => setStep(1)}
              >
                 &lt; 返回
              </div>
              
              <div 
                className='col d-flex align-items-center justify-content-center fw-bold rounded-pill cursor-pointer transition-2'
                style={{
                  background: 'linear-gradient(90deg, #fce0fc 0%, #c4f1ff 40%, #00e5ff 100%)',
                  color: '#1a1d2d',
                  height: '48px',
                  fontSize: '15px'
                }}
                onClick={handleSubmit}
              >
                确认
              </div>
            </div>
          </div>
        );
      })()}
    </BaseModal>
  );
};

export default ModalDeposit;