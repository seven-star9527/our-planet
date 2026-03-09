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
        const now = new Date();
        // Get all messages where duration is 0 (permanent) or where current time is less than showAt + duration
        // prisma query might be a bit tricky with adding duration, so let's fetch roughly all possibly active 
        // messages and filter exactly in code, or we can use a raw query.
        // Given the scale, fetching recent messages is fine. Or fetch all where showAt <= now.

        const messages = await prisma.homeMessage.findMany({
            where: {
                showAt: {
                    lte: now, // Already started showing
                }
            },
            orderBy: {
                showAt: 'desc'
            }
        });

        const activeMessages = messages.filter((msg: any) => {
            if (msg.duration === 0) return true; // Show forever

            const endTime = new Date(msg.showAt.getTime() + msg.duration * 1000);
            return now <= endTime;
        });

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
