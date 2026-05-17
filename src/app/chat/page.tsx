'use client'

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';

// 定义消息类型
type Message = {
  role: 'user' | 'ai';
  content: string;
};

// 生成唯一会话 ID
function generateSessionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 会话 ID 在页面生命周期内保持不变
  const sessionId = useMemo(() => generateSessionId(), []);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input };
    setInput('');
    const currentMessages: Message[] = [...messages, userMsg];
    setMessages(currentMessages);
    setLoading(true);

    // Build conversation history for backend
    const history = currentMessages.slice(-10).map(m => ({
      role: m.role === 'user' ? 'user' as const : 'assistant' as const,
      content: m.content,
    }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, sessionId, history }),
      });

      const data = await res.json();

      if (data.answer) {
        setMessages(prev => [...prev, { role: 'ai', content: data.answer }]);
      } else if (data.error) {
        setMessages(prev => [...prev, { role: 'ai', content: `出了点小问题：${data.error} 😣` }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: "小七暂时没听懂，再说一次吧～ 😅" }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "网络有点小问题，请稍后再试 😣" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 顶部栏 */}
      <div className="bg-white/80 backdrop-blur-md p-3 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-gray-500 hover:text-gray-800 transition-colors p-2 -ml-2 rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            🤖 小七同学
          </h1>
        </div>

        {/* 右侧：状态标签 + 补充记忆入口 */}
        <div className="flex items-center gap-2">
          <span className="hidden md:inline-block text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full shadow-sm">
            DeepSeek Online
          </span>
          {/* 这里是跳转到 Knowledge 知识库页面的按钮 */}
          <Link href="/knowledge" className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-full font-bold transition-colors flex items-center gap-1">
            <span>✍️</span> 补充记忆
          </Link>
        </div>
      </div>

      {/* 消息列表区 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-2xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-32 space-y-3">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <span className="text-4xl">💭</span>
            </div>
            <p className="font-medium text-gray-600">我是小七同学</p>
            <p className="text-sm">试着问我：“我们第一次约会是哪天？”</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              max-w-[85%] md:max-w-[75%] p-3.5 text-sm md:text-base leading-relaxed shadow-sm
              ${msg.role === 'user'
                ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-2xl rounded-tr-sm'
                : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm'}
            `}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm p-3.5 shadow-sm flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* 输入框区 */}
      <div className="p-3 bg-white/80 backdrop-blur-md border-t border-gray-100 pb-safe">
        <div className="max-w-2xl mx-auto flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="问问 小七 以前发生的事..."
            className="flex-1 max-h-32 min-h-[44px] p-3 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all text-sm resize-none text-gray-900 placeholder:text-gray-400"
            rows={1}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="h-[44px] bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-5 rounded-2xl font-bold hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 flex items-center justify-center"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}