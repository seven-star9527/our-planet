'use client'
import { useState } from 'react';

export default function ChatPage() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    setLoading(true);
    const res = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    setAnswer(data.answer);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-8 text-purple-600">🤖 恋爱记忆助手</h1>
      
      <div className="w-full max-w-lg bg-white p-6 rounded-2xl shadow-sm">
        <textarea 
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="问我关于你们的回忆... 例如：去年情人节我们去哪了？"
          className="w-full p-3 border rounded-xl mb-4 h-32"
        />
        <button 
          onClick={handleAsk}
          disabled={loading}
          className="w-full bg-purple-500 text-white py-3 rounded-xl font-bold"
        >
          {loading ? '回忆检索中...' : '提问'}
        </button>

        {answer && (
          <div className="mt-6 p-4 bg-purple-50 rounded-xl text-gray-700 leading-relaxed">
            <span className="font-bold block mb-2">AI 回答：</span>
            {answer}
          </div>
        )}
      </div>
    </div>
  );
}