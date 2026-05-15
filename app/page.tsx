'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
}

function parseMarkdown(text: string): string {
  return text
    // Code blocks
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // H2
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    // H3
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    // H1
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // HR
    .replace(/^---$/gm, '<hr/>')
    // Unordered lists
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    // Numbered lists  
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Paragraphs (lines not already tagged)
    .replace(/^(?!<[a-z]|$)(.+)$/gm, '<p>$1</p>')
    // Clean up empty lines between tags
    .replace(/\n{3,}/g, '\n\n')
}

function ChatMessage({ message, isStreaming }: { message: Message; isStreaming?: boolean }) {
  const isUser = message.role === 'user'

  return (
    <div className={`fade-in flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-sky-500 flex items-center justify-center text-xs font-bold text-white mr-2 mt-1 shrink-0">
          SF
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-sky-600 text-white rounded-tr-sm'
            : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div
            className="prose-chat"
            dangerouslySetInnerHTML={{
              __html: parseMarkdown(message.content) + (isStreaming ? '<span class="cursor-blink"></span>' : ''),
            }}
          />
        )}
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white ml-2 mt-1 shrink-0">
          T
        </div>
      )}
    </div>
  )
}

function ThinkingIndicator() {
  return (
    <div className="fade-in flex justify-start mb-4">
      <div className="w-7 h-7 rounded-full bg-sky-500 flex items-center justify-center text-xs font-bold text-white mr-2 mt-1 shrink-0">
        SF
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          <div className="thinking-dot w-1.5 h-1.5 rounded-full bg-sky-400"></div>
          <div className="thinking-dot w-1.5 h-1.5 rounded-full bg-sky-400"></div>
          <div className="thinking-dot w-1.5 h-1.5 rounded-full bg-sky-400"></div>
        </div>
      </div>
    </div>
  )
}

function LoginScreen({ onLogin }: { onLogin: (pw: string) => void }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pw.trim()) return
    setChecking(true)
    setError(false)

    // Test the password against the chat API
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: pw,
          messages: [{ role: 'user', content: 'ping' }],
        }),
      })
      if (res.ok || res.status !== 401) {
        onLogin(pw)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-full max-w-sm px-6">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-sky-400">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Site Factory</h1>
          <p className="text-slate-500 text-sm mt-1">Private access only</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Password"
              autoFocus
              className={`w-full bg-slate-900 border ${error ? 'border-red-500' : 'border-slate-700'} rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 transition-colors`}
            />
            {error && (
              <p className="text-red-400 text-xs mt-2">Incorrect password.</p>
            )}
          </div>
          <button
            type="submit"
            disabled={checking || !pw.trim()}
            className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            {checking ? 'Checking...' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  )
}

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: `## Site Factory ready.

Tell me what you want to build and I'll research it, plan it, and generate the complete repo.

**What works well:**
- "I want to build a plain English guide to [topic] for UK [audience]"
- "Build me a calculator that helps people work out [problem]"
- "Research whether there's a gap in the market for [idea]"

What are we building?`,
  timestamp: new Date(),
}

export default function Home() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [repoStatus, setRepoStatus] = useState<{ show: boolean; url?: string; name?: string } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const handleLogin = (pw: string) => {
    setPassword(pw)
    setAuthed(true)
  }

  const sendMessage = useCallback(async () => {
    const content = input.trim()
    if (!content || isLoading) return

    const userMessage: Message = { role: 'user', content, timestamp: new Date() }
    const newMessages = [...messages, userMessage]

    setMessages(newMessages)
    setInput('')
    setIsLoading(true)
    setIsStreaming(true)
    setStreamingContent('')

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // Check if this is a push-to-github command
    const isRepoPush = content.toLowerCase().includes('push to github') ||
                       content.toLowerCase().includes('create the repo') ||
                       content.toLowerCase().includes('push this') ||
                       content.toLowerCase().includes('create repo')

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') break
              try {
                const parsed = JSON.parse(data)
                if (parsed.text) {
                  fullContent += parsed.text
                  setStreamingContent(fullContent)
                }
              } catch {
                // ignore parse errors
              }
            }
          }
        }
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: fullContent,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setStreamingContent('')

      // Check if the AI response contains file generation markers
      // and auto-trigger repo creation if appropriate
      if (isRepoPush && fullContent.includes('```')) {
        // Parse files from the response and create the repo
        await handleRepoPush(fullContent, content)
      }

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Something went wrong. Please try again.',
            timestamp: new Date(),
          },
        ])
      }
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      setStreamingContent('')
    }
  }, [input, isLoading, messages, password])

  const handleRepoPush = async (aiResponse: string, userRequest: string) => {
    // Extract site name from conversation
    const siteNameMatch = aiResponse.match(/repo[:\s]+([a-z0-9-]+)/i) ||
                          aiResponse.match(/repository[:\s]+([a-z0-9-]+)/i)

    // Extract code files from the response
    const fileRegex = /```(?:tsx?|jsx?|json|css|js)\n?\/\/ (.+)\n([\s\S]*?)```/g
    const files: { path: string; content: string }[] = []
    let match

    while ((match = fileRegex.exec(aiResponse)) !== null) {
      files.push({ path: match[1].trim(), content: match[2].trim() })
    }

    if (files.length === 0) return

    const siteName = siteNameMatch?.[1] || 'new-site'

    try {
      const res = await fetch('/api/create-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteName, description: userRequest, files, password }),
      })
      const data = await res.json()

      if (data.success) {
        setRepoStatus({ show: true, url: data.repoUrl, name: data.repoName })
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `✅ **Repo created and pushed to GitHub!**\n\n**Repo:** [${data.repoName}](${data.repoUrl})\n**Files pushed:** ${data.fileCount}\n\nNext step: Go to [Vercel](https://vercel.com/new) → Import Git Repository → select \`${data.repoName}\` → add your environment variables → Deploy.`,
            timestamp: new Date(),
          },
        ])
      }
    } catch {
      // Silent fail — the AI has already shown the files
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    // Auto-resize
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE])
    setStreamingContent('')
  }

  const stopStream = () => {
    abortRef.current?.abort()
  }

  if (!authed) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-sky-400">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="text-white font-semibold text-sm">Site Factory</span>
          <span className="text-slate-600 text-xs">private</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="text-slate-500 hover:text-slate-300 text-xs px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            New chat
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl w-full mx-auto">
        {messages.map((message, i) => (
          <ChatMessage key={i} message={message} />
        ))}

        {isLoading && !streamingContent && <ThinkingIndicator />}

        {streamingContent && (
          <ChatMessage
            message={{ role: 'assistant', content: streamingContent }}
            isStreaming={isStreaming}
          />
        )}

        {/* Repo success banner */}
        {repoStatus?.show && (
          <div className="fade-in bg-emerald-900/30 border border-emerald-700/50 rounded-xl p-4 mb-4 flex items-center justify-between">
            <div>
              <p className="text-emerald-400 font-semibold text-sm">✅ Repo live on GitHub</p>
              <p className="text-emerald-300/70 text-xs mt-0.5">{repoStatus.name}</p>
            </div>
            <a
              href={repoStatus.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-emerald-700/50 hover:bg-emerald-700 text-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              Open →
            </a>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-800 px-4 py-4 shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 focus-within:border-slate-500 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to build..."
              rows={1}
              className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 text-sm resize-none focus:outline-none leading-relaxed"
              style={{ maxHeight: '160px' }}
              disabled={isLoading}
            />
            <div className="flex items-center gap-2 shrink-0 pb-0.5">
              {isLoading && (
                <button
                  onClick={stopStream}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                  title="Stop"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="4" y="4" width="16" height="16" rx="2"/>
                  </svg>
                </button>
              )}
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="bg-sky-600 hover:bg-sky-500 disabled:opacity-30 disabled:cursor-not-allowed text-white p-1.5 rounded-lg transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 2L11 13"/>
                  <path d="M22 2L15 22 11 13 2 9l20-7z"/>
                </svg>
              </button>
            </div>
          </div>
          <p className="text-slate-600 text-xs text-center mt-2">
            Enter to send · Shift+Enter for new line · Say "push to GitHub" when ready to deploy
          </p>
        </div>
      </div>
    </div>
  )
}
