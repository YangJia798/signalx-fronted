import React from 'react';

const WalletProviderIcon = ({ platform, className = '' }: { platform: string, className?: string }) => {
  if (platform === 'aster') {
    return (
      <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0ZM12 3C12 7.97 16.03 12 21 12C16.03 12 12 16.03 12 21C12 16.03 7.97 12 3 12C7.97 12 12 7.97 12 3Z" fill="#ffc89a"/>
      </svg>
    );
  }

  // Default to hyperliquid
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 8A4 4 0 0 0 4 16C7.5 16 9.5 13.5 12 13.5C14.5 13.5 16.5 16 20 16A4 4 0 0 0 20 8C16.5 8 14.5 10.5 12 10.5C9.5 10.5 7.5 8 4 8Z" fill="#38d1b3"/>
    </svg>
  );
};

export default WalletProviderIcon;
