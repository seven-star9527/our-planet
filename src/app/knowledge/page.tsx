import prisma from '@/lib/prisma';
import { addKnowledge } from '@/actions/knowledge';

export default async function KnowledgePage() {
  // 获取最近录入的 10 条
  const recents = await prisma.chatMessage.findMany({
    orderBy: { sendTime: 'desc' },
    take: 10
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">🧠 增加 AI 记忆</h1>
      
      {/* 录入表单 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-8">
        <form action={addKnowledge} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">内容类型</label>
            <select name="type" className="w-full p-2 border rounded-lg">
              <option value="note">重要笔记 (喜好、约定)</option>
              <option value="chat">补录聊天记录</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">记忆内容</label>
            <textarea 
              name="content" 
              rows={4}
              placeholder="例如：她说过如果不开心的时候，带她去吃火锅就好了..."
              className="w-full p-3 border rounded-lg"
              required
            />
          </div>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">
            存入大脑
          </button>
        </form>
      </div>

      {/* 最近记忆列表 */}
      <h2 className="text-lg font-bold mb-4 text-gray-700">最近录入的记忆</h2>
      <div className="space-y-3">
        {recents.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-400">
            <p className="text-gray-800">{item.content}</p>
            <p className="text-xs text-gray-400 mt-2">
              {new Date(item.sendTime).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}