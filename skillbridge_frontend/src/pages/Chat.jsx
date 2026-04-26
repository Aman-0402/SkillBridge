import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function Chat() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
    }
  }, [selectedConversation])

  const fetchConversations = async () => {
    try {
      const response = await api.get('/chat/conversations/')
      setConversations(Array.isArray(response.data) ? response.data : response.data.results || [])
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId) => {
    try {
      const response = await api.get(`/chat/messages/?conversation_id=${conversationId}`)
      setMessages(Array.isArray(response.data) ? response.data : response.data.results || [])
      // Mark as read
      await api.post(`/chat/conversations/${conversationId}/mark_as_read/`)
      fetchConversations()
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    try {
      await api.post('/chat/messages/send_message/', {
        conversation_id: selectedConversation.id,
        content: newMessage,
      })
      setNewMessage('')
      fetchMessages(selectedConversation.id)
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message')
    }
  }

  const startConversation = async (userId) => {
    try {
      const response = await api.post('/chat/conversations/start_conversation/', {
        user_id: userId,
      })
      setSelectedConversation(response.data)
      fetchConversations()
    } catch (error) {
      console.error('Failed to start conversation:', error)
    }
  }

  const getOtherParticipants = (conversation) => {
    return conversation.participants.filter(p => p.id !== user?.id)
  }

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">SkillBridge Messages</h1>
          <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 h-screen">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
          {/* Conversations List */}
          <div className="bg-white rounded-lg shadow flex flex-col">
            <div className="p-4 border-b">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Messages</h2>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-4 text-gray-600 text-center">No conversations yet</div>
              ) : (
                conversations.map(conv => {
                  const otherParticipants = getOtherParticipants(conv)
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full text-left p-4 border-b hover:bg-gray-50 transition ${
                        selectedConversation?.id === conv.id ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {otherParticipants.map(p => p.username).join(', ')}
                          </p>
                          {conv.last_message && (
                            <p className="text-sm text-gray-600 truncate">{conv.last_message.content}</p>
                          )}
                        </div>
                        {conv.unread_count > 0 && (
                          <span className="bg-indigo-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Chat View */}
          {selectedConversation ? (
            <div className="md:col-span-2 bg-white rounded-lg shadow flex flex-col">
              {/* Header */}
              <div className="p-4 border-b">
                <h2 className="text-lg font-bold text-gray-900">
                  {getOtherParticipants(selectedConversation)
                    .map(p => p.username)
                    .join(', ')}
                </h2>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-600">No messages yet. Start the conversation!</div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender.id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.sender.id === user?.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="font-semibold text-sm">{msg.sender.username}</p>
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="md:col-span-2 bg-white rounded-lg shadow flex items-center justify-center">
              <p className="text-gray-600">Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
