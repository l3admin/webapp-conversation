'use client'
import type { FC } from 'react'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import produce, { setAutoFreeze } from 'immer'
import { useBoolean, useGetState } from 'ahooks'
import { createBrowserClient } from '@supabase/ssr'
import useConversation from '@/hooks/use-conversation'
import Toast from '@/app/components/base/toast'
import Sidebar from '@/app/components/sidebar'
import ConfigSence from '@/app/components/config-scence'
import Header from '@/app/components/header'
import { fetchAgents, fetchAppParams, fetchChatList, fetchConversations, fetchProfile, generationConversationName, sendChatMessage, updateFeedback, updateMyPassword, updateProfile } from '@/service'
import type { AgentItem, ChatItem, ConversationItem, Feedbacktype, PromptConfig, UserProfile, ViewerProfile, VisionFile, VisionSettings } from '@/types/app'
import type { FileUpload } from '@/app/components/base/file-uploader-in-attachment/types'
import { Resolution, TransferMethod, WorkflowRunningStatus } from '@/types/app'
import Chat from '@/app/components/chat'
import { setLocaleOnClient } from '@/i18n/client'
import useBreakpoints, { MediaType } from '@/hooks/use-breakpoints'
import Loading from '@/app/components/base/loading'
import { replaceVarWithValues, userInputsFormToPromptVariables } from '@/utils/prompt'
import AppUnavailable from '@/app/components/app-unavailable'
import { APP_BUILD_VERSION, APP_INFO, isShowPrompt, promptTemplate } from '@/config'
import type { Annotation as AnnotationType } from '@/types/log'
import { addFileInfos, sortAgentSorts } from '@/utils/tools'

export interface IMainProps {
  params: any
}

