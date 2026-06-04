import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Brain, Compass } from 'lucide-react';
import { api } from '../services/api.js';

const initialMessages = [
  {
    id: 'bot-1',
    from: 'bot',
    text: 'Hello! I am your AI Market Assistant. Ask me anything about current prices, market trends, portfolio signal analysis, or watchlist highlights.',
  },
];

const suggestedPrompts = [
  'What are the top gainers?',
  'Is Bitcoin bullish?',
  'Explain rebalancing advice',
];

const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function ChatBot() {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const scroller = useRef(null);

  useEffect(() => {
    if (scroller.current) {
      scroller.current.scrollTop = scroller.current.scrollHeight;
    }
  }, [messages, chatOpen]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const trimmedText = text.trim();

    const userMessage = {
      id: createId(),
      from: 'user',
      text: trimmedText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const history = [...messages, userMessage]
        .filter(
          (msg) => msg.from === 'user' || msg.from === 'bot'
        )
        .slice(-10);

      const response = await api.chat(trimmedText, history);

      const replyText =
        response?.reply ||
        response?.data?.reply ||
        'Sorry, I did not get a response.';

      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          from: 'bot',
          text: replyText,
        },
      ]);
    } catch (error) {
      console.error('Chat Error:', error);

      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Sorry, I could not get an AI answer right now. Please try again.';

      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          from: 'bot',
          text: backendMessage,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="w-[360px] sm:w-[380px] rounded-3xl border border-white/8 bg-[#0b0d18]/95 shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 bg-white/2 p-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-cyanGlow/10 text-cyanGlow shadow-[0_0_10px_rgba(40,215,255,0.15)]">
                  <Brain size={16} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-white">
                    Market Assistant
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Ask about portfolio or live analytics
                  </p>
                </div>
              </div>

              <button
                onClick={() => setChatOpen(false)}
                className="p-1.5 rounded-lg border border-white/5 bg-white/5 text-slate-400 hover:text-white transition"
              >
                <X size={14} />
              </button>
            </div>

            {/* Message Area */}
            <div
              ref={scroller}
              className="h-[320px] overflow-y-auto p-4 space-y-4 flex flex-col scrollbar-thin"
            >
              {messages.map((message) => {
                const isBot = message.from === 'bot';
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-md border ${
                        isBot
                          ? 'bg-white/5 border-white/5 text-slate-100 rounded-tl-none'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 border-white/10 text-white rounded-tr-none'
                      }`}
                    >
                      {message.text}
                    </div>
                  </motion.div>
                );
              })}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex gap-1 items-center bg-white/5 border border-white/5 rounded-2xl rounded-tl-none px-4 py-3 w-fit">
                    <div className="w-1.5 h-1.5 bg-cyanGlow rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-cyanGlow rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-cyanGlow rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Suggested Prompts */}
            <div className="px-4 py-2 bg-white/2 border-t border-white/5 flex flex-wrap gap-1.5 items-center">
              <Compass size={12} className="text-cyanGlow shrink-0" />
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  disabled={loading}
                  className="rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-cyanGlow/30 text-[9px] font-bold text-slate-300 hover:text-white px-2.5 py-1 transition-all duration-200"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSubmit}
              className="border-t border-white/5 p-4 bg-white/2"
            >
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me about market insights..."
                  disabled={loading}
                  className="flex-1 rounded-xl border border-white/8 bg-[#050505] px-3.5 py-2 text-xs text-white outline-none focus:border-cyanGlow/40 transition placeholder:text-slate-500"
                />

                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyanGlow hover:bg-cyanGlow/95 text-slate-950 shadow-[0_0_15px_rgba(40,215,255,0.25)] transition hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setChatOpen((prev) => !prev)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-cyanGlow via-blue-500 to-purple-600 text-white shadow-[0_4px_20px_rgba(14,165,233,0.35)] hover:shadow-[0_4px_30px_rgba(14,165,233,0.5)] transition duration-200"
      >
        {chatOpen ? <X size={20} /> : <MessageSquare size={20} />}
      </motion.button>
    </div>
  );
}