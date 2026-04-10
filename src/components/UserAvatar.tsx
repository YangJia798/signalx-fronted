import React, { useMemo } from 'react'
import { blo } from 'blo'
import { useAccountStore } from '@/stores'

/**
 * 根据任意字符串生成确定性的渐变头像
 * 无论钱包登录、邮箱登录还是TG登录，都能自动生成唯一头像
 */

// 简单的字符串哈希函数
const hashString = (str: string): number => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0 // 转为32位整数
  }
  return Math.abs(hash)
}

// 根据哈希值生成 HSL 颜色
const generateColors = (seed: string): [string, string, string] => {
  const hash = hashString(seed)
  const h1 = hash % 360
  const h2 = (h1 + 40 + (hash % 80)) % 360
  const h3 = (h2 + 40 + ((hash >> 8) % 80)) % 360
  return [
    `hsl(${h1}, 70%, 55%)`,
    `hsl(${h2}, 65%, 50%)`,
    `hsl(${h3}, 75%, 45%)`
  ]
}

// 生成用户首字母
const getInitial = (identifier: string): string => {
  if (!identifier) return '?'
  // 邮箱取 @ 前的首字母
  if (identifier.includes('@')) {
    return identifier.split('@')[0].charAt(0).toUpperCase()
  }
  // 地址取前两位（去掉 0x）
  if (identifier.startsWith('0x')) {
    return identifier.slice(2, 4).toUpperCase()
  }
  // 其他取首字母
  return identifier.charAt(0).toUpperCase()
}

interface UserAvatarProps {
  size?: number
  className?: string
}

/**
 * 通用用户头像组件
 * - 钱包登录：使用 blo 生成 blockie 头像
 * - 邮箱/TG/其他登录：使用确定性渐变 + 首字母头像
 * - 有 TG 头像图片时，优先使用真实头像
 */
const UserAvatar: React.FC<UserAvatarProps> = ({ size = 32, className = '' }) => {
  const accountStore = useAccountStore()

  const avatarContent = useMemo(() => {
    // 1. 有 EVM 地址 → 使用 blo 生成 blockie
    if (accountStore.evmAddress) {
      return {
        type: 'blockie' as const,
        src: blo(accountStore.evmAddress as `0x${string}`, size),
        alt: accountStore.evmAddress
      }
    }

    // 2. 有 TG 头像 → 使用真实头像
    if (accountStore.tgHeadIco) {
      return {
        type: 'image' as const,
        src: accountStore.tgHeadIco,
        alt: accountStore.tgUsername || accountStore.tgLastName || 'user'
      }
    }

    // 3. 其他情况 → 生成渐变头像
    const identifier = accountStore.email
      || accountStore.tgUsername
      || accountStore.tgLastName
      || (accountStore.id !== -1 ? String(accountStore.id) : '')
      || 'user'

    const [c1, c2, c3] = generateColors(identifier)
    const initial = getInitial(identifier)

    return {
      type: 'generated' as const,
      colors: [c1, c2, c3],
      initial,
      identifier
    }
  }, [
    accountStore.evmAddress,
    accountStore.tgHeadIco,
    accountStore.email,
    accountStore.tgUsername,
    accountStore.tgLastName,
    accountStore.id
  ])

  const borderRadius = '50%'

  if (avatarContent.type === 'blockie') {
    return (
      <div className={`d-flex flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
        <img
          src={avatarContent.src}
          alt={avatarContent.alt}
          width={size}
          height={size}
          style={{ borderRadius, display: 'block' }}
        />
      </div>
    )
  }

  if (avatarContent.type === 'image') {
    return (
      <div className={`d-flex flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
        <img
          src={avatarContent.src}
          alt={avatarContent.alt}
          width={size}
          height={size}
          style={{ borderRadius, display: 'block', objectFit: 'cover' }}
          onError={(e) => {
            // 图片加载失败时回退到渐变头像
            const target = e.currentTarget
            target.style.display = 'none'
            const parent = target.parentElement
            if (parent) {
              const fallback = document.createElement('div')
              const identifier = avatarContent.alt || 'user'
              const [c1, c2] = generateColors(identifier)
              const initial = getInitial(identifier)
              fallback.style.cssText = `
                width: ${size}px; height: ${size}px; border-radius: 50%;
                background: linear-gradient(135deg, ${c1}, ${c2});
                display: flex; align-items: center; justify-content: center;
                color: white; font-weight: 700; font-size: ${Math.max(size * 0.4, 12)}px;
                user-select: none;
              `
              fallback.textContent = initial
              parent.appendChild(fallback)
            }
          }}
        />
      </div>
    )
  }

  // 渐变头像
  const { colors, initial } = avatarContent
  const fontSize = Math.max(size * 0.4, 12)

  return (
    <div
      className={`d-flex flex-shrink-0 align-items-center justify-content-center ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius,
        background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`,
        color: '#fff',
        fontWeight: 700,
        fontSize: `${fontSize}px`,
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  )
}

export default UserAvatar
