import { useEffect } from 'react';
import { Input, Button } from 'antd';
import { useTranslation } from 'react-i18next'

import { useAccountStore, usePrivateWalletStore,  useReqStore } from '@/stores';
import ModalBase from './Base';
import WalletProviderIcon from '../Wallet/ProviderIcon';

const ModalImportPrivateWallet = () => {
  const privateWalletStore = usePrivateWalletStore();
  const reqStore = useReqStore()
  const accountStore = useAccountStore();
  const { t } = useTranslation()

  const handleClose = () => {
    privateWalletStore.openImportPrivateWallet = false;
  };

  const handleSubmit = async () => {
    const { error } = await reqStore.userImportPrivateWallet(accountStore, privateWalletStore);

    if (error) return

    handleClose()
    // update
    await reqStore.userPrivateWallet(accountStore, privateWalletStore)
  };

  // init
  useEffect(() => {
    // Reset private wallet states when closing
    return () => {
      privateWalletStore.resetImport()
    }
  }, [privateWalletStore.openImportPrivateWallet])

  return (
    <ModalBase
      title={
        <div className="d-flex align-items-center justify-content-between w-100 pe-4 mt-1">
          <span className="fw-bold font-size-18" style={{ color: '#ebebeb' }}>{t('common.importWallet', '导入钱包')}</span>
        </div>
      }
      open={privateWalletStore.openImportPrivateWallet}
      onClose={handleClose}
      width={480}
    >
      <div className="d-flex flex-column pt-2">
        {/* Tabs */}
        <div className="d-flex align-items-center mb-4 font-size-15" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div 
            className={`col text-center pb-3 cursor-pointer transition-2 ${privateWalletStore.importWalletProvider === 'hyperliquid' ? 'color-white fw-bold' : 'color-secondary'}`}
            style={{ borderBottom: privateWalletStore.importWalletProvider === 'hyperliquid' ? '2px solid #fff' : '2px solid transparent', marginBottom: '-1px' }}
            onClick={() => privateWalletStore.importWalletProvider = 'hyperliquid'}
          >
            <div className="d-flex align-items-center justify-content-center gap-2">
              <WalletProviderIcon platform="hyperliquid" width="18" height="18" />
              Hyperliquid
            </div>
          </div>
          <div 
            className={`col text-center pb-3 cursor-pointer transition-2 ${privateWalletStore.importWalletProvider === 'aster' ? 'color-white fw-bold' : 'color-secondary'}`}
            style={{ borderBottom: privateWalletStore.importWalletProvider === 'aster' ? '2px solid #fff' : '2px solid transparent', marginBottom: '-1px' }}
            onClick={() => privateWalletStore.importWalletProvider = 'aster'}
          >
            <div className="d-flex align-items-center justify-content-center gap-2">
              <WalletProviderIcon platform="aster" width="18" height="18" />
              Aster
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className='d-flex flex-column gap-4 mb-4'>
          <div className='d-flex flex-column gap-2'>
            <span className='color-secondary font-size-13'>{t('common.address', '地址')}</span>
            <Input 
              value={privateWalletStore.importAddress} 
              onChange={(e) => privateWalletStore.importAddress = e.target.value.trim()} 
              placeholder={t('common.address', '地址')} 
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

          <div className='d-flex flex-column gap-2'>
            <span className='color-secondary font-size-13'>API 钱包地址</span>
            <Input 
              value={privateWalletStore.importApiWalletAddress} 
              onChange={(e) => privateWalletStore.importApiWalletAddress = e.target.value.trim()} 
              placeholder="API 钱包地址" 
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

          <div className='d-flex flex-column gap-2'>
            <span className='color-secondary font-size-13'>API 秘密密钥</span>
            <Input 
              value={privateWalletStore.importApiSecretKey} 
              onChange={(e) => privateWalletStore.importApiSecretKey = e.target.value.trim()} 
              placeholder="API 秘密密钥" 
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

          <div className='d-flex flex-column gap-2'>
            <span className='color-secondary font-size-13'>{t('common.addressNote', '备注')}</span>
            <Input 
              value={privateWalletStore.importNickname} 
              onChange={(e) => privateWalletStore.importNickname = e.target.value} 
              placeholder={`(${t('common.optional', '可选')})`} 
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
        </div>

        {/* Warning Box */}
        <div className="color-secondary font-size-13 px-3 py-3 br-2 mb-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
          - 我们不提供导入钱包的 API 密钥导出，请自行保存敏感数据。
        </div>

        {/* Action Buttons */}
        <div className="d-flex gap-3">
          <Button 
            className='col border-0 fw-500 font-size-15 d-flex align-items-center justify-content-center gap-2'
            onClick={() => window.open('https://hyperliquid.xyz/', '_blank')} // Change to actual tutorial link if available
            style={{ 
              height: '46px',
              borderRadius: '24px', 
              background: 'rgba(255,255,255,0.06)',
              color: '#38d1b3'
            }}
          >
            导入教程 
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </Button>

          <Button 
            loading={reqStore.userImportPrivateWalletBusy} 
            onClick={handleSubmit} 
            disabled={!(privateWalletStore.importAddress && privateWalletStore.importApiWalletAddress && privateWalletStore.importApiSecretKey)}
            className='col border-0 fw-500 font-size-15 color-secondary'
            style={{ 
              height: '46px',
              borderRadius: '24px', 
              background: 'rgba(255,255,255,0.06)',
            }}
            id="wallet-import-submit-btn"
          >
            {t('common.submit', '提交')}
          </Button>
          <style>{`
            #wallet-import-submit-btn:not(:disabled) {
              background: linear-gradient(90deg, #fce0fc 0%, #c4f1ff 40%, #38d1b3 100%) !important;
              color: #1a1d2d !important;
              font-weight: bold;
            }
          `}</style>
        </div>
      </div>
    </ModalBase>
  );
};

export default ModalImportPrivateWallet;
