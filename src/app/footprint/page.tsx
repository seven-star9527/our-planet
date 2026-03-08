import prisma from '@/lib/prisma';
import Link from 'next/link';
import FootprintClient from './FootprintClient'; // 引入客户端交互组件

export const dynamic = 'force-dynamic';

export default async function FootprintPage() {
  // 获取所有足迹数据
  const footprints = await prisma.footprint.findMany({
    orderBy: { createdAt: 'desc' }
  });

  // 对数据按城市进行分组
const cityData = footprints.reduce((acc: Record<string, any[]>, curr: any) => {
  if (!acc[curr.city]) acc[curr.city] = [];
  acc[curr.city].push(curr);
  return acc;
}, {});

  return (
    <div className="min-h-screen bg-gray-50 pb-20 flex flex-col">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center shadow-sm">
        <Link href="/" className="text-gray-500 hover:text-gray-800 transition-colors p-2 -ml-2 rounded-full hover:bg-gray-100">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-800 ml-2">🗺️ 我们的足迹</h1>
        <div className="ml-auto text-xs font-bold text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-full">
          已点亮 {Object.keys(cityData).length} 座城市
        </div>
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col md:flex-row gap-4 mt-2 h-full">
        {/* 将数据传给客户端组件处理交互逻辑 */}
        <FootprintClient cityData={cityData} rawData={footprints} />
      </div>
    </div>
  );
}