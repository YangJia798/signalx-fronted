import React from 'react';
import ModalCreatePrivateWallet from './CreatePrivateWallet';
import ModalImportPrivateWallet from './ImportPrivateWallet';
import ModalDeposit from './Deposit';
import ModalExportPrivateKey from './ExportPrivateKey';
import ModalSetFundPassword from './SetFundPassword';
import ModalBindEmail from './BindEmail';
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
      <ModalSetFundPassword />
      <ModalBindEmail />
      <ModalRemoveWallet />
      <ModalClosePosition />
      <ModalCreateCopyTrading />
      <ModalShareCopyTrade />
    </>
  );
};

export default GlobalWalletModals;