const Main: FC<IMainProps> = () => {
  const { t } = useTranslation()
  const media = useBreakpoints()
  const isMobile = media === MediaType.mobile
  const [agents, setAgents] = useState<AgentItem[]>([])
  const [viewer, setViewer] = useState<ViewerProfile | null>(null)
  const [adminDifyBaseUrl, setAdminDifyBaseUrl] = useState('')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isUpdatingProfilePassword, setIsUpdatingProfilePassword] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [profileDraft, setProfileDraft] = useState({
    display_name: '',
    first_name: '',
    last_name: '',
    initials_override: '',
  })
  const [profilePasswordDraft, setProfilePasswordDraft] = useState('')
  const [profilePasswordConfirmDraft, setProfilePasswordConfirmDraft] = useState('')
  const [profileCurrentPasswordDraft, setProfileCurrentPasswordDraft] = useState('')
  const [activeAgentId, setActiveAgentId] = useState('')
  const conversationScopeKey = `agent:${activeAgentId || 'none'}`
  const activeAgent = agents.find(agent => agent.id === activeAgentId)
  const activeAgentName = activeAgent?.name || 'Agent'
  const withAgentPrefix = (name: string) => {
    const trimmedName = name.trim()
    const prefix = `${activeAgentName}: `
    if (!trimmedName) { return prefix.trim() }
    if (trimmedName.startsWith(prefix)) { return trimmedName }
    return `${prefix}${trimmedName}`
  }

  /*
  * app info
  */
  const [appUnavailable, setAppUnavailable] = useState<boolean>(false)
  const [isUnknownReason, setIsUnknownReason] = useState<boolean>(false)
  const [appUnavailableMessage, setAppUnavailableMessage] = useState<string>('')
  const [promptConfig, setPromptConfig] = useState<PromptConfig | null>(null)
  const [inited, setInited] = useState<boolean>(false)
  // in mobile, show sidebar by click button
  const [isShowSidebar, { setTrue: showSidebar, setFalse: hideSidebar }] = useBoolean(false)
  const [visionConfig, setVisionConfig] = useState<VisionSettings | undefined>({
    enabled: false,
    number_limits: 2,
    detail: Resolution.low,
    transfer_methods: [TransferMethod.local_file],
  })
  const [fileConfig, setFileConfig] = useState<FileUpload | undefined>()
  const supabaseClient = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
    if (!url || !key) {
      return null
    }
    return createBrowserClient(url, key)
  }, [])

  useEffect(() => {
    if (APP_INFO?.title) { document.title = APP_INFO.title }
  }, [APP_INFO?.title])

  // onData change thought (the produce obj). https://github.com/immerjs/immer/issues/576
  useEffect(() => {
    setAutoFreeze(false)
    return () => {
      setAutoFreeze(true)
    }
  }, [])

  /*
  * conversation info
  */
  const {
    conversationList,
    setConversationList,
    currConversationId,
    getCurrConversationId,
    setCurrConversationId,
    getConversationIdFromStorage,
    isNewConversation,
    currConversationInfo,
    currInputs,
    newConversationInputs,
    resetNewConversationInputs,
    setCurrInputs,
    setNewConversationInfo,
    setExistConversationInfo,
  } = useConversation()

  const [conversationIdChangeBecauseOfNew, setConversationIdChangeBecauseOfNew, getConversationIdChangeBecauseOfNew] = useGetState(false)
  const hasSetInputs = !isNewConversation

  const conversationName = withAgentPrefix(currConversationInfo?.name || t('app.chat.newChatDefaultName') as string)
  const conversationIntroduction = currConversationInfo?.introduction || ''
  const suggestedQuestions = currConversationInfo?.suggested_questions || []

  const handleConversationSwitch = () => {
    if (!inited || !activeAgentId) { return }

    // Guard against stale conversation IDs when switching agents.
    // If the current id is not in the loaded list for this agent scope,
    // reset deterministically to new conversation instead of requesting
    // /messages for a non-existent conversation.
    if (!isNewConversation && !conversationList.some(item => item.id === currConversationId)) {
      setConversationIdChangeBecauseOfNew(false)
      setCurrConversationId('-1', conversationScopeKey, false)
      setChatList(generateNewChatListWithOpenStatement())
      return
    }

    // update inputs of current conversation
    let notSyncToStateIntroduction = ''
    let notSyncToStateInputs: Record<string, any> | undefined | null = {}
    if (!isNewConversation) {
      const item = conversationList.find(item => item.id === currConversationId)
      notSyncToStateInputs = item?.inputs || {}
      setCurrInputs(notSyncToStateInputs as any)
      notSyncToStateIntroduction = item?.introduction || ''
      setExistConversationInfo({
        name: withAgentPrefix(item?.name || ''),
        introduction: notSyncToStateIntroduction,
        suggested_questions: suggestedQuestions,
      })
    }
    else {
      notSyncToStateInputs = newConversationInputs
      setCurrInputs(notSyncToStateInputs)
    }

    // update chat list of current conversation
    if (!isNewConversation && !conversationIdChangeBecauseOfNew && !isResponding) {
      fetchChatList(currConversationId, activeAgentId)
        .then((res: any) => {
          const { data } = res
          const newChatList: ChatItem[] = generateNewChatListWithOpenStatement(notSyncToStateIntroduction, notSyncToStateInputs)

          data.forEach((item: any) => {
            newChatList.push({
              id: `question-${item.id}`,
              content: item.query,
              isAnswer: false,
              useCurrentUserAvatar: true,
              message_files: item.message_files?.filter((file: any) => file.belongs_to === 'user') || [],

            })
            newChatList.push({
              id: item.id,
              content: item.answer,
              agent_thoughts: addFileInfos(item.agent_thoughts ? sortAgentSorts(item.agent_thoughts) : item.agent_thoughts, item.message_files),
              feedback: item.feedback,
              isAnswer: true,
              message_files: item.message_files?.filter((file: any) => file.belongs_to === 'assistant') || [],
            })
          })
          setChatList(newChatList)
        })
        .catch(() => {
          // Conversation can disappear upstream while still present locally.
          // Reset deterministically to new conversation for this agent scope.
          setConversationIdChangeBecauseOfNew(false)
          setCurrConversationId('-1', conversationScopeKey, false)
          setChatList(generateNewChatListWithOpenStatement())
        })
    }

    if (isNewConversation) { setChatList(generateNewChatListWithOpenStatement()) }
  }
  useEffect(handleConversationSwitch, [currConversationId, inited, activeAgentId])

  const handleConversationIdChange = (id: string) => {
    if (!activeAgentId) { return }
    if (id === '-1') {
      createNewChat()
      setConversationIdChangeBecauseOfNew(true)
    }
    else {
      setConversationIdChangeBecauseOfNew(false)
    }
    // trigger handleConversationSwitch
    setCurrConversationId(id, conversationScopeKey)
    hideSidebar()
  }

  /*
  * chat info. chat is under conversation.
  */
  const [isResponding, { setTrue: setRespondingTrue, setFalse: setRespondingFalse }] = useBoolean(false)
  const [chatList, setChatList, getChatList] = useGetState<ChatItem[]>([])
  const chatScrollContainerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const scrollContainer = chatScrollContainerRef.current
    if (!scrollContainer)
      return

    window.requestAnimationFrame(() => {
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    })
  }, [chatList, currConversationId, isResponding])
  // user can not edit inputs if user had send message
  const canEditInputs = !chatList.some(item => item.isAnswer === false) && isNewConversation
  const createNewChat = () => {
    // if new chat is already exist, do not create new chat
    if (conversationList.some(item => item.id === '-1')) { return }

    setConversationList(produce(conversationList, (draft) => {
      draft.unshift({
        id: '-1',
        name: withAgentPrefix(t('app.chat.newChatDefaultName')),
        inputs: newConversationInputs,
        introduction: conversationIntroduction,
        suggested_questions: suggestedQuestions,
      })
    }))
  }

  // sometime introduction is not applied to state
  const generateNewChatListWithOpenStatement = (introduction?: string, inputs?: Record<string, any> | null) => {
    let calculatedIntroduction = introduction || conversationIntroduction || ''
    const calculatedPromptVariables = inputs || currInputs || null
    if (calculatedIntroduction && calculatedPromptVariables) { calculatedIntroduction = replaceVarWithValues(calculatedIntroduction, promptConfig?.prompt_variables || [], calculatedPromptVariables) }

    const openStatement = {
      id: `${Date.now()}`,
      content: calculatedIntroduction,
      isAnswer: true,
      feedbackDisabled: true,
      isOpeningStatement: isShowPrompt,
      suggestedQuestions,
    }
    if (calculatedIntroduction) { return [openStatement] }

    return []
  }

  // init
  useEffect(() => {
    (async () => {
      try {
        const agentData = await fetchAgents()
        const availableAgents = agentData?.data || []
        const defaultAgentId = agentData?.default_agent_id || availableAgents[0]?.id
        const viewerData = agentData?.viewer
        if (!viewerData?.user_id || !viewerData?.initials) {
          throw new Error(`Invalid viewer contract from /api/agents. received=${JSON.stringify(viewerData)}`)
        }
        if (!defaultAgentId) {
          throw new Error('No agents are configured for this user.')
        }
        setAgents(availableAgents)
        setViewer(viewerData)
        setAdminDifyBaseUrl(agentData?.admin_debug?.dify_base_url || '')
        setActiveAgentId(defaultAgentId)
      }
      catch (e: any) {
        const message = e?.message || 'Failed to load available agents.'
        setAppUnavailableMessage(message)
        setIsUnknownReason(false)
        setAppUnavailable(true)
        Toast.notify({ type: 'error', message })
      }
    })()
  }, [])

  useEffect(() => {
    if (!activeAgentId) { return }
    setAppUnavailable(false)
    setInited(false)
    setConversationList([])
    setChatList([])
    setCurrConversationId('-1', conversationScopeKey, false)
    ;(async () => {
      try {
        const [conversationData, appParams] = await Promise.all([fetchConversations(activeAgentId), fetchAppParams(activeAgentId)])
        // handle current conversation id
        const { data: conversations, error } = conversationData as { data: ConversationItem[], error: string }
        if (error) {
          Toast.notify({ type: 'error', message: `${error} | agent_id=${activeAgentId}` })
          throw new Error(error)
          return
        }
        const _conversationId = getConversationIdFromStorage(conversationScopeKey)
        const currentConversation = conversations.find(item => item.id === _conversationId)
        const isNotNewConversation = !!currentConversation

        // fetch new conversation info
        const { user_input_form, opening_statement: introduction, file_upload, system_parameters, suggested_questions = [] }: any = appParams
        setLocaleOnClient(APP_INFO.default_language, true)
        setNewConversationInfo({
          name: withAgentPrefix(t('app.chat.newChatDefaultName')),
          introduction,
          suggested_questions,
        })
        if (isNotNewConversation) {
          setExistConversationInfo({
            name: withAgentPrefix(currentConversation.name || t('app.chat.newChatDefaultName')),
            introduction,
            suggested_questions,
          })
        }
        const prompt_variables = userInputsFormToPromptVariables(user_input_form)
        setPromptConfig({
          prompt_template: promptTemplate,
          prompt_variables,
        } as PromptConfig)
        const outerFileUploadEnabled = !!file_upload?.enabled
        setVisionConfig({
          ...file_upload?.image,
          enabled: !!(outerFileUploadEnabled && file_upload?.image?.enabled),
          image_file_size_limit: system_parameters?.system_parameters || 0,
        })
        setFileConfig({
          enabled: outerFileUploadEnabled,
          allowed_file_types: file_upload?.allowed_file_types,
          allowed_file_extensions: file_upload?.allowed_file_extensions,
          allowed_file_upload_methods: file_upload?.allowed_file_upload_methods,
          number_limits: file_upload?.number_limits,
          fileUploadConfig: file_upload?.fileUploadConfig,
        })
        setConversationList((conversations as ConversationItem[]).map(conversation => ({
          ...conversation,
          name: withAgentPrefix(conversation.name || t('app.chat.newChatDefaultName')),
        })))

        if (isNotNewConversation) { setCurrConversationId(_conversationId, conversationScopeKey, false) }

        setInited(true)
      }
      catch (e: any) {
        let message = 'Request failed while loading app data. Check server-side Dify and Supabase configuration.'
        let unknownReason = false

        if (e?.status === 404) {
          message = 'App configuration was not found (404). Check Dify app key and app availability.'
        }
        else if (typeof e?.status === 'number') {
          try {
            const payload = await e.json()
            const context = payload?.context ? ` (${payload.context})` : ''
            const received = payload?.received ? `: ${payload.received}` : ''
            const upstreamStatus = payload?.upstreamStatus ? ` | upstreamStatus=${payload.upstreamStatus}` : ''
            const upstreamCode = payload?.upstreamCode ? ` | upstreamCode=${payload.upstreamCode}` : ''
            const upstreamOperation = payload?.upstreamOperation ? ` | upstreamOperation=${payload.upstreamOperation}` : ''
            const upstreamPayload = payload?.upstreamPayload ? ` | upstreamPayload=${JSON.stringify(payload.upstreamPayload)}` : ''
            message = `${payload?.error || `Request failed with status ${e.status}`}${context}${received}${upstreamStatus}${upstreamCode}${upstreamOperation}${upstreamPayload}`
          }
          catch {
            message = `Request failed with status ${e.status}.`
          }
        }
        else if (e?.message) {
          message = e.message
        }
        else {
          unknownReason = true
        }

        setIsUnknownReason(unknownReason)
        setAppUnavailableMessage(message)
        Toast.notify({ type: 'error', message })
        setAppUnavailable(true)
      }
    })()
  }, [activeAgentId])

  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const { notify } = Toast
  const logError = (message: string) => {
    notify({ type: 'error', message })
  }

  const normalizeInputValue = (value: string) => {
    const trimmed = value.trim()
    return trimmed || null
  }

  const getPasswordValidationError = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      return 'Password is required.'
    }
    if (trimmed.length < 6) {
      return 'Password must be at least 6 characters.'
    }
    const hasLetter = /[a-zA-Z]/.test(trimmed)
    const hasNumber = /\d/.test(trimmed)
    if (!hasLetter || !hasNumber) {
      return 'Password must contain at least one letter and one number.'
    }
    return null
  }

  const getRequestErrorMessage = async (error: any, fallback: string) => {
    if (!error) {
      return fallback
    }
    if (typeof error?.message === 'string' && error.message.trim()) {
      return error.message
    }
    if (typeof error?.json === 'function') {
      try {
        const payload = await error.json()
        if (typeof payload?.received === 'string' && payload.received.trim()) {
          return payload.received
        }
        if (typeof payload?.error === 'string' && payload.error.trim()) {
          return payload.error
        }
        if (typeof payload?.message === 'string' && payload.message.trim()) {
          return payload.message
        }
      }
      catch {
        return fallback
      }
    }
    return fallback
  }

  const openProfileModal = async () => {
    try {
      const response = await fetchProfile()
      setProfile(response.profile)
      setViewer(response.viewer)
      setProfileDraft({
        display_name: response.profile.display_name || '',
        first_name: response.profile.first_name || '',
        last_name: response.profile.last_name || '',
        initials_override: response.profile.initials_override || '',
      })
      setProfilePasswordDraft('')
      setProfilePasswordConfirmDraft('')
      setProfileCurrentPasswordDraft('')
      setIsProfileOpen(true)
    }
    catch (e: any) {
      logError(e?.message || 'Failed to load profile.')
    }
  }

  const closeProfileModal = () => {
    if (isSavingProfile || isUpdatingProfilePassword)
      return
    setIsProfileOpen(false)
    setProfileCurrentPasswordDraft('')
    setProfilePasswordDraft('')
    setProfilePasswordConfirmDraft('')
  }

  const handleOpenAdminConsole = () => {
    setIsProfileOpen(false)
    globalThis.location.assign('/admin')
  }

  const handleSignOut = async () => {
    if (isSigningOut) {
      return
    }
    if (!supabaseClient) {
      logError('Missing Supabase client configuration for sign out.')
      return
    }
    setIsSigningOut(true)
    try {
      const { error } = await supabaseClient.auth.signOut()
      if (error) {
        throw error
      }
      globalThis.location.assign('/sign-in')
    }
    catch (e: any) {
      logError(e?.message || 'Failed to sign out.')
    }
    finally {
      setIsSigningOut(false)
    }
  }

  const handleSaveProfile = async () => {
    if (isSavingProfile)
      return

    setIsSavingProfile(true)
    try {
      const response = await updateProfile({
        first_name: normalizeInputValue(profileDraft.first_name),
        last_name: normalizeInputValue(profileDraft.last_name),
        display_name: normalizeInputValue(profileDraft.display_name),
        initials_override: normalizeInputValue(profileDraft.initials_override),
        avatar_url: profile?.avatar_url || null,
      })
      setProfile(response.profile)
      setViewer(response.viewer)
      setIsProfileOpen(false)
      notify({ type: 'success', message: t('common.api.success') })
    }
    catch (e: any) {
      logError(e?.message || 'Failed to save profile.')
    }
    finally {
      setIsSavingProfile(false)
    }
  }

  const handleUpdateProfilePassword = async () => {
    if (isUpdatingProfilePassword) {
      return
    }
    const passwordValidationError = getPasswordValidationError(profilePasswordDraft)
    if (passwordValidationError) {
      logError(passwordValidationError)
      return
    }
    if (profilePasswordDraft !== profilePasswordConfirmDraft) {
      logError('Passwords do not match.')
      return
    }
    if (!profileCurrentPasswordDraft.trim()) {
      logError('Current password is required.')
      return
    }

    setIsUpdatingProfilePassword(true)
    try {
      await updateMyPassword({
        current_password: profileCurrentPasswordDraft,
        password: profilePasswordDraft,
      })
      setProfileCurrentPasswordDraft('')
      setProfilePasswordDraft('')
      setProfilePasswordConfirmDraft('')
      notify({ type: 'success', message: 'Password updated successfully.' })
    }
    catch (e: any) {
      const message = await getRequestErrorMessage(e, 'Failed to update password.')
      logError(message)
    }
    finally {
      setIsUpdatingProfilePassword(false)
    }
  }

  const checkCanSend = () => {
    if (currConversationId !== '-1') { return true }

    if (!currInputs || !promptConfig?.prompt_variables) { return true }

    let emptyRequiredInput = false
    promptConfig.prompt_variables.forEach((item) => {
      if (item.required && !currInputs[item.key])
        emptyRequiredInput = true
    })

    if (emptyRequiredInput) {
      logError(t('app.errorMessage.valueOfVarRequired'))
      return false
    }
    return true
  }

  const [controlFocus, setControlFocus] = useState(0)
  const [openingSuggestedQuestions, setOpeningSuggestedQuestions] = useState<string[]>([])
  const [messageTaskId, setMessageTaskId] = useState('')
  const [hasStopResponded, setHasStopResponded, getHasStopResponded] = useGetState(false)
  const [isRespondingConIsCurrCon, setIsRespondingConCurrCon, getIsRespondingConIsCurrCon] = useGetState(true)
  const [userQuery, setUserQuery] = useState('')

  const updateCurrentQA = ({
    responseItem,
    questionId,
    placeholderAnswerId,
    questionItem,
  }: {
    responseItem: ChatItem
    questionId: string
    placeholderAnswerId: string
    questionItem: ChatItem
  }) => {
    // closesure new list is outdated.
    const newListWithAnswer = produce(
      getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
      (draft) => {
        if (!draft.find(item => item.id === questionId)) { draft.push({ ...questionItem }) }

        draft.push({ ...responseItem })
      },
    )
    setChatList(newListWithAnswer)
  }

  const transformToServerFile = (fileItem: any) => {
    return {
      type: 'image',
      transfer_method: fileItem.transferMethod,
      url: fileItem.url,
      upload_file_id: fileItem.id,
    }
  }

  const handleSend = async (message: string, files?: VisionFile[]) => {
    if (isResponding) {
      notify({ type: 'info', message: t('app.errorMessage.waitForResponse') })
      return
    }
    if (isNewConversation) {
      createNewChat()
      setConversationIdChangeBecauseOfNew(true)
    }

    const toServerInputs: Record<string, any> = {}
    if (currInputs) {
      Object.keys(currInputs).forEach((key) => {
        const value = currInputs[key]
        if (value.supportFileType) { toServerInputs[key] = transformToServerFile(value) }

        else if (value[0]?.supportFileType) { toServerInputs[key] = value.map((item: any) => transformToServerFile(item)) }

        else { toServerInputs[key] = value }
      })
    }

    const data: Record<string, any> = {
      inputs: toServerInputs,
      query: message,
      conversation_id: isNewConversation ? null : currConversationId,
    }

    if (files && files?.length > 0) {
      data.files = files.map((item) => {
        if (item.transfer_method === TransferMethod.local_file) {
          return {
            ...item,
            url: '',
          }
        }
        return item
      })
    }

    // question
    const questionId = `question-${Date.now()}`
    const questionItem = {
      id: questionId,
      content: message,
      isAnswer: false,
      useCurrentUserAvatar: true,
      message_files: (files || []).filter((f: any) => f.type === 'image'),
    }

    const placeholderAnswerId = `answer-placeholder-${Date.now()}`
    const placeholderAnswerItem = {
      id: placeholderAnswerId,
      content: '',
      isAnswer: true,
    }

    const newList = [...getChatList(), questionItem, placeholderAnswerItem]
    setChatList(newList)

    let isAgentMode = false

    // answer
    const responseItem: ChatItem = {
      id: `${Date.now()}`,
      content: '',
      agent_thoughts: [],
      message_files: [],
      isAnswer: true,
    }
    let hasSetResponseId = false

    const prevTempNewConversationId = getCurrConversationId() || '-1'
    let tempNewConversationId = ''
    let streamTaskId = ''
    const removePlaceholderAnswer = () => {
      setChatList(produce(getChatList(), (draft) => {
        const placeholderIndex = draft.findIndex(item => item.id === placeholderAnswerId)
        if (placeholderIndex !== -1) {
          draft.splice(placeholderIndex, 1)
        }
      }))
    }

    setRespondingTrue()
    sendChatMessage(data, activeAgentId, {
      getAbortController: (abortController) => {
        setAbortController(abortController)
      },
      onData: (message: string, isFirstMessage: boolean, { conversationId: newConversationId, messageId, taskId }: any) => {
        if (!isAgentMode) {
          responseItem.content = responseItem.content + message
        }
        else {
          const lastThought = responseItem.agent_thoughts?.[responseItem.agent_thoughts?.length - 1]
          if (lastThought) { lastThought.thought = lastThought.thought + message } // need immer setAutoFreeze
        }
        if (messageId && !hasSetResponseId) {
          responseItem.id = messageId
          hasSetResponseId = true
        }

        if (isFirstMessage && newConversationId) { tempNewConversationId = newConversationId }

        if (taskId) {
          streamTaskId = taskId
          setMessageTaskId(taskId)
        }
        // has switched to other conversation
        if (prevTempNewConversationId !== getCurrConversationId()) {
          setIsRespondingConCurrCon(false)
          return
        }
        updateCurrentQA({
          responseItem,
          questionId,
          placeholderAnswerId,
          questionItem,
        })
      },
      async onCompleted(hasError?: boolean) {
        if (hasError) {
          setRespondingFalse()
          removePlaceholderAnswer()
          return
        }

        const hasRenderedAssistantOutput
          = !!responseItem.content?.trim()
            || !!responseItem.agent_thoughts?.length
            || !!responseItem.message_files?.length
            || !!responseItem.annotation

        if (!hasRenderedAssistantOutput) {
          setRespondingFalse()
          removePlaceholderAnswer()
          logError(`Assistant stream completed without content. agent_id=${activeAgentId} conversation_id=${tempNewConversationId || prevTempNewConversationId} task_id=${streamTaskId || 'unknown'} question_id=${questionId}`)
          return
        }

        if (getConversationIdChangeBecauseOfNew()) {
          const { data: allConversations }: any = await fetchConversations(activeAgentId)
          const newItem: any = await generationConversationName(allConversations[0].id, activeAgentId)

          const newAllConversations = produce(allConversations, (draft: any) => {
            draft[0].name = withAgentPrefix(newItem.name)
          })
          setConversationList((newAllConversations as ConversationItem[]).map(conversation => ({
            ...conversation,
            name: withAgentPrefix(conversation.name || t('app.chat.newChatDefaultName')),
          })))
        }
        setConversationIdChangeBecauseOfNew(false)
        resetNewConversationInputs()
        setCurrConversationId(tempNewConversationId, conversationScopeKey, true)
        setRespondingFalse()
      },
      onFile(file) {
        const lastThought = responseItem.agent_thoughts?.[responseItem.agent_thoughts?.length - 1]
        if (lastThought) { lastThought.message_files = [...(lastThought as any).message_files, { ...file }] }

        updateCurrentQA({
          responseItem,
          questionId,
          placeholderAnswerId,
          questionItem,
        })
      },
      onThought(thought) {
        isAgentMode = true
        const response = responseItem as any
        if (thought.message_id && !hasSetResponseId) {
          response.id = thought.message_id
          hasSetResponseId = true
        }
        // responseItem.id = thought.message_id;
        if (response.agent_thoughts.length === 0) {
          response.agent_thoughts.push(thought)
        }
        else {
          const lastThought = response.agent_thoughts[response.agent_thoughts.length - 1]
          // thought changed but still the same thought, so update.
          if (lastThought.id === thought.id) {
            thought.thought = lastThought.thought
            thought.message_files = lastThought.message_files
            responseItem.agent_thoughts![response.agent_thoughts.length - 1] = thought
          }
          else {
            responseItem.agent_thoughts!.push(thought)
          }
        }
        // has switched to other conversation
        if (prevTempNewConversationId !== getCurrConversationId()) {
          setIsRespondingConCurrCon(false)
          return false
        }

        updateCurrentQA({
          responseItem,
          questionId,
          placeholderAnswerId,
          questionItem,
        })
      },
      onMessageEnd: (messageEnd) => {
        if (messageEnd.metadata?.annotation_reply) {
          responseItem.id = messageEnd.id
          responseItem.annotation = ({
            id: messageEnd.metadata.annotation_reply.id,
            authorName: messageEnd.metadata.annotation_reply.account.name,
          } as AnnotationType)
          const newListWithAnswer = produce(
            getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
            (draft) => {
              if (!draft.find(item => item.id === questionId)) { draft.push({ ...questionItem }) }

              draft.push({
                ...responseItem,
              })
            },
          )
          setChatList(newListWithAnswer)
          return
        }
        // not support show citation
        // responseItem.citation = messageEnd.retriever_resources
        const newListWithAnswer = produce(
          getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
          (draft) => {
            if (!draft.find(item => item.id === questionId)) { draft.push({ ...questionItem }) }

            draft.push({ ...responseItem })
          },
        )
        setChatList(newListWithAnswer)
      },
      onMessageReplace: (messageReplace) => {
        setChatList(produce(
          getChatList(),
          (draft) => {
            const current = draft.find(item => item.id === messageReplace.id)

            if (current) { current.content = messageReplace.answer }
          },
        ))
      },
      onError() {
        setRespondingFalse()
        removePlaceholderAnswer()
      },
      onWorkflowStarted: ({ workflow_run_id, task_id }) => {
        // taskIdRef.current = task_id
        responseItem.workflow_run_id = workflow_run_id
        responseItem.workflowProcess = {
          status: WorkflowRunningStatus.Running,
          tracing: [],
        }
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          draft[currentIndex] = {
            ...draft[currentIndex],
            ...responseItem,
          }
        }))
      },
      onWorkflowFinished: ({ data }) => {
        responseItem.workflowProcess!.status = data.status as WorkflowRunningStatus
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          draft[currentIndex] = {
            ...draft[currentIndex],
            ...responseItem,
          }
        }))
      },
      onNodeStarted: ({ data }) => {
        responseItem.workflowProcess!.tracing!.push(data as any)
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          draft[currentIndex] = {
            ...draft[currentIndex],
            ...responseItem,
          }
        }))
      },
      onNodeFinished: ({ data }) => {
        const currentIndex = responseItem.workflowProcess!.tracing!.findIndex(item => item.node_id === data.node_id)
        responseItem.workflowProcess!.tracing[currentIndex] = data as any
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          draft[currentIndex] = {
            ...draft[currentIndex],
            ...responseItem,
          }
        }))
      },
    })
  }

  const handleFeedback = async (messageId: string, feedback: Feedbacktype) => {
    await updateFeedback({ url: `/messages/${messageId}/feedbacks`, body: { rating: feedback.rating }, agentId: activeAgentId })
    const newChatList = chatList.map((item) => {
      if (item.id === messageId) {
        return {
          ...item,
          feedback,
        }
      }
      return item
    })
    setChatList(newChatList)
    notify({ type: 'success', message: t('common.api.success') })
  }

  const renderSidebar = () => {
    if (!APP_INFO || !promptConfig) { return null }
    return (
      <Sidebar
        list={conversationList}
        onCurrentIdChange={handleConversationIdChange}
        currentId={currConversationId}
        copyRight={APP_INFO.copyright || APP_INFO.title}
        version={APP_BUILD_VERSION}
      />
    )
  }

  if (appUnavailable) { return <AppUnavailable isUnknownReason={isUnknownReason} errMessage={isUnknownReason ? '' : appUnavailableMessage} /> }

  if (!APP_INFO || !promptConfig || !activeAgentId) { return <Loading type='app' /> }

  return (
    <div className='h-full overflow-hidden bg-gray-50'>
      <Header
        isMobile={isMobile}
        onShowSideBar={showSidebar}
        onCreateNewChat={() => handleConversationIdChange('-1')}
        agents={agents}
        viewerInitials={viewer?.initials || 'U'}
        onOpenProfile={openProfileModal}
        technicalInfo={viewer?.is_master_admin
          ? {
              active_agent_id: activeAgentId,
              dify_base_url: adminDifyBaseUrl,
            }
          : null}
        activeAgentId={activeAgentId}
        onAgentChange={(agentId) => {
          if (isResponding) {
            notify({ type: 'info', message: t('app.errorMessage.waitForResponse') })
            return
          }
          if (agentId === activeAgentId) { return }
          setConversationIdChangeBecauseOfNew(false)
          setCurrConversationId('-1', `agent:${agentId}`, false)
          setChatList([])
          setInited(false)
          setActiveAgentId(agentId)
        }}
        disableAgentSwitch={isResponding}
      />
      <div className="flex h-[calc(100%_-_3rem)] bg-white overflow-hidden">
        {/* sidebar */}
        {!isMobile && renderSidebar()}
        {isMobile && isShowSidebar && (
          <div className='fixed inset-0 z-50' style={{ backgroundColor: 'rgba(35, 56, 118, 0.2)' }} onClick={hideSidebar} >
            <div className='inline-block' onClick={e => e.stopPropagation()}>
              {renderSidebar()}
            </div>
          </div>
        )}
        {/* main */}
        <div ref={chatScrollContainerRef} className='flex-grow flex flex-col h-full overflow-y-auto overflow-x-hidden'>
          <ConfigSence
            conversationName={conversationName}
            hasSetInputs={hasSetInputs}
            isPublicVersion={isShowPrompt}
            siteInfo={APP_INFO}
            agentName={activeAgent?.name}
            agentDescription={activeAgent?.description || null}
            promptConfig={promptConfig}
            canEditInputs={canEditInputs}
            savedInputs={currInputs as Record<string, any>}
            onInputsChange={setCurrInputs}
          ></ConfigSence>

          {
            (hasSetInputs || isNewConversation) && (
              <div className='relative min-h-0 grow w-[90%] mx-auto mb-3.5'>
                <Chat
                  chatList={chatList}
                  onSend={handleSend}
                  onFeedback={handleFeedback}
                  useCurrentUserAvatar
                  userInitials={viewer?.initials || 'U'}
                  isResponding={isResponding}
                  checkCanSend={checkCanSend}
                  visionConfig={visionConfig}
                  fileConfig={fileConfig}
                />
              </div>)
          }
        </div>
      </div>
      {isProfileOpen && (
        <div className='fixed inset-0 z-50 bg-black/20' onClick={closeProfileModal}>
          <div className='h-full w-full flex items-center justify-center p-4' onClick={e => e.stopPropagation()}>
            <div className='w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-xl'>
              <div className='mb-4'>
                <h2 className='text-lg font-bold tracking-tight text-gray-900'>Profile settings</h2>
                <p className='text-sm text-gray-600 mt-1'>Control how your name and initials appear in chat.</p>
              </div>
              <div className='space-y-3'>
                <label className='block text-xs font-semibold text-gray-700'>
                  Display name
                  <input
                    type='text'
                    value={profileDraft.display_name}
                    onChange={e => setProfileDraft({ ...profileDraft, display_name: e.target.value })}
                    className='mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200'
                    placeholder='Name shown in app'
                  />
                </label>
                <label className='block text-xs font-semibold text-gray-700'>
                  First name
                  <input
                    type='text'
                    value={profileDraft.first_name}
                    onChange={e => setProfileDraft({ ...profileDraft, first_name: e.target.value })}
                    className='mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200'
                    placeholder='Optional first name'
                  />
                </label>
                <label className='block text-xs font-semibold text-gray-700'>
                  Last name
                  <input
                    type='text'
                    value={profileDraft.last_name}
                    onChange={e => setProfileDraft({ ...profileDraft, last_name: e.target.value })}
                    className='mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200'
                    placeholder='Optional last name'
                  />
                </label>
                <label className='block text-xs font-semibold text-gray-700'>
                  Initials override
                  <input
                    type='text'
                    value={profileDraft.initials_override}
                    onChange={e => setProfileDraft({ ...profileDraft, initials_override: e.target.value })}
                    className='mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200'
                    placeholder='1-4 letters'
                  />
                </label>
                <div className='rounded-lg border border-gray-200 bg-gray-50 p-3'>
                  <h3 className='text-xs font-semibold text-gray-700'>Update password</h3>
                  <div className='mt-2 grid gap-2'>
                    <input
                      type='password'
                      value={profileCurrentPasswordDraft}
                      onChange={e => setProfileCurrentPasswordDraft(e.target.value)}
                      className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200'
                      placeholder='Current password'
                    />
                    <input
                      type='password'
                      value={profilePasswordDraft}
                      onChange={e => setProfilePasswordDraft(e.target.value)}
                      className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200'
                      placeholder='New password'
                      minLength={6}
                    />
                    <input
                      type='password'
                      value={profilePasswordConfirmDraft}
                      onChange={e => setProfilePasswordConfirmDraft(e.target.value)}
                      className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200'
                      placeholder='Confirm new password'
                      minLength={6}
                    />
                    <p className='text-[11px] text-gray-600'>Password must be at least 6 characters and include at least one letter and one number.</p>
                    <button
                      type='button'
                      onClick={handleUpdateProfilePassword}
                      disabled={isUpdatingProfilePassword || isSavingProfile || isSigningOut}
                      className='h-9 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400'
                    >
                      {isUpdatingProfilePassword ? 'Updating password...' : 'Update password'}
                    </button>
                  </div>
                </div>
              </div>
              <div className='mt-5 flex items-center justify-end gap-2'>
                {viewer?.is_master_admin && (
                  <button
                    type='button'
                    onClick={handleOpenAdminConsole}
                    className='h-9 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-semibold text-indigo-700 hover:bg-indigo-100'
                  >
                    Admin Console
                  </button>
                )}
                <button
                  type='button'
                  disabled={isSigningOut || isUpdatingProfilePassword}
                  className='h-9 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400'
                  onClick={handleSignOut}
                >
                  {isSigningOut ? 'Signing out...' : 'Log out'}
                </button>
                <button
                  type='button'
                  onClick={closeProfileModal}
                  disabled={isSavingProfile || isSigningOut || isUpdatingProfilePassword}
                  className='h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400'
                >
                  Cancel
                </button>
                <button
                  type='button'
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile || isSigningOut || isUpdatingProfilePassword}
                  className='h-9 rounded-lg border border-transparent bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400'
                >
                  {isSavingProfile ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(Main)
