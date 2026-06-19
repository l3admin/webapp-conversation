import type { AppInfo } from '@/types/app'

export const SUPABASE_PROJECT_URL = `${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL || ''}`
export const SUPABASE_PUBLISHABLE_KEY = `${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''}`

export const APP_INFO: AppInfo = {
  title: 'Parzley Agents',
  description: 'Choose an agent and start a focused conversation workflow.',
  copyright: 'Parzley',
  privacy_policy: '',
  default_language: 'en',
  disable_session_same_site: false, // set it to true if you want to embed the chatbot in an iframe
}
export const APP_BUILD_VERSION = '0.0.7'

export const isShowPrompt = false
export const promptTemplate = 'I want you to act as a javascript console.'

export const API_PREFIX = '/api'

export const LOCALE_COOKIE_NAME = 'locale'

export const DEFAULT_VALUE_MAX_LEN = 48
