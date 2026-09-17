import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, Sparkles, User, BrainCircuit } from 'lucide-react'
import API from '../services/api'

const AIChat = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm your RetailOS AI Supply Chain Assistant. How can I help you optimize your logistics and inventories today?", sender: 'ai' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef(null)

  const suggestedPrompts = [
    "What products need reordering?",
    "Which warehouse has low stock?",
    "Summarize inventory status.",
    "Which supplier performs best?",
    "Why did laptop sales increase?"
  ]

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || input
    if (!query.trim()) return

    // Add user message
    const userMsg = { id: Date.now(), text: query, sender: 'user' }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await API.sendChatMessage(query)
      const aiMsg = { id: Date.now() + 1, text: res.data.response, sender: 'ai' }
      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: "Apologies, I encountered an issue querying the OpenAI Completion pipeline. Please verify your environment API key.", 
        sender: 'ai' 
      }])
    } finally {
      setLoading(false)
    }
  }

  const handlePillClick = (prompt) => {
    handleSendMessage(prompt)
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
      {/* Assistant Header */}
      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-brand-500 p-2.5 rounded-xl text-white shadow-lg shadow-brand-500/20">
            <BrainCircuit size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm">OpenAI Supply Assistant</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Contextualized with real-time stock levels, supplier rating metrics, and forecasts.</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-extrabold uppercase">
          <Sparkles size={10} /> Live Context
        </span>
      </div>

      {/* Suggested Prompts Pills */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none bg-slate-50/20">
        {suggestedPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handlePillClick(prompt)}
            className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 rounded-full text-[10px] font-bold text-slate-500 dark:text-slate-300 transition-all duration-200"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 max-w-[85%] ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            <div className={`p-2 rounded-xl shrink-0 ${
              msg.sender === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-brand-50 dark:bg-brand-950/20 text-brand-500'
            }`}>
              {msg.sender === 'user' ? <User size={14} /> : <BrainCircuit size={14} />}
            </div>
            <div className={`p-4 rounded-2xl text-xs font-semibold leading-relaxed whitespace-pre-line shadow-sm border ${
              msg.sender === 'user'
                ? 'bg-brand-600 text-white border-brand-700 rounded-tr-none'
                : 'bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 border-slate-100 dark:border-slate-800 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="bg-brand-50 dark:bg-brand-950/20 p-2 rounded-xl text-brand-500">
              <BrainCircuit size={14} />
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-800 text-xs text-slate-400">
              Generating response matching database statistics...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSendMessage()
        }}
        className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex gap-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something (e.g. 'What products need reordering?')"
          className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all duration-200"
        />
        <button
          type="submit"
          className="px-4 py-3 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-xl shadow-md flex items-center justify-center shrink-0 transition-all duration-200"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  )
}

export default AIChat
