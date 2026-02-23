import prisma from '@/lib/prisma';
import { createMilestone, deleteMilestone } from '@/actions/features';

export const dynamic = 'force-dynamic';

function getDaysDiff(date: Date) {
  const now = new Date();
  const target = new Date(date);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 3600 * 24));
}

export default async function MilestonePage() {
  const milestones = await prisma.milestone.findMany({ orderBy: { date: 'asc' } });

  return (
    <div className="min-h-screen bg-pink-50 p-6">
      <h1 className="text-2xl font-bold text-pink-600 mb-6">📅 重要日子</h1>
      
      {/* 新建表单 */}
      <form action={createMilestone} className="bg-white p-4 rounded-xl shadow-sm mb-8 flex gap-2 flex-wrap">
        <input name="title" placeholder="事件名称" className="border p-2 rounded" required />
        <input type="date" name="date" className="border p-2 rounded" required />
        <select name="type" className="border p-2 rounded">
          <option value="anniversary">累计 (在一起X天)</option>
          <option value="countdown">倒数 (还有X天)</option>
        </select>
        <button className="bg-pink-500 text-white px-4 rounded">添加</button>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        {milestones.map(m => {
          const days = getDaysDiff(m.date);
          const isPast = days < 0;
          return (
            <div key={m.id} className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-700">{m.title}</h3>
                <p className="text-gray-400 text-sm">{m.date.toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                {m.isCountdown ? (
                  <span className="text-3xl font-black text-blue-500">{days > 0 ? days : 0}</span>
                ) : (
                  <span className="text-3xl font-black text-pink-500">{Math.abs(days)}</span>
                )}
                <span className="text-xs text-gray-500 block">天</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}