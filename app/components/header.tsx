import type { FC } from 'react'
import React from 'react'
import {
  Bars3Icon,
  PencilSquareIcon,
} from '@heroicons/react/24/solid'
import { Atom, Bot, Brain, Cpu, FlaskConical, Settings, Sparkles } from 'lucide-react'
import type { AgentItem } from '@/types/app'
export interface IHeaderProps {
  isMobile?: boolean
  onShowSideBar?: () => void
  onCreateNewChat?: () => void
  agents?: AgentItem[]
  activeAgentId?: string
  onAgentChange?: (agentId: string) => void
  disableAgentSwitch?: boolean
  viewerInitials?: string
  onOpenProfile?: () => void
  technicalInfo?: {
    active_agent_id: string
    dify_base_url: string
  } | null
}
const Header: FC<IHeaderProps> = ({
  isMobile,
  onShowSideBar,
  onCreateNewChat,
  agents = [],
  activeAgentId,
  onAgentChange,
  disableAgentSwitch = false,
  viewerInitials = 'U',
  onOpenProfile,
  technicalInfo,
}) => {
  const agentIcons = [Bot, Brain, Sparkles, Atom, Cpu, FlaskConical]
  const getAgentIcon = (index: number) => {
    return agentIcons[index % agentIcons.length]
  }

  return (
    <div className="shrink-0 flex items-center justify-between h-12 px-3 border-b border-gray-200 bg-white">
      <div className='flex items-center justify-start h-9 min-w-9'>
        {isMobile
          ? (
            <div
              className='flex items-center justify-center h-8 w-8 cursor-pointer'
              onClick={() => onShowSideBar?.()}
            >
              <Bars3Icon className="h-4 w-4 text-gray-500" />
            </div>
          )
          : <img src='/Parzley_logo.png' alt='Parzley' className='h-6 w-auto object-contain' />}
      </div>
      <div className='min-w-0 flex-1 pl-2 flex justify-end items-center gap-2'>
        {agents.length > 0 && (
          <nav
            aria-label='Agent selector'
            className='flex max-w-full items-center gap-1 overflow-x-auto pr-2'
          >
            {agents.map((agent, index) => {
              const isActive = agent.id === activeAgentId
              const AgentIcon = getAgentIcon(index)
              const buttonLabel = agent.button_label || agent.name
              return (
                <button
                  key={agent.id}
                  type='button'
                  aria-pressed={isActive}
                  title={agent.name}
                  onClick={() => onAgentChange?.(agent.id)}
                  disabled={disableAgentSwitch}
                  className={`h-7 shrink-0 rounded-md px-2 text-xs font-semibold transition-colors ${
                    isActive ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-gray-600 hover:bg-gray-100 hover:text-indigo-700 border border-transparent'
                  } disabled:opacity-50`}
                >
                  <span className='flex items-center gap-1.5'>
                    <AgentIcon className='h-3.5 w-3.5' strokeWidth={2} />
                    <span className='block max-w-[140px] truncate whitespace-nowrap'>
                      {buttonLabel}
                    </span>
                  </span>
                </button>
              )
            })}
          </nav>
        )}
        {technicalInfo && (
          <div className='hidden lg:flex items-center gap-1 text-[10px] text-gray-500 font-mono'>
            <span className='rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5'>
              agent_id={technicalInfo.active_agent_id || '-'}
            </span>
            <span className='rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 max-w-[320px] truncate' title={technicalInfo.dify_base_url}>
              base_url={technicalInfo.dify_base_url || '-'}
            </span>
          </div>
        )}
      </div>
      {isMobile
        ? (
          <div className='flex items-center justify-center h-8 w-8 cursor-pointer' onClick={() => onCreateNewChat?.()} >
            <PencilSquareIcon className="h-4 w-4 text-gray-500" />
          </div>)
        : (
          <button
            type='button'
            onClick={onOpenProfile}
            className='ml-2 h-7 min-w-7 px-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center gap-1'
          >
            <span className='h-[18px] w-[18px] rounded-full bg-indigo-700 text-white text-[10px] font-bold leading-[18px] text-center'>{viewerInitials.charAt(0).toUpperCase()}</span>
            <Settings className='h-3.5 w-3.5' strokeWidth={2} />
          </button>
        )}
    </div>
  )
}

export default React.memo(Header)
