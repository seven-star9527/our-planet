import prisma from '@/lib/prisma';
import Link from 'next/link';
import MomentCard from './MomentCard'; // 引入刚才写的组件

export const dynamic = 'force-dynamic';

export default async function MomentsPage({ searchParams }: { searchParams: { tag?: string } }) {
  const tag = searchParams.tag;

  // 构造查询条件：如果有标签参数，就按标签查，否则查全部
  const whereCondition = tag ? { tags: { has: tag } } : {};

  const moments = await prisma.moment.findMany({
    where: whereCondition,
    orderBy: { createdAt: 'desc' },
    include: { comments: true, likes: true }, // 关键：要把关联数据一起查出来
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-gray-500 hover:text-gray-800 transition-colors p-2 -ml-2 rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-gray-800">📸 时光手账</h1>
          {tag && (
            <Link href="/moments" className="text-xs bg-pink-50 text-pink-500 px-2.5 py-1 rounded-full font-medium ml-1">
              #{tag} ✕
            </Link>
          )}
        </div>
        <Link href="/moments/new" className="bg-gradient-to-r from-pink-500 to-rose-400 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md shadow-pink-200 hover:shadow-lg transition-all transform hover:-translate-y-0.5">
          + 记一笔
        </Link>
      </div>

      {/* 列表流 */}
      <div className="max-w-md mx-auto p-4 mt-2">
        {moments.map((moment) => (
          <MomentCard key={moment.id} moment={moment} />
        ))}
        {moments.length === 0 && (
          <div className="text-center text-gray-400 py-20 text-sm">
            还没有记录哦，快去写下第一篇手账吧！
          </div>
        )}
      </div>
    </div>
  );
}