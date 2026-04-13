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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 8A4 4 0 0 0 4 16C7.5 16 9.5 13.5 12 13.5C14.5 13.5 16.5 16 20 16A4 4 0 0 0 20 8C16.5 8 14.5 10.5 12 10.5C9.5 10.5 7.5 8 4 8Z" fill="#38d1b3"/>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0ZM12 3C12 7.97 16.03 12 21 12C16.03 12 12 16.03 12 21C12 16.03 7.97 12 3 12C7.97 12 12 7.97 12 3Z" fill="#ffc89a"/>
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