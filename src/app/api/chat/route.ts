import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  // 1. 把用户的问题变成向量
  // const queryEmbedding = await getEmbedding(query); 
  // 为了演示，这里假设 queryEmbedding 是生成的向量
  const queryEmbedding = new Array(1536).fill(0); // 占位符

  // 2. 在数据库里搜索最相似的 5 条聊天记录 (pgvector 语法)
  // 注意：Prisma 原生不支持向量查询，必须用 $queryRaw
  const memories: any[] = await prisma.$queryRaw`
    SELECT content, sender, "sendTime"
    FROM chat_messages
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT 5
  `;

  // 3. 组装给 AI 的提示词 (Prompt)
  const context = memories.map(m => 
    `[${new Date(m.sendTime).toLocaleDateString()}] ${m.sender}: ${m.content}`
  ).join('\n');

  const systemPrompt = `
    你是一个贴心的恋爱助手。这是用户和女友的历史聊天记录片段：
    ${context}
    
    请根据这些记忆，回答用户的问题。如果记录里没有相关信息，请诚实回答。
    用户问题：${query}
  `;

  // 4. 调用大模型 API (DeepSeek / Moonshot / OpenAI)
  // const aiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', { ... })
  
  const mockResponse = `(AI 模拟回答) 根据记忆，去年去海边时，她在这个时间点确实提到过喜欢吃海鲜...`;

  return NextResponse.json({ answer: mockResponse });
}