import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { Send, Bot, User, Mic, FileText, List, HelpCircle, Globe, AlertTriangle, BookOpen, Table } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_ACTIONS = [
  { id: 'summary', icon: FileText, label: 'Summarize', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'key_points', icon: List, label: 'Key Points', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'faq', icon: HelpCircle, label: 'Generate FAQ', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { id: 'translate', icon: Globe, label: 'Translate', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { id: 'explain', icon: BookOpen, label: 'Explain Terms', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { id: 'tables', icon: Table, label: 'Extract Tables', color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
  { id: 'risks', icon: AlertTriangle, label: 'Find Risks', color: 'text-red-600 bg-red-50 border-red-200' },
];

export default function ChatPanel({ messages, isTyping, onSendMessage, onQuickAction, onReferenceClick }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    onSendMessage(input);
    setInput('');
  };

  // Helper to render text with page references
  const renderMessageContent = (content) => {
    const parts = content.split(/(\[📄 Pg \d+\])/g);
    return parts.map((part, i) => {
      if (part.match(/\[📄 Pg \d+\]/)) {
        const pageNum = parseInt(part.match(/\d+/)[0]);
        return (
          <button
            key={i}
            onClick={() => onReferenceClick(pageNum)}
            className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-1.5 py-0.5 rounded text-xs font-bold transition-colors mx-1 cursor-pointer"
          >
            {part}
          </button>
        );
      }
      return <span key={i} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(part.replace(/\n/g, '<br/>')) }} />;
    });
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="border-b border-gray-100 px-5 py-4 shrink-0 bg-white z-10 flex items-center gap-3 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-800">AI PDF Assistant</h2>
          <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online & Ready
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-slate-50/50">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-indigo-600'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              
              <div className={`p-3.5 rounded-2xl shadow-sm text-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-sm' 
                  : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
              }`}>
                {msg.role === 'ai' ? renderMessageContent(msg.text) : msg.text}
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 shrink-0 rounded-full bg-white border border-gray-200 flex items-center justify-center text-indigo-600 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-white border border-gray-100 rounded-tl-sm flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions Scroll */}
      <div className="shrink-0 bg-white border-t border-gray-100 p-2">
        <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar hide-scrollbar-mobile px-2">
          {QUICK_ACTIONS.map(action => (
            <button
              key={action.id}
              onClick={() => onQuickAction(action)}
              disabled={isTyping}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap transition-all hover:shadow-sm disabled:opacity-50 ${action.color}`}
            >
              <action.icon className="w-3.5 h-3.5" />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white shrink-0">
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-1 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 transition-all shadow-inner">
          <button type="button" className="p-3 text-gray-400 hover:text-indigo-600 transition-colors shrink-0 md:hidden">
            <Mic className="w-5 h-5" />
          </button>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
            }}
            placeholder="Ask anything about this PDF (in any language)..."
            className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none focus:ring-0 resize-none py-3 px-2 md:pl-4 text-sm text-gray-800 placeholder-gray-400"
            rows={1}
          />
          
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-indigo-600 shrink-0 m-1 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-center text-[10px] text-gray-400 mt-2 font-medium">
          AI can make mistakes. Verify important information from the PDF.
        </p>
      </div>
    </div>
  );
}
