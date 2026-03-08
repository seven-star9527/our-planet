import prisma from '@/lib/prisma';
import Link from 'next/link';
import { cookies } from 'next/headers';

// npm run dev

export const dynamic = 'force-dynamic';

export default async function Home() {
  const cookieStore = await cookies();
  const role = cookieStore.get('user_role')?.value;

  const periodSetting = await prisma.appSetting.findFirst({ where: { key: 'period_visible_to_girl' } });
  const isPeriodVisibleToGirl = periodSetting?.value === 'true';

  // 决定是否展示呵护日历入口：男生永远可见，女生需男生授权
  const showPeriodTracker = role === 'boy' || (role === 'girl' && isPeriodVisibleToGirl);

  // 1. 获取基础数据
  const bucketCount = await prisma.bucketList.count({ where: { status: 'TODO' } });
  const nextMilestone = await prisma.milestone.findFirst({
    where: { isCountdown: true, date: { gte: new Date() } },
    orderBy: { date: 'asc' }
  });

  const anniversarySetting = await prisma.appSetting.findFirst({
    where: { key: 'anniversaryDate' }
  });
  const anniversaryDate = anniversarySetting?.value;

  let daysTogether = 0;
  if (anniversaryDate) {
    const today = new Date();
    const startDate = new Date(anniversaryDate);
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    daysTogether = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // 2. 获取“那年今日” (随机掉落的记忆)
  const momentCount = await prisma.moment.count();
  const randomSkip = Math.max(0, Math.floor(Math.random() * momentCount));
  const randomMemory = momentCount > 0 ? await prisma.moment.findFirst({
    skip: randomSkip,
    orderBy: { createdAt: 'desc' }
  }) : null;

  // 3. 获取近期照片 (取最近10条带有图片的手账)
  const recentMoments = await prisma.moment.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  const recentPhotos = recentMoments
    .filter(m => m.images && m.images.length > 0)
    .flatMap(m => m.images)
    .slice(0, 6);

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部 Banner */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white pt-16 px-8 pb-32 rounded-b-[40px] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-white opacity-10 rounded-full translate-y-1/3 -translate-x-1/4"></div>

        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold mb-2 tracking-tight drop-shadow-sm">
            我们的专属星球 🌍
          </h1>
          <p className="opacity-95 text-sm md:text-base font-medium drop-shadow-sm">
            在一起的第 <span className="font-bold text-lg">{daysTogether}</span> 天
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-20 relative z-20 space-y-4">

        {/* 那年今日 / 随机记忆盲盒 */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl transform rotate-12">🕰️</div>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-indigo-50 text-indigo-500 text-xs font-bold px-2.5 py-1 rounded-full">
              ✨ 记忆盲盒
            </span>
            <span className="text-xs text-gray-400 font-medium">
              {randomMemory ? new Date(randomMemory.createdAt).toLocaleDateString() : '尚未解锁'}
            </span>
          </div>

          {randomMemory ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed italic line-clamp-3">
                "{randomMemory.content}"
              </p>
              {randomMemory.images && randomMemory.images.length > 0 && (
                <div className="w-full h-32 rounded-2xl overflow-hidden relative">
                  <img src={randomMemory.images[0]} alt="Memory" className="object-cover w-full h-full" />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              写下第一篇手账，开启我们的回忆！
            </div>
          )}
        </div>

        {/* 核心功能卡片网格 */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <Link href="/moments" className="bg-white p-5 md:p-6 rounded-3xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-100/50">
            <div className="text-3xl md:text-4xl mb-3 drop-shadow-sm">📸</div>
            <div className="font-bold text-gray-800 text-sm md:text-base">时光手账</div>
            <div className="text-xs text-gray-400 mt-1">记录日常点滴</div>
          </Link>

          <Link href="/bucket-list" className="bg-white p-5 md:p-6 rounded-3xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-100/50">
            <div className="text-3xl md:text-4xl mb-3 drop-shadow-sm">📝</div>
            <div className="font-bold text-gray-800 text-sm md:text-base">恋爱清单</div>
            <div className="text-xs text-gray-400 mt-1">还有 {bucketCount} 个愿望</div>
          </Link>
        </div>


        {/* 提醒卡片 */}
        <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm transition-all duration-300 border border-gray-100/50 flex justify-between items-center">
          <div className="flex-1">
            <h3 className="font-bold text-gray-700 text-sm flex items-center gap-1.5">
              📅 下个纪念日
            </h3>
            <p className="text-sm text-pink-500 font-bold mt-1 truncate">
              {nextMilestone ? nextMilestone.title : '暂无安排'}
            </p>
          </div>
          <Link href="/milestones" className="bg-gradient-to-r from-pink-50 to-purple-50 text-pink-600 px-4 py-2 rounded-full text-xs font-bold hover:from-pink-100 hover:to-purple-100 transition-colors ml-2 whitespace-nowrap">
            查看全部
          </Link>
        </div>

        {/* ✨ 修改：快捷操作区域 (改成3列，加入地图) */}
        <div className="grid grid-cols-3 gap-3">
          <Link href="/footprint" className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100/50 flex flex-col items-center justify-center">
            <div className="text-2xl mb-1.5 drop-shadow-sm">🗺️</div>
            <div className="text-xs text-gray-700 font-medium">点亮足迹</div>
          </Link>
          <Link href="/moments/new" className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100/50 flex flex-col items-center justify-center">
            <div className="text-2xl mb-1.5 drop-shadow-sm">✨</div>
            <div className="text-xs text-gray-700 font-medium">记录瞬间</div>
          </Link>
          <Link href="/settings" className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100/50 flex flex-col items-center justify-center">
            <div className="text-2xl mb-1.5 drop-shadow-sm">⚙️</div>
            <div className="text-xs text-gray-700 font-medium">设置</div>
          </Link>
          {showPeriodTracker && (
            <Link href="/period" className="col-span-3 bg-gradient-to-r from-rose-50 to-pink-50 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-rose-100 flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">🌸</div>
                <div>
                  <div className="text-sm font-bold text-rose-600">呵护日历</div>
                  <div className="text-xs text-rose-400 mt-0.5">关心她的每一天</div>
                </div>
              </div>
              <div className="text-rose-300 font-bold">&rarr;</div>
            </Link>
          )}
          <Link href="/affinity" className="col-span-3 bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-pink-100 flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">💕</div>
              <div>
                <div className="text-sm font-bold text-pink-600">好感度与亲密度</div>
                <div className="text-xs text-pink-400 mt-0.5">给 TA 打个分吧</div>
              </div>
            </div>
            <div className="text-pink-300 font-bold">&rarr;</div>
          </Link>
        </div>

        {/* 近期照片流 (横向滑动) */}
        {recentPhotos.length > 0 && (
          <div className="pt-4">
            <div className="flex justify-between items-end mb-3 px-1">
              <h3 className="font-bold text-gray-700 text-sm flex items-center gap-1.5">
                🖼️ 近期快照
              </h3>
              <Link href="/moments" className="text-xs text-gray-400 hover:text-pink-500 font-medium transition-colors">
                全部照片 &rarr;
              </Link>
            </div>
            {/* 横向滚动容器，隐藏滚动条 */}
            <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {recentPhotos.map((photo, index) => (
                <div key={index} className="shrink-0 snap-center">
                  <div className="w-28 h-36 md:w-32 md:h-40 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                    <img src={photo} alt="Recent" className="object-cover w-full h-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ICP 备案信息页脚 */}
      <footer className="mt-12 pb-6 text-center text-xs text-gray-400">
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer" className="hover:text-gray-600 transition-colors">
          赣ICP备2026003793号
        </a>
      </footer>
    </main>
  );
}