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
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-gray-800">时光手账</h1>
          {tag && (
            <Link href="/moments" className="text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded-full">
              #{tag} ✕
            </Link>
          )}
        </div>
        <Link href="/moments/new" className="bg-pink-500 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-pink-200 shadow-md">
          + 记一笔
        </Link>
      </div>

      {/* 列表流 */}
      <div className="max-w-md mx-auto p-4">
        {moments.map((moment) => (
          <MomentCard key={moment.id} moment={moment} />
        ))}
      </div>
    </div>
  );
}