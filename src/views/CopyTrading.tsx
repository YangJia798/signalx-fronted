import { useEffect, useState } from 'react'
import { Popconfirm, Dropdown, Select } from 'antd'
import { useTranslation } from 'react-i18next'
import BN from 'bignumber.js'

import { IShare, IOutlineEdit, IOutlineAdd, IOutlineShare, IOutlineTrash, IOutlineWallet3 } from '@/components/icon'
import { formatNumber, merge } from '@/utils'
import { useAccountStore, useTraderDetailsOpenOrdersAdditionalStore, usePrivateWalletStore, useReqStore, useCopyTradingStore } from '@/stores'
import ColumnList from '@/components/Column/List'
import WalletProviderIcon from '@/components/Wallet/ProviderIcon'
import ModalClosePosition from '@/components/Modal/ClosePosition'
import TabSwitch from '@/components/Tab/Switch'
import ModalCreateCopyTrading from '@/components/Modal/CreateCopyTrading'
import PositionItemDirectionLeverage from '@/components/PositionItem/DirectionLeverage'
import PositionItemPositionValue from '@/components/PositionItem/PositionValue'
import PositionItemUPnl from '@/components/PositionItem/UPnl'
import PositionItemAddress from '@/components/PositionItem/Address'
import SideButtonIcon from '@/components/Side/ButtonIcon'
import TimeAgo from '@/components/TimeAgo'
import ModalShareCopyTrade from '@/components/Modal/ShareCopyTrade'

import TraderDetailsNonFunding from '@/views/TraderDetails/NonFunding'
import TraderDetailsRecentFills from '@/views/TraderDetails/RecentFills'
import TraderDetailsTWAP from '@/views/TraderDetails/TWAP'
import TraderDetailsCompletedTrades from '@/views/TraderDetails/CompletedTrades'
import { TraderDetailsOpenOrdersAdditional } from '@/views/TraderDetails/OpenOrdersAdditional'
import TraderDetailsHistoricalOrders from '@/views/TraderDetails/HistoricalOrders'

