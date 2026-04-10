import { useEffect } from 'react';
import { Input, Button } from 'antd';
import { useTranslation } from 'react-i18next'

import { useAccountStore, usePrivateWalletStore,  useReqStore } from '@/stores';
import ModalBase from './Base';

const ModalCreatePrivateWallet = () => {
  const privateWalletStore = usePrivateWalletStore();
  const reqStore = useReqStore()
  const accountStore = useAccountStore();
  const { t } = useTranslation()

  const handleClose = () => {
    privateWalletStore.openCreatePrivateWallet = false;
  };

  const handleSubmit = async () => {
    // Note: Since this is turnkey integrated, we no longer send a password or hint
    // We just ensure nickname is sent appropriately.
    const { error } = await reqStore.userCreatePrivateWallet(accountStore, privateWalletStore);

    if (error) return

    handleClose()
    // update
    await reqStore.userPrivateWallet(accountStore, privateWalletStore)
  };

  // init
  useEffect(() => {
    // Reset private wallet states when closing
    return () => {
      privateWalletStore.resetCreate()
    }
  }, [privateWalletStore.openCreatePrivateWallet])

  return (
    <ModalBase
      title={
        <div className="d-flex align-items-center justify-content-between w-100 pe-4 mt-1">
          <span className="fw-bold font-size-18" style={{ color: '#ebebeb' }}>{t('common.createWallet')}</span>
          <span 
            className="font-size-12 color-secondary fw-normal d-flex align-items-center gap-1 cursor-pointer"
            onClick={() => window.open('https://www.turnkey.com/', '_blank')}
            style={{ opacity: 0.8, letterSpacing: '0.2px' }}
          >
            Protected by
            <span className="color-white fw-bold d-flex align-items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a4 4 0 0 0-4 4v2c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V6a4 4 0 0 0-4-4zm-6 9v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-9H6z"/>
              </svg>
              turnkey
            </span>
          </span>
        </div>
      }
      open={privateWalletStore.openCreatePrivateWallet}
      onClose={handleClose}
      width={480}
    >
      <div className="d-flex flex-column pt-2">
        {/* Tabs */}
        <div className="d-flex align-items-center mb-4 font-size-15" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div 
            className={`col text-center pb-3 cursor-pointer transition-2 ${privateWalletStore.createPlatform === 'hyperliquid' ? 'color-white fw-bold' : 'color-secondary'}`}
            style={{ borderBottom: privateWalletStore.createPlatform === 'hyperliquid' ? '2px solid #fff' : '2px solid transparent', marginBottom: '-1px' }}
            onClick={() => privateWalletStore.createPlatform = 'hyperliquid'}
          >
            <div className="d-flex align-items-center justify-content-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.5 15C3.57 15 2 13.43 2 11.5S3.57 8 5.5 8 9 9.57 9 11.5 7.43 15 5.5 15zm13 0c-1.93 0-3.5-1.57-3.5-3.5S16.57 8 18.5 8 22 9.57 22 11.5 20.43 15 18.5 15z" fill="#00e5ff"/>
                <circle cx="12" cy="11.5" r="2.5" fill="#00e5ff" opacity="0.8"/>
              </svg>
              Hyperliquid
            </div>
          </div>
          <div 
            className={`col text-center pb-3 cursor-pointer transition-2 ${privateWalletStore.createPlatform === 'aster' ? 'color-white fw-bold' : 'color-secondary'}`}
            style={{ borderBottom: privateWalletStore.createPlatform === 'aster' ? '2px solid #fff' : '2px solid transparent', marginBottom: '-1px' }}
            onClick={() => privateWalletStore.createPlatform = 'aster'}
          >
            <div className="d-flex align-items-center justify-content-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#f7b500" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Aster
            </div>
          </div>
        </div>

        {/* Input */}
        <div className='d-flex flex-column gap-2 mb-5'>
          <span className='color-secondary font-size-13'>{t('common.addressNote')}</span>
          <Input 
            value={privateWalletStore.createNickname} 
            onChange={(e) => privateWalletStore.createNickname = e.target.value} 
            placeholder="(可选)" 
            className="w-100 fw-500 font-size-15 color-white"
            style={{ 
              background: 'transparent', 
              border: '1px solid rgba(255,255,255,0.12)', 
              borderRadius: '8px',
              padding: '10px 14px',
              boxShadow: 'none'
            }} 
          />
        </div>

        {/* Action Button */}
        <Button 
          loading={reqStore.userCreatePrivateWalletBusy} 
          onClick={handleSubmit} 
          className='w-100 border-0 fw-bold font-size-16'
          style={{ 
            height: '46px',
            borderRadius: '24px', 
            background: 'linear-gradient(90deg, #fce0fc 0%, #c4f1ff 40%, #00e5ff 100%)',
            color: '#1a1d2d'
          }}
        >
          {t('common.create')}
        </Button>
      </div>
    </ModalBase>
  );
};

export default ModalCreatePrivateWallet;