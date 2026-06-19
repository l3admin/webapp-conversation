'use client'
import type { FC } from 'react'
import React from 'react'
import cn from 'classnames'
import { useTranslation } from 'react-i18next'
import { MessageCircleMore, PenLine, Sparkles } from 'lucide-react'
import s from './style.module.css'
import type { AppInfo } from '@/types/app'
import Button from '@/app/components/base/button'

export const AppInfoComp: FC<{ siteInfo: AppInfo, agentName?: string, agentDescription?: string | null }> = ({ siteInfo, agentName, agentDescription }) => {
  const displayTitle = agentName || siteInfo.title
  const displayDescription = agentDescription || siteInfo.description
  return (
    <div>
      <div className='flex items-center gap-2 py-2 text-2xl font-black tracking-tight text-gray-900 rounded-md'>
        <Sparkles className='h-5 w-5 text-indigo-600' strokeWidth={2} />
        <span>Welcome to {displayTitle}</span>
      </div>
      <p className='text-sm font-medium leading-relaxed text-gray-700'>{displayDescription}</p>
    </div>
  )
}

export const PromptTemplate: FC<{ html: string }> = ({ html }) => {
  return (
    <div
      className={'box-border text-sm font-medium text-gray-700 leading-relaxed'}
      dangerouslySetInnerHTML={{ __html: html }}
    ></div>
  )
}

export const StarIcon = () => <Sparkles className='h-3.5 w-3.5' strokeWidth={2} />

export const ChatBtn: FC<{ onClick: () => void, className?: string }> = ({
  className,
  onClick,
}) => {
  const { t } = useTranslation()
  return (
    <Button
      type='primary'
      className={cn(className, `space-x-2 flex items-center ${s.customBtn}`)}
      onClick={onClick}
    >
      <MessageCircleMore className='h-4 w-4' strokeWidth={2} />
      {t('app.chat.startChat')}
    </Button>
  )
}

export const EditBtn = ({ className, onClick }: { className?: string, onClick: () => void }) => {
  const { t } = useTranslation()

  return (
    <div
      className={cn('px-2 py-1 flex space-x-1 items-center rounded-md border border-indigo-100 bg-indigo-50 text-indigo-700 cursor-pointer hover:bg-indigo-100 transition-colors', className)}
      onClick={onClick}
    >
      <PenLine className='w-3 h-3' strokeWidth={2} />
      <span>{t('common.operation.edit')}</span>
    </div>
  )
}
