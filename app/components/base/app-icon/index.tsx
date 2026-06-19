import type { FC } from 'react'
import { useState } from 'react'
import classNames from 'classnames'
import style from './style.module.css'

export interface AppIconProps {
  size?: 'xs' | 'tiny' | 'small' | 'medium' | 'large'
  rounded?: boolean
  icon?: string
  background?: string
  className?: string
}

const AppIcon: FC<AppIconProps> = ({
  size = 'medium',
  rounded = false,
  background,
  className,
  icon = '/Parzley_logo.png',
}) => {
  const [hasImageError, setHasImageError] = useState(false)

  return (
    <span
      className={classNames(
        style.appIcon,
        size !== 'medium' && style[size],
        rounded && style.rounded,
        className ?? '',
      )}
      style={{
        background,
      }}
    >
      {!hasImageError
        ? (
          <img
            src={icon}
            alt="Parzley"
            className={style.logo}
            onError={() => setHasImageError(true)}
          />
        )
        : <span className={style.fallback}>PZ</span>}
    </span>
  )
}

export default AppIcon
