'use client'
import type { FC } from 'react'
import React, { useEffect, useRef } from 'react'
import cn from 'classnames'
import { Mic, MicOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Textarea from 'rc-textarea'
import s from './style.module.css'
import Answer from './answer'
import Question from './question'
import type { FeedbackFunc } from './type'
import type { ChatItem, VisionFile, VisionSettings } from '@/types/app'
import { TransferMethod } from '@/types/app'
import Tooltip from '@/app/components/base/tooltip'
import Toast from '@/app/components/base/toast'
import ChatImageUploader from '@/app/components/base/image-uploader/chat-image-uploader'
import ImageList from '@/app/components/base/image-uploader/image-list'
import { useImageFiles } from '@/app/components/base/image-uploader/hooks'
import FileUploaderInAttachmentWrapper from '@/app/components/base/file-uploader-in-attachment'
import type { FileEntity, FileUpload } from '@/app/components/base/file-uploader-in-attachment/types'
import { getProcessedFiles } from '@/app/components/base/file-uploader-in-attachment/utils'

export interface IChatProps {
  chatList: ChatItem[]
  /**
   * Whether to display the editing area and rating status
   */
  feedbackDisabled?: boolean
  /**
   * Whether to display the input area
   */
  isHideSendInput?: boolean
  onFeedback?: FeedbackFunc
  checkCanSend?: () => boolean
  onSend?: (message: string, files: VisionFile[]) => void
  useCurrentUserAvatar?: boolean
  userInitials?: string
  isResponding?: boolean
  controlClearQuery?: number
  visionConfig?: VisionSettings
  fileConfig?: FileUpload
}

const Chat: FC<IChatProps> = ({
  chatList,
  feedbackDisabled = false,
  isHideSendInput = false,
  onFeedback,
  checkCanSend,
  onSend = () => { },
  useCurrentUserAvatar,
  userInitials = 'U',
  isResponding,
  controlClearQuery,
  visionConfig,
  fileConfig,
}) => {
  const { t } = useTranslation()
  const { notify } = Toast
  const isUseInputMethod = useRef(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const baseQueryRef = useRef('')

  const [query, setQuery] = React.useState('')
  const queryRef = useRef('')
  const [isListening, setIsListening] = React.useState(false)
  const [isSpeechSupported, setIsSpeechSupported] = React.useState(false)

  const handleContentChange = (e: any) => {
    const value = e.target.value
    setQuery(value)
    queryRef.current = value
  }

  const logError = (message: string) => {
    notify({ type: 'error', message, duration: 3000 })
  }

  const valid = () => {
    const query = queryRef.current
    if (!query || query.trim() === '') {
      logError(t('app.errorMessage.valueOfVarRequired'))
      return false
    }
    return true
  }

  useEffect(() => {
    if (controlClearQuery) {
      setQuery('')
      queryRef.current = ''
    }
  }, [controlClearQuery])

  useEffect(() => {
    if (typeof window === 'undefined')
      return

    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionCtor)
      return

    const recognition: SpeechRecognition = new SpeechRecognitionCtor()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = true

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => {
      setIsListening(false)
      notify({ type: 'error', message: 'Speech recognition failed. Please check microphone permissions and try again.' })
    }
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcripts = Array.from(event.results).map(result => result[0]?.transcript || '')
      const combined = transcripts.join(' ').trim()
      const nextValue = [baseQueryRef.current, combined].filter(Boolean).join(baseQueryRef.current ? ' ' : '')
      setQuery(nextValue)
      queryRef.current = nextValue
    }

    recognitionRef.current = recognition
    setIsSpeechSupported(true)

    return () => {
      recognition.onstart = null
      recognition.onend = null
      recognition.onerror = null
      recognition.onresult = null
      recognition.stop()
      recognitionRef.current = null
    }
  }, [])
  const {
    files,
    onUpload,
    onRemove,
    onReUpload,
    onImageLinkLoadError,
    onImageLinkLoadSuccess,
    onClear,
  } = useImageFiles()

  const [attachmentFiles, setAttachmentFiles] = React.useState<FileEntity[]>([])

  const handleSend = () => {
    if (!valid() || (checkCanSend && !checkCanSend())) { return }
    const hasPendingImageUploads = files.some(file => file.progress !== -1 && file.progress < 100)
    const hasPendingAttachmentUploads = attachmentFiles.some(file => file.progress !== -1 && file.progress < 100)
    if (hasPendingImageUploads || hasPendingAttachmentUploads) {
      logError(t('app.errorMessage.waitForFileUpload'))
      return
    }
    const imageFiles: VisionFile[] = files.filter(file => file.progress !== -1).map(fileItem => ({
      type: 'image',
      transfer_method: fileItem.type,
      url: fileItem.url,
      upload_file_id: fileItem.fileId,
    }))
    const docAndOtherFiles: VisionFile[] = getProcessedFiles(attachmentFiles)
    const combinedFiles: VisionFile[] = [...imageFiles, ...docAndOtherFiles]
    onSend(queryRef.current, combinedFiles)
    if (!files.find(item => item.type === TransferMethod.local_file && !item.fileId)) {
      if (files.length) { onClear() }
      if (!isResponding) {
        setQuery('')
        queryRef.current = ''
      }
    }
    if (!attachmentFiles.find(item => item.transferMethod === TransferMethod.local_file && !item.uploadedId)) { setAttachmentFiles([]) }
  }

  const handleKeyUp = (e: any) => {
    if (e.code === 'Enter') {
      e.preventDefault()
      // prevent send message when using input method enter
      if (!e.shiftKey && !isUseInputMethod.current) { handleSend() }
    }
  }

  const handleKeyDown = (e: any) => {
    isUseInputMethod.current = e.nativeEvent.isComposing
    if (e.code === 'Enter' && !e.shiftKey) {
      const result = query.replace(/\n$/, '')
      setQuery(result)
      queryRef.current = result
      e.preventDefault()
    }
  }

  const suggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    queryRef.current = suggestion
    handleSend()
  }

  const toggleSpeechInput = () => {
    if (!isSpeechSupported || !recognitionRef.current) {
      notify({ type: 'error', message: 'Speech-to-text is not supported in this browser.' })
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      return
    }

    baseQueryRef.current = queryRef.current.trim()
    recognitionRef.current.start()
  }

  return (
    <div className={cn(!feedbackDisabled && 'px-3.5', 'h-full')}>
      {/* Chat List */}
      <div className="min-h-full space-y-[30px] pb-[180px]">
        {chatList.map((item) => {
          if (item.isAnswer) {
            const isLast = item.id === chatList[chatList.length - 1].id
            return <Answer
              key={item.id}
              item={item}
              feedbackDisabled={feedbackDisabled}
              onFeedback={onFeedback}
              isResponding={isResponding && isLast}
              suggestionClick={suggestionClick}
            />
          }
          return (
            <Question
              key={item.id}
              id={item.id}
              content={item.content}
              useCurrentUserAvatar={useCurrentUserAvatar}
              userInitials={userInitials}
              imgSrcs={(item.message_files && item.message_files?.length > 0) ? item.message_files.map(item => item.url) : []}
            />
          )
        })}
      </div>
      {
        !isHideSendInput && (
          <div className='fixed z-10 bottom-0 right-0 pc:left-[244px] tablet:left-[192px] mobile:left-0 px-3.5 pb-3'>
            <div className='w-[90%] mx-auto rounded-xl border border-gray-200 bg-gray-50 p-2'>
              <div className='flex items-center gap-2'>
                <div className='relative flex-1 max-h-[150px] overflow-y-auto rounded-lg border border-gray-200 bg-white p-[5.5px]'>
                  {
                    visionConfig?.enabled && (
                      <>
                        <div className='absolute bottom-2 left-2 flex items-center'>
                          <ChatImageUploader
                            settings={visionConfig}
                            onUpload={onUpload}
                            disabled={files.length >= visionConfig.number_limits}
                          />
                          <div className='mx-1 w-[1px] h-4 bg-black/5' />
                        </div>
                        <div className='pl-[52px]'>
                          <ImageList
                            list={files}
                            onRemove={onRemove}
                            onReUpload={onReUpload}
                            onImageLinkLoadSuccess={onImageLinkLoadSuccess}
                            onImageLinkLoadError={onImageLinkLoadError}
                          />
                        </div>
                      </>
                    )
                  }
                  {
                    fileConfig?.enabled && (
                      <div className={`${visionConfig?.enabled ? 'pl-[52px]' : ''} mb-1`}>
                        <FileUploaderInAttachmentWrapper
                          fileConfig={fileConfig}
                          value={attachmentFiles}
                          onChange={setAttachmentFiles}
                        />
                      </div>
                    )
                  }
                  <Textarea
                    className={`
                      block w-full px-2 py-[7px] leading-5 max-h-none text-base text-gray-700 outline-none appearance-none resize-none
                      ${visionConfig?.enabled ? 'pl-12' : ''}
                    `}
                    value={query}
                    onChange={handleContentChange}
                    onKeyUp={handleKeyUp}
                    onKeyDown={handleKeyDown}
                    autoSize
                  />
                </div>
                <div className='flex shrink-0 items-center gap-2 self-center pr-1'>
                  {query.trim().length > 0 && <div className={`${s.count} h-5 leading-5 text-sm bg-white text-gray-500 px-2 rounded`}>{query.trim().length}</div>}
                  <Tooltip
                    selector='mic-tip'
                    htmlContent={<div>{isListening ? 'Stop voice input' : 'Start voice input'}</div>}
                  >
                    <button
                      type='button'
                      onClick={toggleSpeechInput}
                      className={`h-8 w-8 rounded-md border transition-colors flex items-center justify-center ${
                        isListening
                          ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                      }`}
                    >
                      {isListening ? <MicOff className='h-4 w-4' strokeWidth={2} /> : <Mic className='h-4 w-4' strokeWidth={2} />}
                    </button>
                  </Tooltip>
                  <Tooltip
                    selector='send-tip'
                    htmlContent={
                      <div>
                        <div>{t('common.operation.send')} Enter</div>
                        <div>{t('common.operation.lineBreak')} Shift Enter</div>
                      </div>
                    }
                  >
                    <div className={`${s.sendBtn} w-8 h-8 cursor-pointer rounded-md`} onClick={handleSend}></div>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div>
  )
}

export default React.memo(Chat)
