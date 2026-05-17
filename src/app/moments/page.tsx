import prisma from '@/lib/prisma';
import Link from 'next/link';
import MomentCard from './MomentCard';

export const dynamic = 'force-dynamic';
const PAGE_SIZE = 12;

function Pagination({ page, totalPages, tag }: { page: number; totalPages: number; tag?: string }) {
  if (totalPages <= 1) return null;

  const tagParam = tag ? `&tag=${tag}` : '';

  return (
    <div className="flex items-center justify-center gap-3 mt-8 pb-4">
      {page > 1 && (
        <Link
          href={`/moments?page=${page - 1}${tagParam}`}
          className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          上一页
        </Link>
      )}
      <span className="text-sm text-gray-400">
        {page} / {totalPages}
      </span>
      {page < totalPages && (
        <Link
          href={`/moments?page=${page + 1}${tagParam}`}
          className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          下一页
        </Link>
      )}
    </div>
  );
}

export default async function MomentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; page?: string }>;
}) {
  const params = await searchParams;
  const tag = params.tag;
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);

  const whereCondition = tag ? { tags: { has: tag } } : {};

  const [moments, totalCount] = await Promise.all([
    prisma.moment.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      include: { comments: true, likes: true },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.moment.count({ where: whereCondition }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top navigation */}
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
          <span className="text-xs text-gray-400 ml-1">({totalCount})</span>
        </div>
        <Link href="/moments/new" className="bg-gradient-to-r from-pink-500 to-rose-400 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md shadow-pink-200 hover:shadow-lg transition-all transform hover:-translate-y-0.5">
          + 记一笔
        </Link>
      </div>

      {/* List */}
      <div className="max-w-md mx-auto p-4 mt-2">
        {moments.map((moment) => (
          <MomentCard key={moment.id} moment={moment} />
        ))}
        {moments.length === 0 && (
          <div className="text-center text-gray-400 py-20 text-sm">
            还没有记录哦，快去写下第一篇手账吧！
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} tag={tag} />
      </div>
    </div>
  );
}
