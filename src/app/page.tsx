import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // 获取关键数据摘要
  const bucketCount = await prisma.bucketList.count({ where: { status: 'TODO' } });
  const nextMilestone = await prisma.milestone.findFirst({ 
    where: { isCountdown: true, date: { gte: new Date() } },
    orderBy: { date: 'asc' }
  });

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部 Banner */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-8 pb-16 rounded-b-3xl shadow-lg">
        <h1 className="text-3xl font-bold mb-2">我们的专属星球 🌍</h1>
        <p className="opacity-90">第 128 天，天气晴</p>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-10 space-y-4">
        
        {/* 核心功能卡片网格 */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/moments" className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition">
            <div className="text-2xl mb-2">📸</div>
            <div className="font-bold text-gray-800">时光手账</div>
            <div className="text-xs text-gray-400">记录日常点滴</div>
          </Link>

          <Link href="/chat" className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition">
            <div className="text-2xl mb-2">🤖</div>
            <div className="font-bold text-gray-800">AI 记忆</div>
            <div className="text-xs text-gray-400">查询恋爱历史</div>
          </Link>
        </div>

        {/* 提醒卡片 */}
        <div className="bg-white p-5 rounded-2xl shadow-sm flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-700">📅 下个纪念日</h3>
            <p className="text-sm text-pink-500 font-medium">
              {nextMilestone ? nextMilestone.title : '暂无安排'}
            </p>
          </div>
          <Link href="/milestones" className="bg-pink-100 text-pink-600 px-4 py-2 rounded-full text-xs font-bold">
            查看全部
          </Link>
        </div>

        {/* 恋爱清单进度 */}
        <div className="bg-white p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-700">📝 待办清单</h3>
            <Link href="/bucket-list" className="text-xs text-blue-500">去许愿 &rarr;</Link>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div className="bg-blue-400 h-2.5 rounded-full" style={{ width: '30%' }}></div>
          </div>
          <p className="text-xs text-gray-400 mt-2">还有 {bucketCount} 个愿望待实现</p>
        </div>

      </div>
    </main>
  );
}