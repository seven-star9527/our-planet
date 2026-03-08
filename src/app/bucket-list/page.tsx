import prisma from '@/lib/prisma';
import { createBucketItem, updateBucketStatus } from '@/actions/features';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function BucketListPage() {
  const items = await prisma.bucketList.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部导航 */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100 px-4 py-3 flex items-center shadow-sm">
        <Link href="/" className="text-gray-500 hover:text-gray-800 transition-colors p-2 -ml-2 rounded-full hover:bg-gray-100">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-800 ml-2">📝 恋爱清单</h1>
        <div className="ml-auto text-xs font-medium text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full">
          {items.filter(i => i.status === 'DONE').length} / {items.length} 已达成
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-6 mt-2">
        {/* 输入框区域 */}
        <form action={createBucketItem} className="flex gap-2">
          <input 
            name="title" 
            placeholder="想和你一起做..." 
            className="flex-1 p-3.5 rounded-2xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all text-sm" 
            required 
          />
          <button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 rounded-2xl font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 text-sm">
            许愿 ✨
          </button>
        </form>

        {/* 列表区域 */}
        <div className="space-y-3">
          {items.map(item => (
            <div 
              key={item.id} 
              className={`p-4 rounded-2xl flex justify-between items-center transition-all duration-300 border ${
                item.status === 'DONE' 
                  ? 'bg-gray-50 border-gray-100 opacity-75' 
                  : 'bg-white border-gray-100/50 shadow-sm hover:shadow-md'
              }`}
            >
              <span className={`text-sm md:text-base ${item.status === 'DONE' ? 'line-through text-gray-400' : 'font-medium text-gray-800'}`}>
                {item.title}
              </span>
              
              <div className="flex gap-2 shrink-0 ml-4">
                {item.status === 'TODO' && (
                  <form action={updateBucketStatus.bind(null, item.id, 'DOING')}>
                    <button className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 px-3 py-1.5 rounded-full font-medium transition-colors">
                      开始做
                    </button>
                  </form>
                )}
                {item.status === 'DOING' && (
                  <Link 
                    href={`/moments/new?content=我们终于完成了：${item.title}！&bucketId=${item.id}`}
                    className="text-xs bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1.5 rounded-full font-bold shadow-sm hover:shadow transition-all"
                  >
                    ✅ 达成
                  </Link>
                )}
                {item.status === 'DONE' && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full font-medium">
                    已达成
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {items.length === 0 && (
            <div className="text-center text-gray-400 py-10 text-sm">
              还没有愿望哦，快添加一个吧！
            </div>
          )}
        </div>
      </div>
    </div>
  );
}