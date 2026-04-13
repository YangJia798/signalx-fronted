import { useEffect, useRef } from 'react';
import { isAddress } from 'viem'
import { message, Input, InputNumber, Button, Radio, Slider, Checkbox, Select } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'

import { formatNumber, inputIsNumber, sleep, merge } from '@/utils';
import { IOutlineInfoCircle } from '@/components/icon'
import { constants, useAccountStore, usePrivateWalletStore, useReqStore, useCopyTradingStore } from '@/stores'
import BaseModal from './Base';
import WalletChainIcon from '@/components/Wallet/ChainIcon';
import WalletProviderIcon from '@/components/Wallet/ProviderIcon';
import ColumnList from '@/components/Column/List'
import PositionItemDirectionLeverage from '@/components/PositionItem/DirectionLeverage'
import PositionItemPositionValue from '@/components/PositionItem/PositionValue'
import PositionItemUPnl from '@/components/PositionItem/UPnl'
import Busy from '@/components/Busy'
import ColumnTooltip from '@/components/Column/Tooltip'
import InputSearch from '@/components/Input/Search';
import LoginBtn from '@/components/Login/Btn'
import { useNotification } from '@/components/Notification'
import BN from 'bignumber.js'

const ModalCreateCopyTrading = () => {
  const accountStore = useAccountStore()
  const reqStore = useReqStore()
  const copyTradingStore = useCopyTradingStore()
  const privateWalletStore = usePrivateWalletStore()
  const location = useLocation();
  const { t } = useTranslation()
  const notification = useNotification()
  const navigate = useNavigate()

  const inputTargetAddressRef = useRef<any>(null);

  const targetPosition = [
    { id: 'symbol', label: t('common.symbol'), className: 'col-3 text-secondary' },
    { id: 'positionValue', label: t('common.positionValue'), className: 'justify-content-center text-center col text-secondary' },
    { id: 'uPnl', label: t('common.uPnl'), className: 'justify-content-end text-end col-4 text-secondary' },
  ]

  const renderPositionItem = (item: any, columnIndex: number) => {
    switch (targetPosition[columnIndex].id) {
      case 'symbol':
        return <div className="d-flex align-items-center gap-2">
           <span className="fw-bold color-white">{item.coin}</span>
           <span className="color-secondary font-size-12">{item.leverage}x</span>
        </div>
      case 'positionValue':
        return <div className="text-center fw-bold color-white">{formatNumber(item.positionValue)}</div>
      case 'uPnl':
        return <div className={`${item.uPnlStatus === 1 ? 'color-success' : item.uPnlStatus === 2 ? 'color-danger' : 'color-white'} text-end fw-bold`}>
           {item.uPnlStatus === 1 && '+'}{formatNumber(item.uPnl)}
        </div>
      default:
        return null
    }
  }

  const handleClose = () => {
    copyTradingStore.openCopyTradingTarget = false;
  };

  const handleSubmit = async () => {
    const { error } = await reqStore.copyTradingCreateCopyTrading(accountStore, copyTradingStore)

    if (error) return

    handleClose()
    notification.success({
      message: t(copyTradingStore.isOpenPositionTargetEdit ? 'notification.editedSuccessfully' : 'notification.addedSuccessfully'),
      description: <span className='d-flex flex-column gap-1'>
        {t('notification.copyTradingAddressSuccess', { address: copyTradingStore.copyTradingTargetAddress })}
        <small className='color-secondary'>{t('notification.view')}</small>
      </span>,
      onClick: () => navigate('/copy-trading')
    })
    await reqStore.copyTradingMyCopyTrading(accountStore, copyTradingStore)
  };

  const handleSearchTargetAddress = async () => {
    copyTradingStore.resetCopyTradingTargetInfo()

    if (!isAddress(copyTradingStore.copyTradingSearchTargetAddress)) {
      message.error(t('message.pleaseInputAddress'))
      return
    }

    const { error } = await reqStore.copyTradingTargetPosition(accountStore, copyTradingStore)
    if (error) return
  }

  const handleSyncOpenPositionSellModelValue = (decode?: boolean = false) => {
    if (copyTradingStore.openPositionSellModel !== 3) return

    if (decode) {
      copyTradingStore.openPositionSellModelValue.split('|').map((item, idx) => {
        switch(idx) {
          case 0:
            copyTradingStore.openPositionSellModelTakeProfitRatioValue = +(item || 0)
            break
          case 1:
            copyTradingStore.openPositionSellModelStopLossRatioValue = +(item || 0)
            break
          default:
        }
      })
    } else {
      copyTradingStore.openPositionSellModelValue = `${copyTradingStore.openPositionSellModelTakeProfitRatioValue || ''}|${copyTradingStore.openPositionSellModelStopLossRatioValue || ''}`
    }
  }

  const handleQuickerOpenPosition = async () => {
    copyTradingStore.copyTradingSearchTargetAddress = copyTradingStore.quickerOpenPositionTargetAddress
    handleSearchTargetAddress()
    copyTradingStore.resetQuickerOpenPosition()

    await reqStore.copyTradingFindByAddress(accountStore, copyTradingStore)

    const hasQuickerOpenPositionItem = !!copyTradingStore.quickerOpenPositionItem
    copyTradingStore.isOpenPositionTargetEdit = hasQuickerOpenPositionItem

    if (hasQuickerOpenPositionItem) {
      const { address, note, leverage, buyModel, buyModelValue, sellModel, sellModelValue } = copyTradingStore.quickerOpenPositionItem
      merge(copyTradingStore, {
        copyTradingSearchTargetAddress: address,
        openPositionTargeNote: note,
        openPositionLeverage: leverage,
        openPositionBuyModel: buyModel,
        openPositionBuyModelValue: buyModelValue,
        openPositionSellModel: sellModel,
        openPositionSellModelValue: sellModelValue,
      })
    }
  }

  useEffect(() => {
    const asyncFunc = async () => {
      if (copyTradingStore.quickerOpenPositionTargetAddress) {
        handleQuickerOpenPosition()
        return
      }

      if (copyTradingStore.operaCopyTradingTargetItemIdx >= 0 && copyTradingStore.operaCopyTradingTargetItem && copyTradingStore.isOpenPositionTargetEdit) {
        const { address, note, leverage, buyModel, buyModelValue, sellModel, sellModelValue } = copyTradingStore.operaCopyTradingTargetItem

        merge(copyTradingStore, {
          copyTradingSearchTargetAddress: address,
          openPositionTargeNote: note,
          openPositionLeverage: leverage,
          openPositionBuyModel: buyModel,
          openPositionBuyModelValue: buyModelValue,
          openPositionSellModel: sellModel,
          openPositionSellModelValue: sellModelValue,
        })

        handleSearchTargetAddress()
        handleSyncOpenPositionSellModelValue(true)
      }

      if (copyTradingStore.isOpenPositionTargetEdit) return
      await sleep(250)
      if (copyTradingStore.openCopyTradingTarget && inputTargetAddressRef.current) {
        inputTargetAddressRef.current.focus()
      }
    }

    if (!copyTradingStore.openCopyTradingTarget || !accountStore.logged) return

    copyTradingStore.resetCopyTradingTarget()
    copyTradingStore.resetOpenPosition()

    if (privateWalletStore.list.length > 0) {
      copyTradingStore.openPositionWalletAddress = privateWalletStore.list[0].address;
    }

    asyncFunc()
  }, [copyTradingStore.openCopyTradingTarget])

  useEffect(() => {
    const asyncFunc = async () => {
      try {
        const queryParams = new URLSearchParams(location.search);
        const cctAddress = queryParams.get(constants.paramKey.copyTradingTargetAddress);

        if (cctAddress && isAddress(cctAddress)) {
          copyTradingStore.openCopyTradingTarget = true
          await sleep(300)
          copyTradingStore.quickerOpenPositionTargetAddress = cctAddress
          handleQuickerOpenPosition()
        }
      } catch (error) {
        console.log(error);
      }
    }
    asyncFunc()
  }, [location, accountStore.logged])

  return (
    <BaseModal
      title={t(copyTradingStore.isOpenPositionTargetEdit ? 'common.editCopyTrading' : 'common.createCopyTrading')}
      width={1000}
      open={copyTradingStore.openCopyTradingTarget}
      onClose={handleClose}
    >
      <div className='d-flex flex-wrap gap-4 px-2'>
        {/* Left Column */}
        <div className='d-flex flex-column flex-grow-1 gap-3 col-12 col-lg-5'>
          <Busy spinning={reqStore.copyTradingTargetPositionBusy}>
            <InputSearch
              ref={inputTargetAddressRef}
              value={copyTradingStore.copyTradingSearchTargetAddress}
              className='br-1 px-3'
              style={{ height: '44px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }}
              placeholder={t('copyTrading.searchCopyTradingAddress')}
              onPressEnter={handleSearchTargetAddress}
              readOnly={copyTradingStore.isOpenPositionTargetEdit}
              disabled={copyTradingStore.isOpenPositionTargetEdit}
              onChange={(value) => copyTradingStore.copyTradingSearchTargetAddress = value}
              onSearch={handleSearchTargetAddress}
            />
          </Busy>

          <div className='d-flex gap-0 px-0 pb-3 mt-2 border-bottom border-secondary-subtle border-opacity-25'>
            <div className='d-flex flex-column gap-2 justify-content-center p-0 col'>
              <span className='color-secondary font-size-13'>{ t('common.totalPositionValue', '总持仓价值') }</span>
              <span className='fw-bold font-size-16 color-white'>{ copyTradingStore.copyTradingTargetTotalPositionValue ? `$ ${formatNumber(copyTradingStore.copyTradingTargetTotalPositionValue)}` : '-' }</span>
            </div>
            <div className='d-flex flex-column gap-2 justify-content-center p-0 col'>
              <span className='color-secondary font-size-13'>{ t('common.uPnl', '未实现盈亏') }</span>
              <span className={`fw-bold font-size-16 ${copyTradingStore.copyTradingTargetTotalUPnlStatusClassName || 'color-white'}`}>{ copyTradingStore.copyTradingTargetTotalUPnl ? `${copyTradingStore.copyTradingTargetTotalUPnlStatus === 1 ? '+' : ''}$ ${formatNumber(copyTradingStore.copyTradingTargetTotalUPnl)}` : '-' }</span>
            </div>
          </div>

          <div className='flex-grow-1 d-flex flex-column position-relative' style={{ minHeight: '360px', overflow: 'hidden' }}>
            <ColumnList height={320} columns={targetPosition} data={copyTradingStore.copyTradingTargetPositionList} busy={false} renderItem={renderPositionItem} className='h-100 bg-transparent' />

          </div>
        </div>

        {/* Right Column */}
        <div className='d-flex flex-column flex-grow-1 gap-4 col-12 col-lg-6 ps-lg-3'>
          
          <div className='d-flex flex-column gap-2'>
             <div className='color-secondary font-size-13'>{t('common.selectOwnAddress', '选择自己的地址')}</div>
             <Select
                value={copyTradingStore.openPositionWalletAddress}
                onChange={(val) => copyTradingStore.openPositionWalletAddress = val}
                className='w-100 font-size-15 SelectWalletDropdown'
                dropdownStyle={{ backgroundColor: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)' }}
                style={{ height: '48px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}
                bordered={false}
                options={privateWalletStore.list.map((item) => ({
                  value: item.address,
                  label: (
                    <div className="d-flex align-items-center justify-content-between w-100 pt-1">
                      <div className="d-flex align-items-center gap-2">
                         <WalletProviderIcon platform={item.platform || 'hyperliquid'} />
                         <span className="fw-bold color-white">{item.address.slice(0, 6)}...{item.address.slice(-6)}{item.nickname && <span className="color-secondary font-size-12 fw-normal ms-1">{item.nickname}</span>}</span>
                      </div>
                      <span className="fw-bold color-white">$ {formatNumber(item.balance)}</span>
                    </div>
                  )
                }))}
             />
          </div>

          <div className='d-flex flex-column gap-2'>
             <div className='d-flex justify-content-between align-items-center'>
               <div className='color-secondary font-size-13'>{t('common.leverage', '杠杆')}</div>
               <Checkbox checked={copyTradingStore.openPositionFollowTargetLeverage} onChange={e => copyTradingStore.openPositionFollowTargetLeverage = e.target.checked} className='color-secondary font-size-13 m-0'>{t('common.followTargetLeverage', '跟随目标杠杆')}</Checkbox>
             </div>
             <div className='d-flex align-items-center gap-3 mt-1'>
                <Slider className='flex-grow-1 m-0 me-3' marks={{1: '1x', 5: '5x', 10: '10x', 25: '25x', 40: '40x'}} step={1} value={copyTradingStore.openPositionLeverage} min={copyTradingStore.openPositionLeverageMin} max={copyTradingStore.openPositionLeverageMax} onChange={(val) => copyTradingStore.openPositionLeverage = val} />
                <div className='border border-secondary-subtle br-2 px-2 d-flex align-items-center justify-content-center' style={{ width: '70px', height: '40px', background: 'transparent' }}>
                  <Input value={copyTradingStore.openPositionLeverage} className="bg-transparent border-0 color-white text-center p-0 shadow-none fw-bold" onChange={(e) => {
                       const value = e.target.value
                       if (!inputIsNumber(value)) return
                       const num = +value
                       copyTradingStore.openPositionLeverage = Math.min(Math.max(copyTradingStore.openPositionLeverageMin, num), copyTradingStore.openPositionLeverageMax)
                    }} />
                  <span className='color-secondary font-size-14 fw-bold ms-1'>x</span>
                </div>
             </div>
          </div>

          <div className='d-flex flex-column gap-2'>
            <div className='color-secondary font-size-13'>{t('common.marginMode', '保证金模式')}</div>
            <div className='d-flex gap-0 br-1 border border-secondary-subtle overflow-hidden'>
               {copyTradingStore.openPositionMarginModeRadios.map(item => (
                 <div key={item.value} onClick={() => copyTradingStore.openPositionMarginMode = item.value}
                    className={`flex-grow-1 text-center py-2 cursor-pointer transition-2 font-size-14 fw-500 ${copyTradingStore.openPositionMarginMode === item.value ? 'color-primary' : 'color-secondary hover-text-white'}`}
                    style={{ borderRight: item.value !== 2 ? '1px solid rgba(255,255,255,0.1)' : 'none', background: copyTradingStore.openPositionMarginMode === item.value ? 'rgba(0, 209, 178, 0.05)' : 'transparent' }}>
                    {t(item.i18n || item.label)}
                 </div>
               ))}
            </div>
          </div>

          <div className='d-flex flex-column gap-2'>
            <div className='color-secondary font-size-13'>{t('common.copyMode', '跟单模式')}</div>
            <div className='d-flex gap-0 br-1 border border-secondary-subtle overflow-hidden'>
               {copyTradingStore.openPositionBuyModelRadios.map((item, i) => (
                 <div key={item.value} onClick={() => copyTradingStore.openPositionBuyModel = item.value}
                    className={`flex-grow-1 text-center py-2 cursor-pointer transition-2 font-size-14 fw-500 d-flex align-items-center justify-content-center gap-1 ${copyTradingStore.openPositionBuyModel === item.value ? 'color-primary' : 'color-secondary hover-text-white'}`}
                    style={{ borderRight: i !== 2 ? '1px solid rgba(255,255,255,0.1)' : 'none', background: copyTradingStore.openPositionBuyModel === item.value ? 'rgba(0, 209, 178, 0.05)' : 'transparent' }}>
                    {t(item.i18n || item.label)}
                    <IOutlineInfoCircle className='zoom-85' />
                 </div>
               ))}
            </div>
          </div>

          <div className='d-flex gap-3 align-items-center w-100'>
             <div className='d-flex flex-column gap-2 flex-grow-1 col'>
                <div className='color-secondary font-size-13 d-flex align-items-center gap-1'>{t('common.copyRatio', '跟单比例')} <IOutlineInfoCircle className='zoom-85' /></div>
                <div className='border border-secondary-subtle br-1 px-3 py-2 d-flex align-items-center justify-content-between' style={{ background: 'transparent'}}>
                   <Input value={copyTradingStore.openPositionCopyRatio} onChange={e => copyTradingStore.openPositionCopyRatio = e.target.value} className="bg-transparent border-0 color-white p-0 shadow-none w-100 fw-bold" />
                   <span className='color-white fw-bold'>%</span>
                </div>
             </div>
             <div className='d-flex flex-column gap-2 flex-grow-1 col'>
                <div className='color-secondary font-size-13'>{t('common.highMarginProtect', '高保证金使用率保护')}</div>
                <div className='border border-secondary-subtle br-1 px-3 py-2 d-flex align-items-center justify-content-between' style={{ background: 'transparent'}}>
                   <Input value={copyTradingStore.openPositionHighMarginProtect} onChange={e => copyTradingStore.openPositionHighMarginProtect = e.target.value} className="bg-transparent border-0 color-white p-0 shadow-none w-100 fw-bold" />
                   <span className='color-white fw-bold'>%</span>
                </div>
             </div>
          </div>


          <div className='d-flex gap-3 mt-auto pt-4'>
             <ColumnTooltip title={
                copyTradingStore.openPositionSellModel === 3 && !copyTradingStore.openPositionSellModelTakeProfitRatioValue && !copyTradingStore.openPositionSellModelStopLossRatioValue && t('copyTrading.takeProfitStopLossWarning')
                  || ''
              }>
               <Button type='primary' loading={reqStore.copyTradingCreateCopyTradingBusy} disabled={!copyTradingStore.copyTradingTargetAddress || (copyTradingStore.openPositionSellModel === 3 && !copyTradingStore.openPositionSellModelTakeProfitRatioValue && !copyTradingStore.openPositionSellModelStopLossRatioValue)} className="flex-grow-1 d-flex justify-content-center align-items-center font-size-14 fw-bold br-pill border-0 w-100" style={{ height: '48px' }} onClick={handleSubmit}>{t('common.create', '创建')}</Button>
             </ColumnTooltip>
          </div>
        </div>
      </div>

      {
        !accountStore.logged &&
          <div className='d-flex flex-column align-items-center position-full justify-content-center bg-black-thin gap-3 position-absolute z-index-99'>
            <LoginBtn />
            <span className="color-secondary fw-500">
              {t('common.loginRequired')}
            </span>
          </div>
      }
    </BaseModal>
  );
};

export default ModalCreateCopyTrading;