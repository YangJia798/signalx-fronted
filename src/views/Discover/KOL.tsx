import { useEffect } from 'react'
import { Button, message, Progress } from 'antd'
import { useTranslation } from 'react-i18next'
import BN from 'bignumber.js'

import { formatNumber, merge } from '@/utils'
import { useDiscoverStore, useCopyTradingStore, useTrackingCreateStore, useDiscoverTradingStatisticsStore, useAccountStore, useReqStore, useDiscoverKolStore } from '@/stores'
import { ICyclical, IOutlineAdd, IOutlineMonitor, IOutlineChart2, IOutlineShare } from '@/components/icon'
import { DISCOVER_MOCK_KOL } from '@/stores/Discover/mock'

import InputSearch from '@/components/Input/Search'
import DropdownMenu from '@/components/Dropdown/Menu'
import Busy from '@/components/Busy'
import ColumnNoData from '@/components/Column/NoData'
import ButtonIcon from '@/components/ButtonIcon'
import PositionItemAddress from '@/components/PositionItem/Address'
import PositionItemCommonPnl from '@/components/PositionItem/CommonPnl';
import SideButtonIcon from '@/components/Side/ButtonIcon'
import Avatar from '@/components/Avatar'
import ColumnTooltip from '@/components/Column/Tooltip'
import ModalTaggingKOL from '@/components/Modal/TaggingKOL'

import ICommunityCertification from '@/assets/image/view/Discover/community_certification.svg?react'
import IOfficialCertification from '@/assets/image/view/Discover/official_certification.svg?react'

