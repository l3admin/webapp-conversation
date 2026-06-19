'use client'
import type { FC, ReactNode } from 'react'
import React from 'react'
import cn from 'classnames'
import { useTranslation } from 'react-i18next'
import { StarIcon } from '@/app/components/welcome/massive-component'
import Button from '@/app/components/base/button'

export interface ITemplateVarPanelProps {
  className?: string
  header: ReactNode
  children?: ReactNode | null
  isFold: boolean
}

const TemplateVarPanel: FC<ITemplateVarPanelProps> = ({
  className,
  header,
  children,
  isFold,
}) => {
  return (
    <div className={cn('border border-indigo-100 rounded-xl', className)}>
      {/* header */}
      <div
        className={cn(isFold && 'rounded-b-xl', 'rounded-t-xl px-6 py-4 bg-indigo-50 text-xs')}
      >
        {header}
      </div>
      {/* body */}
      {!isFold && children && (
        <div className='rounded-b-xl p-6'>
          {children}
        </div>
      )}
    </div>
  )
}

export const PanelTitle: FC<{ title: string, className?: string }> = ({
  title,
  className,
}) => {
  return (
    <div className={cn(className, 'flex items-center space-x-1 text-indigo-600')}>
      <StarIcon />
      <span className='text-xs'>{title}</span>
    </div>
  )
}

export const VarOpBtnGroup: FC<{ className?: string, onConfirm: () => void, onCancel: () => void }> = ({
  className,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation()

  return (
    <div className={cn(className, 'flex mt-3 space-x-2 mobile:ml-0 tablet:ml-[128px] text-xs')}>
      <Button
        className='text-xs font-semibold'
        type='primary'
        onClick={onConfirm}
      >
        {t('common.operation.save')}
      </Button>
      <Button
        className='text-xs font-semibold'
        onClick={onCancel}
      >
        {t('common.operation.cancel')}
      </Button>
    </div >
  )
}

export default React.memo(TemplateVarPanel)