const CopyTrading = () => {
  const accountStore = useAccountStore()
  const reqStore = useReqStore()
  const privateWalletStore = usePrivateWalletStore()
  const copyTradingStore = useCopyTradingStore()
  const traderDetailsOpenOrdersAdditionalStore = useTraderDetailsOpenOrdersAdditionalStore()
  const { t } = useTranslation()

  const [activeListTab, setActiveListTab] = useState('targets')
  const [selectedAddress, setSelectedAddress] = useState<string>('')

  const currentAddress = selectedAddress || privateWalletStore.addresses[0] || ''

  const ownWalletsColumn = [
    { id: 'address_note', label: t('common.addressNote') || '地址/备注', className: 'col-3' },
    { id: 'createTs', label: t('common.createImportTime') || '创建/导入时间', className: 'd-none d-xl-flex col-xl-2' },
    { id: 'balance', label: t('common.totalAccountValue') || '账户总价值', className: 'justify-content-center text-center col' },
    { id: 'uPnl', label: t('common.uPnl') || '未实现盈亏', className: 'justify-content-center text-center col' },
    { id: 'withdrawable', label: t('common.withdrawable') || '可提取', className: 'justify-content-center text-center col' },
    { id: 'operator', label: '', className: 'justify-content-end text-end col-3 col-xl-2' },
  ]

  const ownCopyTradesColumn = [
    { id: 'status', label: t('common.status', '状态'), className: 'd-none d-md-flex align-items-center col-1' },
    { id: 'note', label: t('common.note', '备注'), className: 'align-items-center col-2' },
    { id: 'target', label: t('common.copyTarget', '跟单目标'), className: 'align-items-center col-3' },
    { id: 'mode', label: t('common.copyMode', '跟单模式'), className: 'd-none d-xl-flex align-items-center col-2' },
    { id: 'address', label: t('common.executionAddress', '执行地址'), className: 'd-none d-lg-flex align-items-center col-3' },
    { id: 'operator', label: t('common.operator', '操作'), className: 'justify-content-end text-end align-items-center col-1' },
  ]

  const copyRecordsColumn = [
    { id: 'address_note', label: t('common.addressNote', '地址/备注'), className: 'col-4' },
    { id: 'accountValue', label: t('common.totalAccountValue', '账户总价值'), className: 'justify-content-center text-center col-4' },
    { id: 'uPnl', label: t('common.uPnl', '未实现盈亏'), className: 'justify-content-end text-end col-4' },
  ]

  const tabPosition = [
    { id: 'symbol', label: t('common.asset', '币种'), filter: 'symbol', className: 'd-none d-sm-flex col-sm-2 col-md-2 col-lg-1' },
    { id: 'positionValue', label: t('common.positionValue', '持仓价值'), sort: true, sortByKey: 'positionValue', className: 'col-3 col-md-2 col-xl-1' },
    { id: 'uPnl', label: t('common.uPnl', '未实现盈亏'), sort: true, sortByKey: 'uPnl', className: 'col-3 col-sm-2 col-md-2 col-lg-1' },
    { id: 'openingPrice', label: t('common.openingPrice', '入场均价'), sort: true, sortByKey: 'openingPrice', className: 'd-none d-xl-flex col-xl-1' },
    { id: 'markPrice', label: t('common.markPrice', '标记价'), sort: true, sortByKey: 'markPrice', className: 'd-none d-lg-flex col-lg-2 col-xl-1' },
    { id: 'liquidationPrice', label: t('common.liquidationPrice', '清算价'), sort: true, sortByKey: 'liquidationPrice', className: 'd-none d-md-flex col-md-1 col-xl-1' },
    { id: 'margin', label: t('common.margin', '保证金'), sort: true, sortByKey: 'margin', className: 'd-none d-md-flex col-md-2 col-lg-1 col-xl-1' },
    { id: 'fundingFee', label: t('common.fundingFee', '资金费用'), sort: true, sortByKey: 'fundingFee', className: 'd-none d-xl-flex col-xl-1' },
    { id: 'tpSl', label: t('common.tpSl', '止盈/止损'), className: 'd-none d-xl-flex col-xl-1' },
    { id: 'operator', label: t('common.closePos', '平仓'), className: 'ms-auto justify-content-end col' },
  ]

  const renderOwnWalletItem = (item: any, columnIndex: number) => {
    switch (ownWalletsColumn[columnIndex].id) {
      case 'address_note':
        return (
          <div className="d-flex align-items-center gap-3 w-100">
            <WalletProviderIcon platform={item.platform || 'hyperliquid'} />
            <div className="d-flex flex-column" style={{ overflow: 'hidden' }}>
              <PositionItemAddress item={item} link={false} shortener={true} className="fw-600 color-white" />
              <div className="color-secondary font-size-12 mt-1">{item.nickname || 'h'}</div>
            </div>
          </div>
        )
      case 'createTs':
        return (
          <div className="d-flex flex-column w-100">
            <div className="color-white font-size-13"><TimeAgo ts={item.createTs} /></div>
            <div className="color-secondary font-size-12 mt-1">{item.importWallet === 1 ? t('common.imported') : t('common.createdBySignalxbot')}</div>
          </div>
        )
      case 'balance':
        return <div className="text-center w-100 fw-600 color-white">$ {formatNumber(item.balance)}</div>
      case 'uPnl':
        return <div className={`text-center w-100 fw-600 ${ item.uPnlStatusClassName }`} >$ {new BN(item.uPnl).gt(0) && '+'}{formatNumber(item.uPnl)}</div>
      case 'withdrawable':
        return (
          <div className="d-flex align-items-center justify-content-center gap-2 w-100 fw-600 color-white">
            $ {formatNumber(item.withdrawable)}
            <span style={{color: '#ea3943', opacity: 0.8, cursor: 'pointer', display: 'flex', alignItems: 'center'}}>
              {/* Optional withdraw error cross icon placeholder */}
            </span>
          </div>
        )
      case 'operator':
        return (
          <div className="d-flex align-items-center justify-content-end gap-2 w-100">
            {item.importWallet !== 1 && (
              <>
                <button
                  className="border-0 cursor-pointer fw-500 font-size-12 transition-2 d-none d-md-block"
                  style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '24px', padding: '6px 16px', color: '#00d1b2', whiteSpace: 'nowrap', flexShrink: 0 }}
                  onClick={(e) => { e.stopPropagation(); merge(privateWalletStore, { openDeposit: true, operaWalletIdx: item.idx}) }}
                >
                  {t('common.deposit') || '存款'}
                </button>
                <button
                  className="border-0 cursor-pointer fw-500 font-size-12 transition-2 d-none d-md-block"
                  style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '24px', padding: '6px 16px', color: '#00d1b2', whiteSpace: 'nowrap', flexShrink: 0 }}
                  onClick={(e) => { e.stopPropagation() /* TODO Withdraw action */ }}
                >
                  {t('common.withdraw')}
                </button>
              </>
            )}
            <Dropdown placement="bottomRight"
              menu={{ items: [
                { content: <div onClick={(e) => { e.stopPropagation(); merge(privateWalletStore, { openExportPrivateKey: true, operaWalletIdx: item.idx}) }}>{ t('common.exportPrivateKey') }</div> },
                { danger: true, content: <div onClick={(e) => { e.stopPropagation(); merge(privateWalletStore, { openRemove: true, operaWalletIdx: item.idx}) }}>{ t('common.removeWallet') }</div> },
              ].map((menuItem, idx) => ({ key: idx, label: menuItem.content, danger: menuItem.danger }))}}
            >
              <button
                className="d-flex align-items-center justify-content-center border-0 cursor-pointer transition-2"
                style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '50%', width: '28px', height: '28px', color: 'rgba(255,255,255,0.6)' }}
                onClick={(e) => e.stopPropagation()}
              >
                ...
              </button>
            </Dropdown>
          </div>
        )
      default:
        return null
    }
  }

  const renderOwnCopyTradesItem = (item: any, columnIndex: number) => {
    switch (ownCopyTradesColumn[columnIndex].id) {
      case 'status':
        return item.isEnabled
          ? <span className="color-success font-size-14">● {t('common.on', '开启')}</span>
          : <span className="color-secondary font-size-14">● {t('common.off', '关闭')}</span>
      case 'note':
        return <span className="color-white fw-500 font-size-14">{item.note || '-'}</span>
      case 'target':
        return <PositionItemAddress item={item} link={false} shortener={true} className="fw-600 color-white" />
      case 'mode': {
        const followModelMap: Record<number, string> = { 1: t('common.assetProportional'), 2: t('common.positionProportional'), 3: t('common.fixedValue') }
        return (
          <div className="d-flex flex-column gap-1">
            <span className="color-white font-size-13">{followModelMap[item.followModel as number] || '-'}</span>
            <span className="color-secondary font-size-12">
              {item.copyRatio ? `${item.copyRatio}%` : '-'}
              {item.leverage ? ` · ${item.leverage}x` : ''}
            </span>
          </div>
        )
      }
      case 'address':
        return <span className="color-white font-size-14">
          <PositionItemAddress item={{address: item.operaAddress || '-'}} link={false} shortener={true} className="fw-500 color-white" />
        </span>
      case 'operator':
        return (
          <span className='d-flex gap-3 align-items-center justify-content-end w-100'>
            {
              [
                { icon: <IShare className='zoom-85' />, title: t('common.share'), onClick: () => handleOpenShareCopyTrade(item) },
                { icon: <IOutlineEdit className='zoom-85' />, title: t('common.editCopyTrading'), onClick: () => handleOpenCreateCopyTrade(item, true) },
                { icon: <Popconfirm title={t('common.removeCopyTrading')} onConfirm={() => handleOpenRemoveCopyTrade(item)} okText={t('common.remove')} icon={<IOutlineTrash className='zoom-80' />} showCancel={false}><IOutlineTrash className='zoom-90 linker' /></Popconfirm>, title: t('common.removeCopyTrading'), logged: true},
              ].map((op, idx) => <SideButtonIcon key={idx} title={op.title} onClick={op.onClick ?? (() => {})} logged={op.logged} icon={op.icon} />)
            }
          </span>
        )
      default:
        return null
    }
  }

  const renderCopyRecordsItem = (item: any, columnIndex: number) => {
    switch (copyRecordsColumn[columnIndex].id) {
      case 'address_note':
        return (
          <div className="d-flex align-items-center gap-3 w-100">
            <WalletProviderIcon platform={item.platform || 'hyperliquid'} />
            <div className="d-flex flex-column" style={{ overflow: 'hidden' }}>
              <PositionItemAddress item={item} link={false} shortener={true} className="fw-600 color-white" />
              <div className="color-secondary font-size-12 mt-1">{item.note || '-'}</div>
            </div>
          </div>
        )
      case 'accountValue':
        return <div className="text-center w-100 fw-600 color-white">$ {formatNumber(item.balance || 0)}</div>
      case 'uPnl':
        return <div className={`text-center w-100 fw-600 ${ new BN(item.uPnl || 0).gt(0) ? 'color-success' : 'color-danger' }`} >$ {new BN(item.uPnl || 0).gt(0) && '+'}{formatNumber(item.uPnl || 0)}</div>
      default:
        return null
    }
  }

  const renderPositionItem = (item, columnIndex) => {
    switch (tabPosition[columnIndex].id) {
      case 'walletId':
        return item.walletId
      case 'symbol':
        return item.coin
      case 'leverage':
        return <PositionItemDirectionLeverage item={item} />
      case 'positionValue':
        return <PositionItemPositionValue item={item} />
      case 'uPnl':
        return <PositionItemUPnl item={item} />
      case 'openingPrice':
        return <>$ {item.openPrice}</>
      case 'liquidationPrice':
        return item.liquidationPrice
          ? <>$ {item.liquidationPrice}</>
          : '-'
      case 'margin':
        return <>$ { formatNumber(item.marginUsed) }</>
      case 'markPrice':
        return <>$ { item.markPrice }</>
      case 'operator':
        return <div className='hover-primary br-4 px-2 py-1 fw-500' onClick={() => merge(copyTradingStore, { openClosePosition: true, operaPositionIdx: item.idx}) }>{ t('common.closeAll')}</div>
      default:
        return null
    }
  }

  const handleOpenCreateCopyTrade = (item?: any, edit: boolean = false) => {
    copyTradingStore.isOpenPositionTargetEdit = edit

    if (edit) {
      copyTradingStore.operaCopyTradingTargetItemIdx = item.idx
    }

    // NOTE: 同步完，最后打开弹窗
    copyTradingStore.openCopyTradingTarget = true
  }

  const handleOpenShareCopyTrade = async (item: any) => {
    copyTradingStore.shareCopyTradeAddress = item.address

    copyTradingStore.openShareCopyTrade = true
  }

  const handleOpenRemoveCopyTrade = async (item: any) => {
    // sync
    copyTradingStore.operaCopyTradingTargetItemIdx = item.idx

    const { error } = await reqStore.copyTradingRemoveMyCopyTrading(accountStore, copyTradingStore)

    if (error) return

    // update
    await reqStore.copyTradingMyCopyTrading(accountStore, copyTradingStore)
  }

  // init
  useEffect(() => {
    const asyncFunc = async () => {
      await reqStore.userPrivateWallet(accountStore, privateWalletStore)
      await reqStore.copyTradingMyCopyTrading(accountStore, copyTradingStore)
      await reqStore.copyTradingMyPosition(accountStore, copyTradingStore)
    }

    if (!accountStore.logged) {
      privateWalletStore.reset()
      copyTradingStore.reset()
      return
    }

    asyncFunc()
    return () => {
      privateWalletStore.reset()
      copyTradingStore.reset()
    }
  }, [accountStore.logged])

  return (
    <>
      {/* <div className='pt-5 mt-5'>
        <Button onClick={() => privateWalletStore.openDeposit = true }>openDeposit</Button>
        <Button onClick={() => privateWalletStore.openWithdraw = true }>openWithdraw</Button>
      </div> */}
      {/* <div className='mt-4'></div> */}

      <div className="container-fluid px-0 d-flex flex-column my-5 pt-5">
        <div className="container-xl d-flex flex-column px-3 px-md-4 gap-3 gap-md-4 my-3 my-md-5 py-0">
          <div className="d-flex gap-4 align-items-center justify-content-between col">
            <h4 className="d-flex gap-3 align-items-center fw-bold m-0">
              <IOutlineWallet3 className='zoom-110' />
              <span>
                { t('common.myWallets') || '我的钱包' }
                {accountStore.logged && <span className="ms-2">({privateWalletStore.list.length})</span>}
              </span>
            </h4>
            <div className="d-flex gap-2">
              <button
                className="d-flex align-items-center justify-content-center gap-2 cursor-pointer transition-2"
                style={{
                  background: 'rgba(0, 209, 178, 0.1)',
                  border: '1px solid #00d1b2',
                  borderRadius: '24px',
                  color: '#00d1b2',
                  padding: '8px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
                onClick={() => privateWalletStore.openCreatePrivateWallet = true}
              >
                <IOutlineAdd />
                <span className="d-none d-sm-block">{t('common.createWallet') || '创建钱包'}</span>
              </button>
              <button
                className="d-flex align-items-center justify-content-center gap-2 cursor-pointer transition-2"
                style={{
                  background: 'transparent',
                  border: '1px solid #00d1b2',
                  borderRadius: '24px',
                  color: '#00d1b2',
                  padding: '8px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
                onClick={() => privateWalletStore.openImportPrivateWallet = true}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span className="d-none d-sm-block">{t('common.importWallet')}</span>
              </button>
            </div>
          </div>
          <ColumnList className='br-3' logged columns={ownWalletsColumn} data={privateWalletStore.list} busy={reqStore.userPrivateWalletBusy} renderItem={renderOwnWalletItem} />
        </div>

        <div className="container-xl d-flex flex-column px-3 px-md-4 gap-3 gap-md-4 my-3 my-md-5 py-0">
          <div className="d-flex gap-4 align-items-center justify-content-between col">
            <h4 className="d-flex gap-3 align-items-center fw-bold m-0">
              <IOutlineShare className='zoom-110' />{ t('header.copyTrading') }
            </h4>
            <div>
              <button
                className="d-flex align-items-center justify-content-center gap-2 cursor-pointer transition-2"
                style={{
                  background: 'rgba(0, 209, 178, 0.1)',
                  border: '1px solid #00d1b2',
                  borderRadius: '24px',
                  color: '#00d1b2',
                  padding: '8px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
                onClick={() => handleOpenCreateCopyTrade() }
              >
                <IOutlineAdd />
                <span className="d-none d-sm-block">{t('common.createCopyTrading') || '创建跟单交易'}</span>
              </button>
            </div>
          </div>
          
          <div className="d-flex align-items-center justify-content-start gap-4 mt-2">
             <div className={`py-2 fw-bold font-size-15 cursor-pointer pb-2 ${activeListTab === 'targets' ? 'color-white' : 'color-secondary hover-text-white transition-2'}`}
                  style={activeListTab === 'targets' ? { borderBottom: '2px solid white', marginBottom: '-1px' } : {}}
                  onClick={() => setActiveListTab('targets')}
             >
                {t('common.copyTargets')} {accountStore.logged && `(${copyTradingStore.copyTradingList.length})`}
             </div>
             <div className={`py-2 fw-bold font-size-15 cursor-pointer pb-2 ${activeListTab === 'records' ? 'color-white' : 'color-secondary hover-text-white transition-2'}`}
                  style={activeListTab === 'records' ? { borderBottom: '2px solid white', marginBottom: '-1px' } : {}}
                  onClick={() => setActiveListTab('records')}
             >
                {t('common.copyRecords')}
             </div>
          </div>

          {activeListTab === 'targets' ? (
            <ColumnList className='br-3 mt-2' logged columns={ownCopyTradesColumn} data={copyTradingStore.copyTradingList} busy={reqStore.copyTradingMyCopyTradingBusy} renderItem={renderOwnCopyTradesItem} />
          ) : (
            <ColumnList className='br-3 mt-2' logged columns={copyRecordsColumn} data={[]} busy={false} renderItem={renderCopyRecordsItem} />
          )}
        </div>

        <div className="container-xl d-flex flex-column px-3 px-md-4 gap-3 gap-md-4 my-3 my-md-5 py-0">
          <div className="d-flex gap-4 align-items-center justify-content-between col mb-0">
            <h4 className="d-flex gap-2 align-items-center fw-bold m-0 text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"></path><path d="M12 7v5l3 3"></path></svg>
              {t('common.addressOverview')}
            </h4>
            {privateWalletStore.list.length > 0 && (
              <Select
                value={currentAddress || undefined}
                onChange={setSelectedAddress}
                style={{ minWidth: 260 }}
                dropdownStyle={{ background: '#1a1a2e' }}
                bordered={false}
                className="bg-gray-alpha-4 br-4"
                optionLabelProp="label"
              >
                {privateWalletStore.list.map(w => {
                  const shortAddr = `${w.address.slice(0, 6)}...${w.address.slice(-6)}`
                  return (
                    <Select.Option key={w.address} value={w.address} label={
                      <div className="d-flex align-items-center gap-2">
                        <WalletProviderIcon platform={w.platform || 'hyperliquid'} />
                        <span className="color-white fw-bold">{shortAddr}</span>
                        <span className="color-secondary font-size-12">{w.nickname || 'h'}</span>
                        <span className="color-white fw-bold ms-1">$ {formatNumber(w.balance)}</span>
                      </div>
                    }>
                      <div className="d-flex align-items-center gap-2 py-1">
                        <WalletProviderIcon platform={w.platform || 'hyperliquid'} />
                        <span className="color-white fw-bold">{shortAddr}</span>
                        <span className="color-secondary font-size-12">{w.nickname || 'h'}</span>
                        <span className="color-white fw-bold ms-1">$ {formatNumber(w.balance)}</span>
                      </div>
                    </Select.Option>
                  )
                })}
              </Select>
            )}
          </div>

          <div className='d-flex flex-column br-3 overflow-hidden'>
            <TabSwitch
              className="color-white"
              labelSuffixes={[` (${copyTradingStore.positionList.length})`, ` (${traderDetailsOpenOrdersAdditionalStore.list.length})`]}
              data={copyTradingStore.tabs}
              currId={copyTradingStore.tabId}
              onClick={(item) => copyTradingStore.tabId = item.id} />
            {
              copyTradingStore.tabId === 'positions' &&
                <ColumnList columns={tabPosition} logged data={copyTradingStore.positionList} busy={reqStore.copyTradingMyPositionBusy} renderItem={renderPositionItem} />
            }
            {
              copyTradingStore.tabId === 'openOrders' &&
                <TraderDetailsOpenOrdersAdditional address={currentAddress} />
            }
            {
              copyTradingStore.tabId === 'historicalOrders' &&
                <TraderDetailsHistoricalOrders address={currentAddress} />
            }
            {
              copyTradingStore.tabId === 'recentFills' &&
                <TraderDetailsRecentFills address={currentAddress} />
            }
            {
              copyTradingStore.tabId === 'completedTrades' &&
                <TraderDetailsCompletedTrades address={currentAddress} />
            }
            {
              copyTradingStore.tabId === 'twap' &&
                <TraderDetailsTWAP address={currentAddress} />
            }
            {
              copyTradingStore.tabId === 'depositsAndWithdrawals' &&
                <TraderDetailsNonFunding address={currentAddress} />
            }
          </div>
        </div>
      </div>
    </>
  )
}

export default CopyTrading