const DiscoverKOL = () => {
  const reqStore = useReqStore()
  const accountStore = useAccountStore()
  const discoverStore = useDiscoverStore()
  const discoverTradingStatisticsStore = useDiscoverTradingStatisticsStore()
  const copyTradingStore = useCopyTradingStore()
  const trackingCreateStore = useTrackingCreateStore()
  const discoverKolStore = useDiscoverKolStore()
  const { t } = useTranslation()

  const handleSearchByAddress = async () => {
    const kolUsername = discoverKolStore.searchKolInput.trim()

    if (!kolUsername) {
      message.error(t('message.pleaseInputKol'))
      return
    }
    discoverKolStore.resetSearch()

    // update
    discoverKolStore.searchKol = kolUsername

    // 通过搜索
    await handleUpdateList(true)
  }

  const handleChangeSelectCycle = async (value: string) => {
    discoverStore.selectedCycleValue = value

    // 通过 cycle 进行的请求，要重置 list
    await handleUpdateList(true)
  }

  const handleNextPagePush = async () => {
    // update
    discoverKolStore.next()

    await handleUpdateList()
  }

  const handleUpdateList = async (reset: boolean = false) => {
    if (reset) {
      discoverKolStore.resetList()
    }

    const { error } = await reqStore.discoverKolList(accountStore, discoverStore, discoverKolStore)
    if (error) return
  }

  const handleOpenQuickerCreateCopyTrade = (item?: any) => {
    copyTradingStore.quickerOpenPositionTargetAddress = item.address

    // NOTE: 同步完，最后打开弹窗
    copyTradingStore.openCopyTradingTarget = true
  }

  const handleOpenTradingStatistics = (item: any) => {
    discoverTradingStatisticsStore.address = item.address
    discoverTradingStatisticsStore.openModal = true
  }

  const handleOpenCreateTrackAddress = async (item: any) => {
    // sync quick
    trackingCreateStore.quickCreateTrackAddress = item.address
    trackingCreateStore.openCreateTracking = true
  }

  const handleSearchAddressClear = async () => {
    discoverKolStore.resetSearch()

    await handleUpdateList(true)
  }

  const handleVote = async (item: any, trust: boolean) => {
    merge(discoverKolStore, {
      voteId: item.id,
      voteType: trust ? 1 : -1
    })

    item.busy = true
    const { error } = await reqStore.discoverKolVote(accountStore, discoverKolStore)

    item.busy = false

    if (error) return

    item.voted = true
  }

  // init
  useEffect(() => {
    const asyncFunc = async () => {
      // NOTE: 因为登录后才会有有效的 voted 状态
      await handleUpdateList(true)
    }

    asyncFunc()

    return () => {
      discoverKolStore.reset()
    }
  }, [accountStore.logged])

  return (
    <>
      <div className="d-flex flex-wrap gap-4 align-items-center justify-content-between col">
        <div className='d-flex align-items-center gap-3 col-12 col-sm'>
          <InputSearch
            size='small'
            className='col'
            value={discoverKolStore.searchKolInput}
            placeholder={t('discover.searchKol')}
            onChange={(value) => discoverKolStore.searchKolInput = value}
            onSearch={() => handleSearchByAddress()} />
          {
            discoverKolStore.searchKol
            && <Button type='primary' ghost className='gap-1 fw-bold px-3 br-4' size='small' onClick={handleSearchAddressClear}><IOutlineAdd className='rotate-45' />{t('common.clear')}</Button>
          }
          <DropdownMenu buttonSize='small'
            items={discoverStore.cycles}
            selectedValue={discoverStore.selectedCycleValue}
            onSelect={handleChangeSelectCycle}
            icon={<ICyclical className='w-18' />} />
          <ButtonIcon type='primary' icon={<IOutlineAdd />} logged className='gap-1 fw-bold px-3 br-4'
            onClick={() => discoverKolStore.openAssistTaggingKol = true}>
            <span className='d-none d-sm-block'>{t('discover.taggingKol')}</span>
          </ButtonIcon>
        </div>
      </div>

      <div className='d-flex flex-column gap-2'>

        <Busy spinning={reqStore.discoverKolListBusy}>
          <div className='d-flex flex-column gap-1'>
            {(() => {
              const list: any[] = discoverKolStore.list.length > 0 ? discoverKolStore.list : DISCOVER_MOCK_KOL
              if (list.length === 0) return <ColumnNoData className='bg-gray-alpha-4 br-3 overflow-hidden' message={discoverKolStore.searchKol ? t('message.contentWasNotFound', { content: discoverKolStore.searchKol }) : ''} />

              return (
                <>
                  <div className='d-flex flex-wrap pt-2'>
                    {list.map((item, idx) => (
                      <div key={idx} className='d-flex col-12 col-lg-6 col-xl-4'>
                        <div className='d-flex p-4 br-3 bg-gray-alpha-2 gap-4 mx-1 mb-2 col transition-3 hover-shadow-lg' style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                          <div className='d-flex flex-column col-12 gap-1'>
                            <div className='d-flex'>
                              <div className='d-flex gap-3'>
                                <a href={`https://x.com/${item.xUsername}`} target='_blank' className='linker'>
                                  <Avatar href={item.avatar} name={item.xNickname} size='lg' />
                                </a>
                                <div className='d-flex flex-column pt-1'>
                                  <a href={`https://x.com/${item.xUsername}`} target='_blank' className='d-flex flex-wrap linker-hover'>
                                    <span className='h6 fw-bold me-1'>{item.xNickname}</span>
                                    <span className='color-secondary font-size-12 opacity-60'>@{item.xUsername}</span>
                                  </a>
                                  <PositionItemAddress item={item} className='opacity-60' />
                                </div>
                              </div>
                              <div className='d-flex gap-2 align-items-start justify-content-end ms-auto'>
                                {item.identityType === 1 &&
                                  <ColumnTooltip title={t('discover.communityCertification')}>
                                    <ICommunityCertification />
                                  </ColumnTooltip>
                                }
                                {item.identityType === 2 &&
                                  <ColumnTooltip title={t('discover.officialCertification')}>
                                    <IOfficialCertification />
                                  </ColumnTooltip>}
                                {
                                  [
                                    { icon: <IOutlineChart2 className='zoom-85' />, title: t('common.tradingStatistics'), onClick: () => handleOpenTradingStatistics(item) },
                                    { icon: <IOutlineMonitor className='zoom-85' />, title: t('common.trackAddress'), logged: true, onClick: () => handleOpenCreateTrackAddress(item) },
                                    { icon: <IOutlineShare className='zoom-85' />, title: t('common.copyTrading'), logged: true, onClick: () => handleOpenQuickerCreateCopyTrade(item) },
                                  ].map((btn, bIdx) => <SideButtonIcon key={bIdx} title={btn.title} onClick={btn.onClick} logged={btn.logged} icon={btn.icon} />)
                                }
                              </div>
                            </div>

                            <div className='d-flex flex-wrap mt-2'>
                              {
                                [
                                  { label: t('common.accountTotalValue'), className: 'col-12 mb-2', content: <span className='h4 fw-bold'>$ {formatNumber(item.accountTotalValue)}</span> },
                                  { label: t('common.pnl'), content: <PositionItemCommonPnl value={item.pnl} /> },
                                  { label: t('common.tradesCount'), content: <>{formatNumber(item.tradesCount)}</> },
                                  { label: t('common.winRate'), content: <>{item.tradesCount > 0 || (item.winRate && item.winRate !== '0') ? item.winRate : '-'} %</> },
                                ].map((metric, mIdx) => (
                                  <div key={mIdx} className={`d-flex flex-column  col-4 ${metric.className || ''}`}>
                                    <small className="color-secondary opacity-60 font-size-11 pb-1">{metric.label}</small>
                                    <span className="color-white font-size-13 fw-500">{metric.content}</span>
                                  </div>
                                ))
                              }
                            </div>

                            {item.tags && item.tags.length > 0 && (
                              <div className="d-flex flex-wrap gap-2 pt-2 mt-1">
                                {item.tags.map((tag: string) => (
                                  <span key={tag} className="px-2 py-0 br-1 color-teal font-size-11" style={{ background: 'rgba(0, 181, 173, 0.1)', border: '1px solid rgba(0, 181, 173, 0.2)' }}>
                                    {t(tag)}
                                  </span>
                                ))}
                              </div>
                            )}

                            <span className="d-flex flex-column color-secondary gap-2 pt-2 mt-auto">
                              {
                                item.voted || item.id <= 6 // Mock items are voted
                                  ? <div className='d-flex justify-content-between pt-1'>
                                    <ColumnTooltip title={t('discover.numChoseTrust', { num: item.trustCount })}>
                                      <span className='d-flex gap-2 py-1 color-buy font-size-12'>
                                        {t('discover.trust')}
                                        <span className='fw-600'>{item.trustCountPer}%</span>
                                      </span>
                                    </ColumnTooltip>
                                    <ColumnTooltip title={t('discover.numChoseDoubt', { num: item.doubtCount })}>
                                      <span className='d-flex gap-2 py-1 color-sell font-size-12'>
                                        {t('discover.doubt')}
                                        <span className='fw-600'>{item.doubtCountPer}%</span>
                                      </span>
                                    </ColumnTooltip>
                                  </div>
                                  : <Busy spinning={item.busy}>
                                    <div className='d-flex flex-wrap gap-2 col'>
                                      <SideButtonIcon title={t('discover.numChoseTrust', { num: item.trustCount })} logged onClick={() => handleVote(item, true)} className='d-flex justify-content-center align-items-center gap-2 br-4 col py-1 hover-buy border-buy border-w-2'>
                                        {t('discover.trust')}
                                        <span className='fw-600'>{item.trustCountPer}%</span>
                                      </SideButtonIcon>
                                      <SideButtonIcon title={t('discover.numChoseDoubt', { num: item.doubtCount })} logged onClick={() => handleVote(item, false)} className='d-flex justify-content-center align-items-center gap-2 br-4 col py-1 hover-sell border-sell border-w-2'>
                                        {t('discover.doubt')}
                                        <span className='fw-600'>{item.doubtCountPer}%</span>
                                      </SideButtonIcon>
                                    </div>
                                  </Busy>
                              }
                              <div className='d-flex gap-1 bg-gray-alpha-1 br-4 overflow-hidden mt-1'>
                                {new BN(item.trustCountPer).gt(0) && <Progress rootClassName='position-distribution transition' style={{ width: `${item.trustCountPer}%` }} showInfo={false} percent={100} className='br-l-4 overflow-hidden' size={{ height: 2 }} strokeColor={'#14c362'} />}
                                {new BN(item.doubtCountPer).gt(0) && <Progress rootClassName='position-distribution transition' style={{ width: `${item.doubtCountPer}%` }} showInfo={false} percent={100} className='br-r-4 overflow-hidden' size={{ height: 2 }} strokeColor={'#d01515'} />}
                              </div>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {!discoverKolStore.isEnd && discoverKolStore.list.length > 0
                    ? <Button type='text' className='px-5' size='small' onClick={handleNextPagePush}><span className='color-secondary'>{t('common.loadMore')}</span></Button>
                    : <small className='color-unimportant text-center py-4 w-100 d-block'>{t('common.noMoreResults')}</small>
                  }
                </>
              )
            })()}
          </div>
        </Busy>
      </div>

      <ModalTaggingKOL />
    </>
  )
}

export default DiscoverKOL