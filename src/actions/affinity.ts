'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// 获取好感度分数（如果不存在则自动创建默认值）
export async function getAffinityScore(fromRole: string, toRole: string) {
    let score = await prisma.affinityScore.findUnique({
        where: { fromRole_toRole: { fromRole, toRole } }
    });

    if (!score) {
        score = await prisma.affinityScore.create({
            data: { fromRole, toRole, favorability: 50, intimacy: 50 }
        });
    }

    return score;
}

// 获取双方的分数
export async function getAllScores() {
    const boyToGirl = await getAffinityScore('boy', 'girl');
    const girlToBoy = await getAffinityScore('girl', 'boy');
    return { boyToGirl, girlToBoy };
}

// 加/减分并记录事由
export async function adjustAffinity(formData: FormData) {
    const fromRole = formData.get('fromRole') as string;
    const toRole = formData.get('toRole') as string;
    const type = formData.get('type') as string; // "favorability" | "intimacy"
    const delta = parseInt(formData.get('delta') as string);
    const reason = formData.get('reason') as string;

    if (!fromRole || !toRole || !type || isNaN(delta) || !reason?.trim()) {
        return { success: false, error: '请填写完整信息' };
    }

    try {
        // 确保分数记录存在
        let score = await getAffinityScore(fromRole, toRole);

        // 计算新分数（限制在 0-100 范围内）
        const currentValue = type === 'favorability' ? score.favorability : score.intimacy;
        const newValue = Math.max(0, Math.min(100, currentValue + delta));

        // 更新分数
        await prisma.affinityScore.update({
            where: { id: score.id },
            data: {
                [type]: newValue,
            }
        });

        // 记录变更日志
        await prisma.affinityLog.create({
            data: {
                fromRole,
                toRole,
                type,
                delta,
                reason: reason.trim(),
            }
        });

        revalidatePath('/affinity');
        return { success: true };
    } catch (error) {
        console.error('调整好感度失败:', error);
        return { success: false, error: '操作失败，请重试' };
    }
}

// 获取变更日志
export async function getAffinityLogs(fromRole?: string, toRole?: string) {
    const where: any = {};
    if (fromRole) where.fromRole = fromRole;
    if (toRole) where.toRole = toRole;

    return prisma.affinityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
    });
}
