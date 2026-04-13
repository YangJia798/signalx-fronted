import React from 'react';
import { Drawer, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAccountStore, usePrivateWalletStore } from '@/stores';
import UserAvatar from '@/components/UserAvatar';
import { maskingAddress } from '@/utils';
import { IOutlineLogout, ITelegram, IQuestionCircle } from '@/components/icon';
import BN from 'bignumber.js';
import { formatNumber } from '@/utils';

const RightArrowIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const PlusIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const EmailIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

const WalletIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5"></path>
    <path d="M18 12a1 1 0 100 2 1 1 0 000-2z"></path>
  </svg>
);

const BADGE_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  color: 'rgba(255,255,255,0.6)',
  whiteSpace: 'nowrap',
};

const ACTIVE_ROW_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.05)',
};

const INACTIVE_ROW_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  borderRadius: '12px',
};

import { useNavigate } from 'react-router-dom';

export const AccountProfile = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const accountStore = useAccountStore();
  const privateWalletStore = usePrivateWalletStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const walletList = privateWalletStore.list || [];
  const walletCount = walletList.length;

  let totalBalance = new BN(0);
  let totalMargin = new BN(0);
  let totalUPnl = new BN(0);

  walletList.forEach(wallet => {
    totalBalance = totalBalance.plus(wallet.balance || 0);
    totalMargin = totalMargin.plus(wallet.totalMarginUsed || 0);
    totalUPnl = totalUPnl.plus(wallet.uPnl || 0);
  });

  const handleLogout = () => {
    accountStore.reset();
    onClose();
  };

  return (
    <Drawer
      placement="right"
      closable={false}
      onClose={onClose}
      open={open}
      width={360}
      styles={{
        mask: { backgroundColor: 'rgba(0, 0, 0, 0.45)' },
        body: {
          padding: '24px 16px',
          backgroundColor: '#0f1118',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflowY: 'auto',
        }
      }}
    >
      {/* Top Header / Avatar Area */}
      <div className="d-flex flex-column align-items-center mb-2">
        <div className="mb-3">
          <UserAvatar size={64} />
        </div>
        <h5 className="color-white m-0 fw-bold">
          {accountStore.evmAddress
            ? maskingAddress(accountStore.evmAddress)
            : accountStore.email || accountStore.tgUsername || (accountStore.id && accountStore.id !== -1 ? `ve_${accountStore.id}` : '')}
        </h5>
      </div>

      {/* 免费 (Free Tier) */}
      <div
        className="d-flex justify-content-between align-items-center cursor-pointer"
        style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '12px 16px', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <span className="color-white fw-500 font-size-15">免费</span>
        <RightArrowIcon className="color-secondary" />
      </div>

      {/* 我的钱包 (My Wallet) */}
      <div
        className="d-flex flex-column"
        style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="color-white fw-bold font-size-15">我的钱包({walletCount})</span>
          <RightArrowIcon className="color-secondary" />
        </div>

        <span className="color-secondary font-size-12 mb-1">账户总价值</span>
        <div className="color-white font-size-20 fw-bold mb-3">$ {formatNumber(totalBalance.toFixed(2))}</div>

        <div className="d-flex gap-4 mb-4">
          <div className="d-flex flex-column">
            <span className="color-secondary font-size-12 mb-1">已用保证金</span>
            <span className="color-white font-size-16 fw-bold">$ {formatNumber(totalMargin.toFixed(2))}</span>
          </div>
          <div className="d-flex flex-column">
            <span className="color-secondary font-size-12 mb-1">未实现盈亏</span>
            <span className={`${totalUPnl.gt(0) ? 'color-success' : (totalUPnl.lt(0) ? 'color-danger' : 'color-white')} font-size-16 fw-bold`}>
              {totalUPnl.lt(0) ? '-' : (totalUPnl.gt(0) ? '+' : '')}$ {formatNumber(totalUPnl.absoluteValue().toFixed(2))}
            </span>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button
            className="col"
            style={{ background: 'transparent', border: '1px solid #00e5ff', borderRadius: '24px', color: '#00e5ff', padding: '8px 0', fontWeight: 500, cursor: 'pointer' }}
            onClick={() => {
              navigate('/copy-trading');
              onClose();
            }}
          >
            存款 <RightArrowIcon />
          </button>
          <button
            className="col"
            style={{ background: 'transparent', border: '1px solid #00e5ff', borderRadius: '24px', color: '#00e5ff', padding: '8px 0', fontWeight: 500, cursor: 'pointer' }}
            onClick={() => privateWalletStore.openCreatePrivateWallet = true}
          >
            + 创建钱包
          </button>
        </div>
      </div>

      {/* 账户登录方式 (Login Methods) */}
      <div className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="color-secondary font-size-13">账户登录方式</span>
          <IQuestionCircle className="color-secondary cursor-pointer" style={{ fontSize: '14px' }} />
        </div>

        <div className="d-flex flex-column gap-2">
          {/* Telegram row */}
          <div className="d-flex justify-content-between align-items-center p-3" style={INACTIVE_ROW_STYLE}>
            <div className="d-flex align-items-center gap-2 color-secondary fw-500 font-size-14">
              <ITelegram style={{ fontSize: '18px' }} /> 绑定Telegram 登录
            </div>
            <PlusIcon className="color-secondary cursor-pointer" />
          </div>

          {/* Email row */}
          {accountStore.email ? (
            <div className="d-flex justify-content-between align-items-center p-3" style={ACTIVE_ROW_STYLE}>
              <div className="d-flex align-items-center gap-2 color-white fw-500 font-size-14">
                <EmailIcon className="color-secondary" />
                {accountStore.email}
              </div>
              <div style={BADGE_STYLE}>主账户</div>
            </div>
          ) : (
            <div className="d-flex justify-content-between align-items-center p-3" style={INACTIVE_ROW_STYLE}>
              <div className="d-flex align-items-center gap-2 color-secondary fw-500 font-size-14">
                <EmailIcon />
                绑定邮箱登录
              </div>
              <PlusIcon className="color-secondary cursor-pointer" />
            </div>
          )}

          {/* Wallet row — 已登录显示地址+主账户，未登录显示绑定入口 */}
          {accountStore.evmAddress ? (
            <div className="d-flex justify-content-between align-items-center p-3" style={ACTIVE_ROW_STYLE}>
              <div className="d-flex align-items-center gap-2 color-white fw-500 font-size-14">
                <WalletIcon className="color-secondary" />
                {maskingAddress(accountStore.evmAddress)}
              </div>
              <div style={BADGE_STYLE}>主账户</div>
            </div>
          ) : (
            <div className="d-flex justify-content-between align-items-center p-3" style={INACTIVE_ROW_STYLE}>
              <div className="d-flex align-items-center gap-2 color-secondary fw-500 font-size-14">
                <WalletIcon />
                绑定钱包登录
              </div>
              <PlusIcon className="color-secondary cursor-pointer" />
            </div>
          )}
        </div>
      </div>

      {/* 权益 (Privileges) */}
      <div className="d-flex flex-column">
        <span className="color-secondary font-size-13 mb-2">权益</span>
        <div className="d-flex flex-column" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', overflow: 'hidden' }}>
          {[
            {
              label: '邀请用户',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              )
            },
            {
              label: 'API 密钥',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
              )
            },
            {
              label: '专属会员群',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              )
            },
          ].map((item, idx, arr) => (
            <div
              key={idx}
              className="d-flex justify-content-between align-items-center p-3 cursor-pointer"
              style={{ borderBottom: idx < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
            >
              <div className="d-flex align-items-center gap-2 color-white fw-500 font-size-14">
                <span className="color-secondary">{item.icon}</span>
                {item.label}
              </div>
              <RightArrowIcon className="color-secondary" />
            </div>
          ))}
        </div>
      </div>

      {/* 账户 (Account) */}
      <div className="d-flex flex-column">
        <span className="color-secondary font-size-13 mb-2">账户</span>
        <div className="d-flex flex-column p-3" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
          <span className="color-white fw-bold font-size-14 mb-2">UserId</span>
          <span className="color-white font-size-12" style={{ wordBreak: 'break-all' }}>
            {accountStore.evmAddress || (accountStore.id && accountStore.id !== -1 ? `ve_${accountStore.id}` : '')}
          </span>
        </div>
      </div>

      {/* Footer Log Out */}
      <div
        className="mt-auto pt-4 pb-2 d-flex justify-content-center align-items-center gap-2 cursor-pointer color-white fw-bold"
        onClick={handleLogout}
      >
        <IOutlineLogout style={{ fontSize: '18px' }} /> 登出
      </div>
    </Drawer>
  );
};
