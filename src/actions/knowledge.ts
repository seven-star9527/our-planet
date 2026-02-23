'use server'

import prisma from '@/lib/prisma';
import { generateEmbedding } from '@/lib/ai';
import { redirect } from 'next/navigation';

export async function addKnowledge(formData: FormData) {
  const content = formData.get('content') as string;
  const type = formData.get('type') as string; // "chat" 或 "note"

  if (!content) return;

  // 1. 生成向量
  const embedding = await generateEmbedding(content);

  // 2. 存入数据库
  // 利用 SQL 原生命令存入向量 (Prisma 暂不支持直接写 vector 类型)
  await prisma.$executeRaw`
    INSERT INTO chat_messages (sender, content, "sendTime", embedding)
    VALUES (${type === 'chat' ? '手动录入' : '知识笔记'}, ${content}, ${new Date()}, ${embedding}::vector)
  `;

  redirect('/knowledge');
}