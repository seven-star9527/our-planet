'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createMessage(data: {
    sender: string;
    content: string;
    fontFamily?: string;
    color: string;
    size: string;
    isAnimated: boolean;
    showAt: Date;
    duration: number;
}) {
    try {
        const newMessage = await prisma.homeMessage.create({
            data: {
                sender: data.sender,
                content: data.content,
                fontFamily: data.fontFamily || null,
                color: data.color,
                size: data.size,
                isAnimated: data.isAnimated,
                showAt: data.showAt,
                duration: data.duration,
            },
        });

        // Revalidate home page path to ensure messages show up
        revalidatePath('/');

        return { success: true, data: newMessage };
    } catch (error) {
        console.error('Error creating message:', error);
        return { success: false, error: '留言发布失败' };
    }
}

export async function getActiveMessages() {
    try {
        // Filter at database level: permanent (duration=0) or still within duration window
        const activeMessages: any[] = await prisma.$queryRaw`
            SELECT * FROM home_messages
            WHERE "showAt" <= NOW()
              AND (duration = 0 OR "showAt" + (duration * INTERVAL '1 second') >= NOW())
            ORDER BY "showAt" DESC
        `;

        return { success: true, data: activeMessages };
    } catch (error) {
        console.error('Error fetching active messages:', error);
        return { success: false, data: [] };
    }
}

export async function deleteMessage(id: number) {
    try {
        await prisma.homeMessage.delete({
            where: { id }
        });
        revalidatePath('/');
        revalidatePath('/messages');
        return { success: true };
    } catch (error) {
        console.error('删除留言失败:', error);
        return { success: false, error: '删除留言失败' };
    }
}
