// src/app/period/page.tsx
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import PeriodClient from './PeriodClient';

export const dynamic = 'force-dynamic';

export default async function PeriodPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get('user_role')?.value;

  // 获取设置：女主是否可见
  const visibilitySetting = await prisma.appSetting.findFirst({ where: { key: 'period_visible_to_girl' } });
  const isVisibleToGirl = visibilitySetting?.value === 'true';

  // 权限拦截：如果是女主且未开启可见性，拦截回首页
  if (role === 'girl' && !isVisibleToGirl) {
    redirect('/');
  }

  // 获取过去半年的记录用于预测
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const records = await prisma.periodRecord.findMany({
    where: { startDate: { gte: sixMonthsAgo } },
    orderBy: { startDate: 'desc' }
  });

  // 将记录格式化传给客户端 (解决 Date 对象的序列化警告)
  const formattedRecords = records.map(r => r.startDate.toISOString());

  return (
    <div className="min-h-screen bg-rose-50/30 pb-20">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-rose-100 px-4 py-3 flex items-center shadow-sm">
        <Link href="/" className="text-rose-500 hover:text-rose-700 transition-colors p-2 -ml-2 rounded-full hover:bg-rose-50">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-rose-600 ml-2 flex items-center gap-2">
          🌸 她的呵护日历
        </h1>
      </div>

      <div className="max-w-lg mx-auto p-4 mt-2">
        <PeriodClient 
          records={formattedRecords} 
          role={role || 'boy'} 
          initialVisibility={isVisibleToGirl} 
        />
      </div>
    </div>
  );
}