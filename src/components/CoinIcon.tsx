import React, { HTMLProps, useState, useEffect } from 'react'
import { TAvatarSize } from '@/stores'
import './CoinIcon.scss'

const parseCoinId = (id: string) => id.includes(':') ? id.split(':')[1] : id

const handleIconPath = (id: string) => {
  return `/coin/32@2x/color/${parseCoinId(id).toLowerCase()}@2x.png`
}

type TCoinId = string
interface TCoinIconProps extends Omit<HTMLProps<HTMLDivElement>, 'size'> {
  id: TCoinId
  size?: TAvatarSize
  className?: string
  fallback?: React.ReactNode
}

const CoinIcon: React.FC<TCoinIconProps> = ({ 
  id, 
  size = 'md', 
  className = '',
  fallback = null,
  ...rest
}) => {
  const [iconSrc, setIconSrc] = useState<string>(handleIconPath(id))
  const [error, setError] = useState<boolean>(false)

  // 处理图片加载错误
  const handleError = () => {
    // console.warn(`Coin icon not found: ${id}`)
    setError(true)
  }

  useEffect(() => {
    setError(false)
    setIconSrc(handleIconPath(id))
  }, [id])

  return (
    <span className={`d-flex avatar flex-shrink-0 ${size} ${className}`} {...rest}>
      { !error
          ? <img src={iconSrc} alt={id} onError={handleError} />
          : fallback || <div className="coin-icon-fallback">{parseCoinId(id).slice(0, 3).toUpperCase()}</div>
      }
    </span>
  )
}

export default CoinIcon