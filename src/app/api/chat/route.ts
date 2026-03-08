import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateEmbedding, chatWithDeepSeek } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: '请输入内容' }, { status: 400 });
    }

    // 1. 将用户的问题向量化
    const queryEmbedding = await generateEmbedding(message);

    // 2. 在数据库中搜索相关的微信聊天记忆 (RAG)
    const vectorQuery = `[${queryEmbedding.join(',')}]`;
    const memories: any[] = await prisma.$queryRaw`
      SELECT content, sender, "sendTime"
      FROM chat_messages
      ORDER BY embedding <=> ${vectorQuery}::vector
      LIMIT 5
    `;

    const memoryContext = memories.length > 0 
      ? memories.map(m => `[${new Date(m.sendTime).toLocaleDateString()}] ${m.sender}: ${m.content}`).join('\n')
      : "暂无相关聊天记录";

    // ✨ 3. 新增：获取最近的 15 条时光手账动态作为短期记忆
    const recentMoments = await prisma.moment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    const momentsContext = recentMoments.length > 0
      ? recentMoments.map(m => `[${new Date(m.createdAt).toLocaleDateString()}] ${m.author} 记录了手账: ${m.content}`).join('\n')
      : "近期没有手账记录";

      const latestPeriod = await prisma.periodRecord.findFirst({ orderBy: { startDate: 'desc' } });
    let periodSystemPrompt = "";
    
    if (latestPeriod) {
      const diffTime = new Date().getTime() - new Date(latestPeriod.startDate).getTime();
      const diffDays = Math.floor(diffTime / (1000 * 3600 * 24)) + 1;
      
      if (diffDays > 0 && diffDays <= 28) {
        const cycleDay = diffDays;
        let phaseInfo = "";
        if (cycleDay >= 1 && cycleDay <= 5) phaseInfo = "月经期（可能身体虚弱、肚子痛、情绪敏感）";
        else if (cycleDay >= 6 && cycleDay <= 13) phaseInfo = "卵泡期（心情绝佳、精力充沛）";
        else if (cycleDay >= 14 && cycleDay <= 16) phaseInfo = "排卵期（体温微升）";
        else phaseInfo = "黄体期/经前综合征期（可能容易疲惫、烦躁、易委屈）";

        periodSystemPrompt = `
        【极其重要的隐藏状态】：
        今天是你女友生理周期的第 ${cycleDay} 天，正处于「${phaseInfo}」。
        作为懂事的伴侣助手，请在回答中**自然且不刻意**地体现出对她当前身体状态的照顾。例如，如果是月经期或经前期，语气要极其温柔，多哄哄她，甚至可以主动建议男主多照顾她。
        `;
      }
    }

    // 4. 构建终极提示词 (Prompt Engineering)
    const systemPrompt = `
      你是我(用户)和女友的专属恋爱助手，你的名字叫"小柒"。
      
      以下是我们过去的微信聊天记忆片段，以及我们在"时光手账"里记录的最新日常动态。
      请基于这些记忆信息回答我的问题，让对话更有温度。
      如果记忆中没有相关信息，请根据常识或你的性格温柔地回答，绝对不要编造事实。
      
      【历史聊天记忆片段 (通过向量检索匹配)】：
      ${memoryContext}

      【近期时光手账动态 (最新日常)】：
      ${momentsContext}
      
      请用轻松、幽默或深情的语气回答。
    `;

    // 5. 发送给 DeepSeek
    const aiResponse = await chatWithDeepSeek(systemPrompt, message);

    return NextResponse.json({ answer: aiResponse });

  } catch (error) {
    console.error('Chat Error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}