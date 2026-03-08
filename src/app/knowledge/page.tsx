import prisma from '@/lib/prisma';
import { addKnowledge } from '@/actions/knowledge';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function KnowledgePage() {
  // 获取最近录入的 10 条
  const recents = await prisma.chatMessage.findMany({
    orderBy: { sendTime: 'desc' },
    take: 10
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center shadow-sm">
        <Link href="/chat" className="text-gray-500 hover:text-gray-800 transition-colors p-2 -ml-2 rounded-full hover:bg-gray-100">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-800 ml-2">🧠 训练 AI 大脑</h1>
      </div>
      
      <div className="max-w-xl mx-auto p-4 mt-2 space-y-6">
        {/* 录入表单卡片 */}
        <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100/50">
          <form action={addKnowledge} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">内容类型</label>
              <select name="type" className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all text-sm text-gray-700">
                <option value="note">📌 核心记忆 (如：她的喜好、重要约定)</option>
                <option value="chat">💬 历史聊天 (补充过去的聊天记录)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">记忆内容</label>
              <textarea 
                name="content" 
                rows={4}
                placeholder="例如：她说过如果不开心的时候，带她去吃顿好吃的火锅就好了..."
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl resize-none text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all text-gray-700 placeholder-gray-400"
                required
              />
            </div>
            <button className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 py-3.5 rounded-2xl font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 mt-2">
              存入大脑 💾
            </button>
          </form>
        </div>

        {/* 最近记忆列表 */}
        <div>
          <h2 className="text-sm font-bold mb-3 text-gray-500 px-2 flex items-center gap-2">
            <span>近期录入的记忆</span>
            <span className="flex-1 h-px bg-gray-200"></span>
          </h2>
          <div className="space-y-3">
            {recents.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100/50 relative overflow-hidden group hover:shadow-md transition-shadow">
                {/* 左侧装饰条 */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-400 to-purple-400"></div>
                
                <p className="text-gray-700 text-sm leading-relaxed pl-2 whitespace-pre-wrap">
                  {item.content}
                </p>
                <p className="text-[10px] text-gray-400 mt-2.5 pl-2 font-medium">
                  {new Date(item.sendTime).toLocaleString()}
                </p>
              </div>
            ))}
            
            {recents.length === 0 && (
              <div className="text-center text-gray-400 py-10 text-sm bg-white rounded-2xl border border-dashed border-gray-200">
                AI 的大脑还是空空的，快来教教它吧！
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}