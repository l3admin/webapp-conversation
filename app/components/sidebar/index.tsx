import React from 'react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChatBubbleOvalLeftEllipsisIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'
import { ChatBubbleOvalLeftEllipsisIcon as ChatBubbleOvalLeftEllipsisSolidIcon } from '@heroicons/react/24/solid'
import Button from '@/app/components/base/button'
// import Card from './card'
import type { ConversationItem } from '@/types/app'

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}

const MAX_CONVERSATION_LENTH = 20

export interface ISidebarProps {
  copyRight: string
  version?: string
  currentId: string
  onCurrentIdChange: (id: string) => void
  list: ConversationItem[]
}

const Sidebar: FC<ISidebarProps> = ({
  copyRight,
  version,
  currentId,
  onCurrentIdChange,
  list,
}) => {
  const { t } = useTranslation()
  return (
    <div
      className="shrink-0 flex flex-col overflow-y-auto bg-white pc:w-[244px] tablet:w-[192px] mobile:w-[240px] border-r border-gray-200 tablet:h-[calc(100vh_-_3rem)] mobile:h-screen"
    >
      {list.length < MAX_CONVERSATION_LENTH && (
        <div className="flex flex-shrink-0 justify-center px-4 py-3 bg-gray-50">
          <Button
            onClick={() => { onCurrentIdChange('-1') }}
            className="group inline-flex !justify-start !h-9 items-center text-xs font-bold !text-indigo-700 !border-indigo-200 !bg-indigo-50 hover:!bg-indigo-100"
          >
            <PencilSquareIcon className="mr-2 h-4 w-4" /> {t('app.chat.newChat')}
          </Button>
        </div>
      )}

      <nav className="mt-4 flex-1 space-y-1 bg-white p-4 !pt-0">
        {list.map((item) => {
          const isCurrent = item.id === currentId
          const ItemIcon
            = isCurrent ? ChatBubbleOvalLeftEllipsisSolidIcon : ChatBubbleOvalLeftEllipsisIcon
          return (
            <div
              onClick={() => onCurrentIdChange(item.id)}
              key={item.id}
              className={classNames(
                isCurrent
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-700 border border-transparent',
                'group flex items-center rounded-md px-2 py-2 text-xs font-semibold cursor-pointer transition-colors',
              )}
            >
              <ItemIcon
                className={classNames(
                  isCurrent
                    ? 'text-indigo-700'
                    : 'text-gray-400 group-hover:text-gray-500',
                  'mr-3 h-5 w-5 flex-shrink-0',
                )}
                aria-hidden="true"
              />
              {item.name}
            </div>
          )
        })}
      </nav>
      {/* <a className="flex flex-shrink-0 p-4" href="https://langgenius.ai/" target="_blank">
        <Card><div className="flex flex-row items-center"><ChatBubbleOvalLeftEllipsisSolidIcon className="text-primary-600 h-6 w-6 mr-2" /><span>LangGenius</span></div></Card>
      </a> */}
      <div className="flex flex-shrink-0 items-center gap-2 px-4 py-3 bg-gray-50">
        <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wide">© {copyRight} {(new Date()).getFullYear()}</div>
        {version && (
          <span className="ml-auto rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-500">
            v{version}
          </span>
        )}
      </div>
    </div>
  )
}

export default React.memo(Sidebar)
