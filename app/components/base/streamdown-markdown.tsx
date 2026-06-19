'use client'
import ReactMarkdown from 'react-markdown'
import 'katex/dist/katex.min.css'
import rehypeKatex from 'rehype-katex'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { atelierHeathLight } from 'react-syntax-highlighter/dist/esm/styles/hljs'

interface StreamdownMarkdownProps {
  content: string
  className?: string
}

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a || []), ['target'], ['rel']],
    code: [...(defaultSchema.attributes?.code || []), ['className', /^language-./]],
  },
}

export function StreamdownMarkdown({ content, className = '' }: StreamdownMarkdownProps) {
  return (
    <div className={`markdown-body ${className}`.trim()}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
        rehypePlugins={[
          [rehypeSanitize, sanitizeSchema],
          rehypeKatex,
        ]}
        components={{
          code({ inline, className: codeClassName, children, ...props }) {
            const match = /language-(\w+)/.exec(codeClassName || '')
            if (!inline && match) {
              return (
                <SyntaxHighlighter
                  {...props}
                  style={atelierHeathLight}
                  language={match[1]}
                  showLineNumbers
                  PreTag="div"
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              )
            }

            return (
              <code {...props} className={codeClassName}>
                {children}
              </code>
            )
          },
          a({ ...props }) {
            return <a {...props} target='_blank' rel='noreferrer noopener' />
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default StreamdownMarkdown
