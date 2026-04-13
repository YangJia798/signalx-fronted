import React from 'react';
import ModalCreatePrivateWallet from './CreatePrivateWallet';
import ModalImportPrivateWallet from './ImportPrivateWallet';
import ModalDeposit from './Deposit';
import ModalExportPrivateKey from './ExportPrivateKey';
import ModalRemoveWallet from './RemoveWallet';
import ModalClosePosition from './ClosePosition';
import ModalCreateCopyTrading from './CreateCopyTrading';
import ModalShareCopyTrade from './ShareCopyTrade';

const GlobalWalletModals = () => {
  return (
    <>
      <ModalCreatePrivateWallet />
      <ModalImportPrivateWallet />
      <ModalDeposit />
      <ModalExportPrivateKey />
      <ModalRemoveWallet />
      <ModalClosePosition />
      <ModalCreateCopyTrading />
      <ModalShareCopyTrade />
    </>
  );
};

export default GlobalWalletModals;
