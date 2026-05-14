import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { FaPaperPlane, FaMagnifyingGlass, FaCircle, FaClock, FaLock } from 'react-icons/fa6'

/* ─── Helpers ───────────────────────────────────────────── */
function displayName(p) {
  return [p.first_name, p.last_name].filter(Boolean).join(' ') || p.username
}

function initials(p) {
  const n = displayName(p)
  return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function timeStr(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function isSystemMessage(content) {
  return content?.startsWith('Session Booking Confirmed') || content?.startsWith('Session Approved')
}

/* ─── System message card ───────────────────────────────── */
function SessionCard({ content, time }) {
  const cardTitle = content?.startsWith('Session Approved') ? 'Session Approved' : 'Session Confirmed'
  const lines = content.split('\n').filter(l => l && l !== '---------------------------')
  const fields = {}
  lines.forEach(l => {
    const idx = l.indexOf(': ')
    if (idx > -1) {
      const key = l.slice(0, idx).trim()
      const val = l.slice(idx + 2).trim()
      fields[key] = val
    }
  })
  return (
    <div className="mx-auto my-3 w-full max-w-sm">
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs text-white font-black">S</div>
          <p className="text-xs font-black uppercase tracking-wide text-blue-700">{cardTitle}</p>
        </div>
        <div className="space-y-1.5 text-xs">
          {fields['Session'] && (
            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-500 shrink-0">Session</span>
              <span className="font-black text-slate-900 text-right">{fields['Session']}</span>
            </div>
          )}
          {fields['Type'] && (
            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-500 shrink-0">Type</span>
              <span className="font-semibold text-slate-700 text-right">{fields['Type']}</span>
            </div>
          )}
          {fields['Date'] && (
            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-500 shrink-0">Date</span>
              <span className="font-semibold text-slate-700 text-right">{fields['Date']}</span>
            </div>
          )}
          {fields['Time'] && (
            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-500 shrink-0">Time</span>
              <span className="font-semibold text-slate-700 text-right">{fields['Time']}</span>
            </div>
          )}
          {fields['Client'] && (
            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-500 shrink-0">Client</span>
              <span className="font-semibold text-slate-700 text-right">{fields['Client']}</span>
            </div>
          )}
          {fields['Consultant'] && (
            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-500 shrink-0">Consultant</span>
              <span className="font-semibold text-slate-700 text-right">{fields['Consultant']}</span>
            </div>
          )}
        </div>
        <div className="mt-3 rounded-xl bg-blue-100/60 px-3 py-2 text-[11px] text-blue-700 font-semibold">
          Payment secured in escrow. Use this chat to coordinate.
        </div>
        <p className="mt-2 text-right text-[10px] text-slate-400">{time}</p>
      </div>
    </div>
  )
}

/* ─── Avatar ────────────────────────────────────────────── */
const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500',
  'bg-rose-500', 'bg-amber-500', 'bg-cyan-500',
]
function avatarColor(name) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function Avatar({ participant, size = 'md' }) {
  const name = displayName(participant)
  const sz = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm'
  if (participant.profile_image) {
    return <img src={participant.profile_image} alt={name} className={`${sz} rounded-full object-cover shrink-0`} />
  }
  return (
    <div className={`${sz} ${avatarColor(name)} flex shrink-0 items-center justify-center rounded-full font-black text-white`}>
      {initials(participant)}
    </div>
  )
}

/* ─── Main ──────────────────────────────────────────────── */
export default function Chat() {
  const { user } = useAuth()
  const [conversations, setConversations]         = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages]                   = useState([])
  const [newMessage, setNewMessage]               = useState('')
  const [loading, setLoading]                     = useState(true)
  const [searchQuery, setSearchQuery]             = useState('')
  const [sending, setSending]                     = useState(false)
  const [sessionWindow, setSessionWindow]         = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => { fetchConversations() }, [])

  useEffect(() => {
    if (!selectedConversation || !user) { setSessionWindow(null); return }
    const others = selectedConversation.participants.filter(p => p.id !== user.id)
    if (!others[0]) { setSessionWindow(null); return }
    const otherId = others[0].id

    const computeWindow = (sessions) => {
      const relevant = sessions.find(s =>
        ['confirmed', 'rescheduled'].includes(s.status) &&
        (s.client?.id === otherId || s.consultant?.id === otherId)
      )
      if (!relevant) { setSessionWindow(null); return }
      const now = Date.now()
      const startMs = new Date(`${relevant.scheduled_date}T${relevant.start_time}`).getTime()
      const endMs   = new Date(`${relevant.scheduled_date}T${relevant.end_time}`).getTime()
      const lockMs  = endMs + 2 * 60 * 60 * 1000
      if (now < startMs - 15 * 60 * 1000) setSessionWindow({ status: 'upcoming', session: relevant, startMs })
      else if (now < endMs)               setSessionWindow({ status: 'active',   session: relevant, endMs })
      else if (now < lockMs)              setSessionWindow({ status: 'ended',    session: relevant, endMs })
      else                                setSessionWindow({ status: 'locked',   session: relevant })
    }

    let allSessions = []
    const fetchAndCompute = async () => {
      try {
        const res = await api.get('/consultations/sessions/my_sessions/')
        allSessions = Array.isArray(res.data) ? res.data : res.data.results || []
        computeWindow(allSessions)
      } catch {}
    }

    fetchAndCompute()
    const id = setInterval(() => computeWindow(allSessions), 60000)
    return () => clearInterval(id)
  }, [selectedConversation, user])

  useEffect(() => {
    if (selectedConversation) fetchMessages(selectedConversation.id)
  }, [selectedConversation])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchConversations = async () => {
    try {
      const res = await api.get('/chat/conversations/')
      setConversations(Array.isArray(res.data) ? res.data : res.data.results || [])
    } catch {}
    finally { setLoading(false) }
  }

  const fetchMessages = async (id) => {
    try {
      const res = await api.get(`/chat/messages/?conversation_id=${id}`)
      setMessages(Array.isArray(res.data) ? res.data : res.data.results || [])
      await api.post(`/chat/conversations/${id}/mark_as_read/`)
      fetchConversations()
    } catch {}
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || sending) return
    setSending(true)
    try {
      await api.post('/chat/messages/send_message/', {
        conversation_id: selectedConversation.id,
        content: newMessage,
      })
      setNewMessage('')
      fetchMessages(selectedConversation.id)
    } catch {}
    finally { setSending(false) }
  }

  const getOther = (conv) => conv.participants.filter(p => p.id !== user?.id)

  const filteredConvs = conversations.filter(conv => {
    if (!searchQuery) return true
    return getOther(conv).some(p =>
      displayName(p).toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
    </div>
  )

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm mx-4 my-4">

      {/* ── Sidebar ── */}
      <div className="flex w-72 shrink-0 flex-col border-r border-slate-100">
        {/* Sidebar header */}
        <div className="border-b border-slate-100 px-4 py-4">
          <h2 className="mb-3 text-base font-black text-slate-950">Messages</h2>
          <div className="relative">
            <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filteredConvs.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">No conversations yet</div>
          ) : (
            filteredConvs.map(conv => {
              const others = getOther(conv)
              const isActive = selectedConversation?.id === conv.id
              const lastMsgPreview = conv.last_message?.content
                ? isSystemMessage(conv.last_message.content)
                  ? 'Session booking details'
                  : conv.last_message.content
                : ''
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`flex w-full items-center gap-3 border-b border-slate-50 px-4 py-3.5 text-left transition hover:bg-slate-50 ${
                    isActive ? 'bg-indigo-50/60 border-l-2 border-l-indigo-500' : ''
                  }`}
                >
                  {others[0] && <Avatar participant={others[0]} size="md" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${isActive ? 'font-black text-indigo-700' : 'font-bold text-slate-900'}`}>
                        {others.map(displayName).join(', ')}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    {lastMsgPreview && (
                      <p className="mt-0.5 truncate text-xs text-slate-400">{lastMsgPreview}</p>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── Chat area ── */}
      {selectedConversation ? (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5">
            {getOther(selectedConversation)[0] && (
              <Avatar participant={getOther(selectedConversation)[0]} size="md" />
            )}
            <div>
              <h2 className="font-black text-slate-950">
                {getOther(selectedConversation).map(displayName).join(', ')}
              </h2>
              <p className="flex items-center gap-1 text-[11px] text-emerald-500">
                <FaCircle className="text-[6px]" /> Active
              </p>
            </div>
          </div>

          {/* Session window banner */}
          {sessionWindow && (() => {
            const { status, session } = sessionWindow
            if (status === 'upcoming') return (
              <div className="mx-4 mt-3 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5">
                <FaClock className="shrink-0 text-blue-500" />
                <p className="text-xs font-black text-blue-700">
                  Session "{session.title}" starts at {session.start_time} on {session.scheduled_date} — chat open 15 min before
                </p>
              </div>
            )
            if (status === 'active') return (
              <div className="mx-4 mt-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
                <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-emerald-500" />
                <p className="text-xs font-black text-emerald-700">
                  Session active — ends at {session.end_time}. Chat available until 2h after session.
                </p>
              </div>
            )
            if (status === 'ended') return (
              <div className="mx-4 mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                <FaClock className="shrink-0 text-slate-400" />
                <p className="text-xs font-black text-slate-500">
                  Session ended. Chat closes 2 hours after session end time.
                </p>
              </div>
            )
            if (status === 'locked') return (
              <div className="mx-4 mt-3 flex items-center justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <FaLock className="shrink-0 text-rose-400" />
                  <p className="text-xs font-black text-rose-600">Session window closed. Book a new session to chat.</p>
                </div>
                <Link to="/consultants" className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-black text-white hover:bg-blue-500">
                  Book again
                </Link>
              </div>
            )
            return null
          })()}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map(msg => {
                const isMine = msg.sender.id === user?.id
                if (isSystemMessage(msg.content)) {
                  return <SessionCard key={msg.id} content={msg.content} time={timeStr(msg.created_at)} />
                }
                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                    {!isMine && <Avatar participant={msg.sender} size="sm" />}
                    <div className={`max-w-xs lg:max-w-md ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                      {!isMine && (
                        <p className="mb-0.5 ml-1 text-[11px] font-bold text-slate-500">
                          {displayName(msg.sender)}
                        </p>
                      )}
                      <div className={`rounded-2xl px-4 py-2.5 ${
                        isMine
                          ? 'rounded-br-sm bg-indigo-600 text-white'
                          : 'rounded-bl-sm bg-slate-100 text-slate-900'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <p className={`mt-0.5 text-[10px] text-slate-400 ${isMine ? 'text-right mr-1' : 'ml-1'}`}>
                        {timeStr(msg.created_at)}
                      </p>
                    </div>
                    {isMine && <Avatar participant={msg.sender} size="sm" />}
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="border-t border-slate-100 px-4 py-3">
            {sessionWindow?.status === 'locked' ? (
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3">
                <FaLock className="text-rose-400 text-xs" />
                <p className="text-xs font-black text-rose-500">Chat locked — session window closed</p>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-40"
                >
                  <FaPaperPlane className="text-xs" />
                </button>
              </div>
            )}
          </form>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <FaPaperPlane className="text-xl text-slate-300" />
          </div>
          <p className="font-black text-slate-400">Select a conversation</p>
          <p className="text-xs text-slate-300">Pick a chat from the left to start messaging</p>
        </div>
      )}
    </div>
  )
}
