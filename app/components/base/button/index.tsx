import type { FC, MouseEventHandler } from 'react'
import React from 'react'
import Spinner from '@/app/components/base/spinner'

export interface IButtonProps {
  type?: string
  className?: string
  disabled?: boolean
  loading?: boolean
  children: React.ReactNode
  onClick?: MouseEventHandler<HTMLDivElement>
}

const Button: FC<IButtonProps> = ({
  type,
  disabled,
  children,
  className,
  onClick,
  loading = false,
}) => {
  let style = 'cursor-pointer'
  switch (type) {
    case 'link':
      style = disabled
        ? 'border border-slate-200 bg-slate-100 cursor-not-allowed text-slate-400'
        : 'border border-indigo-200 cursor-pointer text-indigo-700 bg-white hover:bg-indigo-50 hover:border-indigo-300'
      break
    case 'primary':
      style = (disabled || loading)
        ? 'border border-slate-200 bg-slate-100 cursor-not-allowed text-slate-400'
        : 'border border-transparent bg-indigo-600 hover:bg-indigo-700 cursor-pointer text-white'
      break
    default:
      style = disabled
        ? 'border border-slate-200 bg-slate-100 cursor-not-allowed text-slate-400'
        : 'border border-gray-200 cursor-pointer text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300'
      break
  }

  return (
    <div
      className={`flex justify-center items-center content-center h-9 leading-5 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${style} ${className && className}`}
      onClick={disabled ? undefined : onClick}
    >
      {children}
      {/* Spinner is hidden when loading is false */}
      <Spinner loading={loading} className='!text-white !h-3 !w-3 !border-2 !ml-1' />
    </div>
  )
}

export default React.memo(Button)
