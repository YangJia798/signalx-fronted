import { useEffect, useState } from 'react';
import { message, Input, Button } from 'antd';
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
  const reqStore = useReqStore()
  const { t, i18n } = useTranslation()
  const [step, setStep] = useState(1);

  const handleClose = () => {
    privateWalletStore.openDeposit = false;
    setTimeout(() => setStep(1), 300);
  };

  const handleSubmit = async () => {
    const { error } = await reqStore.userWalletDeposit(accountStore, privateWalletStore)

    if (error) return

    handleClose()
  };

  // init
  useEffect(() => {
    if (!privateWalletStore.openDeposit) return

    privateWalletStore.resetDeposit()
  }, [privateWalletStore.openDeposit])

  return (
    <BaseModal
      title={`HyperLiquid ${t('common.deposit')}`}
      open={privateWalletStore.openDeposit}
      onClose={handleClose}
      onSubmit={step === 2 ? handleSubmit : undefined}
      submitDisabled={privateWalletStore.MIN_DEPOSIT_USDC_AMOUNT !> +privateWalletStore.depositNumber}
      submitLoading={reqStore.userWalletDepositBusy}
      submitText={t('common.submit')}
    >
      {step === 1 && (
        <div className='d-flex flex-column'>
          <div className='d-flex flex-column gap-2'>
            <span className='color-unimportant'>1. {t('common.depositNetwork', '存款网络')}</span>
            <div className='d-flex align-items-center justify-content-between p-3 br-2' style={{ background: 'rgba(255,255,255,0.04)' }}>
              <span className='d-flex align-items-center gap-2 h6 fw-bold mb-0'><WalletChainIcon size='sml' id={42_161} />Arbitrum</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.9201 8.94995L13.4001 15.47C12.6301 16.24 11.3701 16.24 10.6001 15.47L4.08008 8.94995" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <div className='d-flex flex-column gap-2 mt-4'>
            <span className='color-unimportant'>2. {t('common.depositCoin', '存款币种')}</span>
            <div className='d-flex align-items-center justify-content-between p-3 br-2' style={{ background: 'rgba(255,255,255,0.04)' }}>
              <span className='d-flex align-items-center gap-2 h6 fw-bold mb-0'><TokenIcon id='usdc' size='sm' />USDC</span>
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

      {step === 2 && (
        <>
          {
            [
              { label: `1. ${t('copyTrading.confirmAsNetwork')}`, content: <><WalletChainIcon size='smd' id={42_161} />Arbitrum</> },
              { label: `2. ${t('copyTrading.copyWalletAddress')}`, content:
                <>
                  <div className='d-flex align-items-center gap-2 color-white'>
                    { privateWalletStore.list[privateWalletStore.operaWalletIdx]?.address ?? '-'}
                    <CopyToClipboard text={ privateWalletStore.list[privateWalletStore.operaWalletIdx]?.address ?? '-'} onCopy={() => message.success(t('message.addressCopied'))}>
                      <IOutlineCopy className='w-16 color-secondary linker' />
                    </CopyToClipboard>
                  </div>
                </> },
              { label: <>3. {t('copyTrading.depositing')}<TokenIcon id={'eth'} size='sm' />ETH</>, content: t('copyTrading.ethGasWarning') },
              { label: <>4. {t('copyTrading.depositing')}<TokenIcon id='usdc' size='sm' />USDC</>, content: <Input value={privateWalletStore.depositNumber} className='br-2' placeholder={t('copyTrading.minimumDeposit', { amount: privateWalletStore.MIN_DEPOSIT_USDC_AMOUNT })} onChange={(e) => {
                  const value = e.target.value
                  if (!inputIsNumber(value)) return
                  privateWalletStore.depositNumber = value
                }} />
              },
            ].map((item, idx) =>
            <div key={idx} className='d-flex flex-column gap-2 justify-content-between bg-gray-alpha-4 p-3 br-1' style={{ marginTop: '-2px' }}>
              <span className='d-flex gap-2 color-secondary'>{ item.label }</span>
              <span className='d-flex align-items-center gap-2 h6 fw-500'>{ item.content }</span>
            </div>)
          }
          <span className='d-flex flex-column gap-1 small color-secondary ps-2 pt-2'>
            <span>- {t('copyTrading.depositWarning')}</span>
            <span>- {t('copyTrading.copyTradingStart')}</span>
          </span>
        </>
      )}
    </BaseModal>
  );
};

export default ModalDeposit;