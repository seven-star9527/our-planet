import prisma from '@/lib/prisma';
import { createBucketItem, updateBucketStatus } from '@/actions/features';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function BucketListPage() {
  const items = await prisma.bucketList.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <h1 className="text-2xl font-bold text-blue-600 mb-6">📝 恋爱清单 (100件事)</h1>
      
      <form action={createBucketItem} className="mb-8 flex gap-2">
        <input name="title" placeholder="想和你一起做..." className="flex-1 p-3 rounded-xl border-none shadow-sm" required />
        <button className="bg-blue-500 text-white px-6 rounded-xl font-bold">许愿</button>
      </form>

      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className={`p-4 rounded-xl flex justify-between items-center ${item.status === 'DONE' ? 'bg-gray-200 opacity-70' : 'bg-white shadow-sm'}`}>
            <span className={item.status === 'DONE' ? 'line-through text-gray-500' : 'font-medium'}>{item.title}</span>
            
            <div className="flex gap-2">
              {item.status === 'TODO' && (
                <form action={updateBucketStatus.bind(null, item.id, 'DOING')}>
                  <button className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full">开始做</button>
                </form>
              )}
              {item.status === 'DOING' && (
                <Link 
                  href={`/moments/new?content=我们终于完成了：${item.title}！&bucketId=${item.id}`}
                  className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full"
                >
                  ✅ 达成
                </Link>
              )}
              {item.status === 'DONE' && <span className="text-xs text-green-600">已达成</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}