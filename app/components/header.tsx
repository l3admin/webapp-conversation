import type { FC } from 'react'
import React from 'react'
import {
  Bars3Icon,
  PencilSquareIcon,
} from '@heroicons/react/24/solid'
import AppIcon from '@/app/components/base/app-icon'
import type { AgentItem } from '@/types/app'
export interface IHeaderProps {
  title: string
  isMobile?: boolean
  onShowSideBar?: () => void
  onCreateNewChat?: () => void
  agents?: AgentItem[]
  activeAgentId?: string
  onAgentChange?: (agentId: string) => void
  disableAgentSwitch?: boolean
}
const Header: FC<IHeaderProps> = ({
  title,
  isMobile,
  onShowSideBar,
  onCreateNewChat,
  agents = [],
  activeAgentId,
  onAgentChange,
  disableAgentSwitch = false,
}) => {
  return (
    <div className="shrink-0 flex items-center justify-between h-12 px-3 bg-gray-100">
      {isMobile
        ? (
          <div
            className='flex items-center justify-center h-8 w-8 cursor-pointer'
            onClick={() => onShowSideBar?.()}
          >
            <Bars3Icon className="h-4 w-4 text-gray-500" />
          </div>
        )
        : <div></div>}
      <div className='flex items-center space-x-2'>
        <AppIcon size="small" />
        <div className=" text-sm text-gray-800 font-bold">{title}</div>
        {agents.length > 0 && (
          <select
            value={activeAgentId}
            onChange={e => onAgentChange?.(e.target.value)}
            disabled={disableAgentSwitch}
            className='h-8 rounded border border-gray-300 bg-white px-2 text-xs text-gray-700 disabled:opacity-50'
          >
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>{agent.name}</option>
            ))}
          </select>
        )}
      </div>
      {isMobile
        ? (
          <div className='flex items-center justify-center h-8 w-8 cursor-pointer' onClick={() => onCreateNewChat?.()} >
            <PencilSquareIcon className="h-4 w-4 text-gray-500" />
          </div>)
        : <div></div>}
    </div>
  )
}

export default React.memo(Header)
