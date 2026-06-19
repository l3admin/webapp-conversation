'use client'
import type { FC } from 'react'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import cn from 'classnames'
import type { ToolInfoInThought } from '../type'
import Panel from './panel'
import Loading02 from '@/app/components/base/icons/line/loading-02'
import ChevronDown from '@/app/components/base/icons/line/arrows/chevron-down'
import CheckCircle from '@/app/components/base/icons/solid/general/check-circle'
import DataSetIcon from '@/app/components/base/icons/public/data-set'
import type { Emoji } from '@/types/tools'
import AppIcon from '@/app/components/base/app-icon'

interface Props {
  payload: ToolInfoInThought
  allToolIcons?: Record<string, string | Emoji>
}

const getIcon = (toolName: string, allToolIcons: Record<string, string | Emoji>) => {
  if (isDatasetTool(toolName)) { return <DataSetIcon className='shrink-0'></DataSetIcon> }
  const icon = allToolIcons[toolName]
  if (!icon) { return null }
  return (
    typeof icon === 'string'
      ? (
        <div
          className='w-3 h-3 bg-cover bg-center rounded-[3px] shrink-0'
          style={{
            backgroundImage: `url(${icon})`,
          }}
        ></div>
      )
      : (
        <AppIcon
          className='rounded-[3px] shrink-0'
          size='xs'
          icon={icon?.content}
          background={icon?.background}
        />
      ))
}

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const isDatasetTool = (toolName: string) => {
  return /^dataset[-_]/i.test(toolName)
}

const tryParseJson = (value: string): unknown => {
  try {
    return JSON.parse(value)
  }
  catch {
    return null
  }
}

const findFirstStringByKeys = (value: unknown, keys: string[]): string | null => {
  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = findFirstStringByKeys(item, keys)
      if (nested) {
        return nested
      }
    }
    return null
  }

  if (!isObject(value)) {
    return null
  }

  for (const key of keys) {
    const candidate = value[key]
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }
  }

  for (const nestedValue of Object.values(value)) {
    const nested = findFirstStringByKeys(nestedValue, keys)
    if (nested) {
      return nested
    }
  }

  return null
}

const resolveDatasetTitle = (name: string, input: string, output: string): string | null => {
  if (!isDatasetTool(name)) {
    return null
  }

  const searchable = [tryParseJson(input), tryParseJson(output)]
  for (const payload of searchable) {
    const datasetTitle = findFirstStringByKeys(payload, [
      'dataset_name',
      'dataset_title',
      'knowledge_name',
      'knowledge_title',
      'title',
      'name',
    ])
    if (datasetTitle) {
      return datasetTitle
    }
  }

  return null
}

const Tool: FC<Props> = ({
  payload,
  allToolIcons = {},
}) => {
  const { t } = useTranslation()
  const { name, input, isFinished, output } = payload
  const datasetTitle = resolveDatasetTitle(name, input, output)
  const toolName = datasetTitle || name
  const [isShowDetail, setIsShowDetail] = useState(false)
  const icon = getIcon(name, allToolIcons) as any
  return (
    <div>
      <div className={cn(!isShowDetail && 'shadow-sm', !isShowDetail && 'inline-block', 'max-w-full overflow-x-auto bg-white rounded-md')}>
        <div
          className={cn('flex items-center h-7 px-2 cursor-pointer')}
          onClick={() => setIsShowDetail(!isShowDetail)}
        >
          {!isFinished && (
            <Loading02 className='w-3 h-3 text-gray-500 animate-spin shrink-0' />
          )}
          {isFinished && !isShowDetail && (
            <CheckCircle className='w-3 h-3 text-[#12B76A] shrink-0' />
          )}
          {isFinished && isShowDetail && (
            icon
          )}
          <span className='mx-1 text-xs font-medium text-gray-500 shrink-0'>
            {t(`tools.thought.${isFinished ? 'used' : 'using'}`)}
          </span>
          <span
            className='text-xs font-medium text-gray-700 truncate'
            title={toolName}
          >
            {toolName}
          </span>
          <ChevronDown
            className={cn(isShowDetail && 'rotate-180', 'ml-1 w-3 h-3 text-gray-500 select-none cursor-pointer shrink-0')}
          />
        </div>
        {isShowDetail && (
          <div className='border-t border-black/5 p-2 space-y-2 '>
            <Panel
              isRequest={true}
              toolName={toolName}
              content={input}
            />
            {output && (
              <Panel
                isRequest={false}
                toolName={toolName}
                content={output as string}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
export default React.memo(Tool)
