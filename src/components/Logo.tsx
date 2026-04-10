import React, { HTMLProps } from 'react'
import { Link } from "react-router-dom"


type SizeType = 'small' | 'middle' | 'large';
interface LogoProps extends Omit<HTMLProps<HTMLDivElement>, 'size'> {
  size?: SizeType
  mark?: boolean
}

const Logo: React.FC<LogoProps> = ({ size = 'middle', className = '' }) => {
  const SIZES: Record<SizeType, { height: number }> = {
    small: { height: 32 },
    middle: { height: 40 },
    large: { height: 120 }
  }
  const norm = SIZES[size]

  return (
    <Link to='/' className={`d-flex align-items-center linker flex-shrink-0 logo-custom gap-2 ${className}`}>
      <img src="https://hyperbot.network/assets/mark-white-BnzEC8cz.png" height="32" alt="Signalxbot Logo" />
      {size !== 'large' && (
        <span
          className="fw-bold font-size-22"
          style={{
            color: 'rgba(222, 250, 246, 0.8)',
            letterSpacing: '0.2px',
            fontFamily: "'Outfit', 'Inter', sans-serif"
          }}
        >
          Signalxbot
        </span>
      )}
    </Link>
  );
}

export default Logo