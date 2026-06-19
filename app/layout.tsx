import { getLocaleOnServer } from '@/i18n/server'
import type { Metadata } from 'next'

import './styles/globals.css'
import './styles/markdown.scss'

export const metadata: Metadata = {
  title: 'Parzley Agent Workspace',
  icons: {
    icon: '/Parzley_favicon.png',
  },
}

const LocaleLayout = async ({
  children,
}: {
  children: React.ReactNode
}) => {
  const locale = await getLocaleOnServer()
  return (
    <html lang={locale ?? 'en'} className="h-full">
      <body className="h-full font-sans antialiased bg-gray-50 text-gray-900">
        <div className="overflow-x-auto relative">
          <div className="w-screen h-screen min-w-[300px]">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}

export default LocaleLayout
