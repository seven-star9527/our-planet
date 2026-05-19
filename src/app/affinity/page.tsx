import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getSettings } from '@/actions/settings';
import AffinityClient from './AffinityClient';

export const dynamic = 'force-dynamic';

export default async function AffinityPage() {
    const cookieStore = await cookies();
    const role = cookieStore.get('user_role')?.value || 'boy';
    const otherRole = role === 'boy' ? 'girl' : 'boy';
    const settings = await getSettings();
    const boyName = settings.boyName || '男主';
    const girlName = settings.girlName || '女主';

    // 获取"我给对方"的分数
    let myScore = await prisma.affinityScore.findUnique({
        where: { fromRole_toRole: { fromRole: role, toRole: otherRole } }
    });
    if (!myScore) {
        myScore = await prisma.affinityScore.create({
            data: { fromRole: role, toRole: otherRole, favorability: 50, intimacy: 50 }
        });
    }

    // 获取"对方给我"的分数
    let theirScore = await prisma.affinityScore.findUnique({
        where: { fromRole_toRole: { fromRole: otherRole, toRole: role } }
    });
    if (!theirScore) {
        theirScore = await prisma.affinityScore.create({
            data: { fromRole: otherRole, toRole: role, favorability: 50, intimacy: 50 }
        });
    }

    // 获取"我给对方"的记录（对方可以看到）
    const myLogs = await prisma.affinityLog.findMany({
        where: { fromRole: role, toRole: otherRole },
        orderBy: { createdAt: 'desc' },
        take: 30,
    });

    // 获取"对方给我"的记录
    const theirLogs = await prisma.affinityLog.findMany({
        where: { fromRole: otherRole, toRole: role },
        orderBy: { createdAt: 'desc' },
        take: 30,
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
            {/* 顶部导航 */}
            <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center shadow-sm">
                <Link href="/" className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-colors p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100 ml-2">💞 好感度与亲密度</h1>
            </div>

            <div className="max-w-lg mx-auto px-4 py-6">
                <AffinityClient
                    role={role}
                    otherRole={otherRole}
                    boyName={boyName}
                    girlName={girlName}
                    myScore={{ favorability: myScore.favorability, intimacy: myScore.intimacy }}
                    theirScore={{ favorability: theirScore.favorability, intimacy: theirScore.intimacy }}
                    myLogs={myLogs.map((l: any) => ({
                        id: l.id,
                        type: l.type,
                        delta: l.delta,
                        reason: l.reason,
                        createdAt: l.createdAt.toISOString(),
                    }))}
                    theirLogs={theirLogs.map((l: any) => ({
                        id: l.id,
                        type: l.type,
                        delta: l.delta,
                        reason: l.reason,
                        createdAt: l.createdAt.toISOString(),
                    }))}
                />
            </div>
        </div>
    );
}
