import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  generateEmbedding,
  chatWithDeepSeek,
  expandQuery,
  rerankMemories,
  MemoryCandidate,
  RankedMemory,
} from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "请输入内容" }, { status: 400 });
    }

    // ═══════════════════════════════════════════════════
    // 🧠 第一阶段：智能查询扩展 (Query Expansion)
    // 将用户的短问题扩展为丰富的搜索文本，提升检索命中率
    // ═══════════════════════════════════════════════════
    const expandedQuery = await expandQuery(message);
    console.log(`📝 原始问题: "${message}"`);
    console.log(`🔍 扩展查询: "${expandedQuery}"`);

    // ═══════════════════════════════════════════════════
    // 🔎 第二阶段：混合检索 (Hybrid Search)
    // 向量搜索 + 关键词搜索，双管齐下扩大召回范围
    // ═══════════════════════════════════════════════════

    // 2a. 向量搜索（用扩展后的查询生成 embedding）
    const queryEmbedding = await generateEmbedding(expandedQuery);
    const vectorQuery = `[${queryEmbedding.join(",")}]`;

    const vectorResults: Array<{
      id: number;
      content: string;
      sender: string;
      sendTime: Date;
      similarity: number;
    }> = await prisma.$queryRaw`
      SELECT id, content, sender, "sendTime",
             1 - (embedding <=> ${vectorQuery}::vector) as similarity
      FROM chat_messages
      WHERE 1 - (embedding <=> ${vectorQuery}::vector) > 0.3
      ORDER BY embedding <=> ${vectorQuery}::vector
      LIMIT 12
    `;

    // 2b. 关键词搜索（从用户原始问题中提取关键词进行模糊匹配）
    const keywords = extractKeywords(message);
    let keywordResults: Array<{
      id: number;
      content: string;
      sender: string;
      sendTime: Date;
    }> = [];

    if (keywords.length > 0) {
      // 构建 OR 条件的模糊搜索
      const keywordConditions = keywords
        .map((kw) => `content ILIKE '%${kw.replace(/'/g, "''")}%'`)
        .join(" OR ");

      keywordResults = await prisma.$queryRawUnsafe(`
        SELECT id, content, sender, "sendTime"
        FROM chat_messages
        WHERE ${keywordConditions}
        ORDER BY "sendTime" DESC
        LIMIT 8
      `);
    }

    // 2c. 合并去重（向量结果 + 关键词结果）
    const seenIds = new Set<number>();
    const allCandidates: MemoryCandidate[] = [];

    // 先加入向量搜索结果
    for (const r of vectorResults) {
      if (!seenIds.has(r.id)) {
        seenIds.add(r.id);
        allCandidates.push({
          id: r.id,
          content: r.content,
          sender: r.sender,
          sendTime: r.sendTime,
          similarity: r.similarity,
          source: "vector",
        });
      }
    }

    // 再加入关键词搜索结果（给一个默认相似度）
    for (const r of keywordResults) {
      if (!seenIds.has(r.id)) {
        seenIds.add(r.id);
        allCandidates.push({
          id: r.id,
          content: r.content,
          sender: r.sender,
          sendTime: r.sendTime,
          similarity: 0.4, // 关键词匹配的默认相似度
          source: "keyword",
        });
      }
    }

    console.log(
      `📊 检索结果: 向量=${vectorResults.length}条, 关键词=${keywordResults.length}条, 合并去重=${allCandidates.length}条`
    );

    // ═══════════════════════════════════════════════════
    // 🏆 第三阶段：AI 智能重排序 (Rerank)
    // 让 AI 从候选中挑出真正相关的记忆，过滤无关噪音
    // ═══════════════════════════════════════════════════
    let rankedMemories: RankedMemory[] = [];

    if (allCandidates.length > 0) {
      rankedMemories = await rerankMemories(message, allCandidates);
      console.log(`✅ 重排序后保留 ${rankedMemories.length} 条相关记忆`);
    }

    // 构建记忆上下文
    const memoryContext =
      rankedMemories.length > 0
        ? rankedMemories
          .map((m, i) => {
            const dateStr = new Date(m.sendTime).toLocaleDateString("zh-CN");
            const relevanceLabel =
              m.relevance === "high" ? "🔴 高度相关" : "🟡 部分相关";
            return `---记忆${i + 1} [${relevanceLabel}] [${dateStr}]---\n${m.content}`;
          })
          .join("\n\n")
        : "【无相关记忆】没有找到与问题相关的聊天记录。";

    // ═══════════════════════════════════════════════════
    // 📒 第四阶段：获取辅助上下文（时光手账、生理期等）
    // ═══════════════════════════════════════════════════

    // 获取最近的时光手账
    const recentMoments = await prisma.moment.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const momentsContext =
      recentMoments.length > 0
        ? recentMoments
          .map(
            (m) =>
              `[${new Date(m.createdAt).toLocaleDateString("zh-CN")}] ${m.author} 记录了: ${m.content}`
          )
          .join("\n")
        : "近期没有手账记录";

    // 生理期状态
    const latestPeriod = await prisma.periodRecord.findFirst({
      orderBy: { startDate: "desc" },
    });
    let periodSystemPrompt = "";

    if (latestPeriod) {
      const diffTime =
        new Date().getTime() - new Date(latestPeriod.startDate).getTime();
      const diffDays = Math.floor(diffTime / (1000 * 3600 * 24)) + 1;

      if (diffDays > 0 && diffDays <= 28) {
        const cycleDay = diffDays;
        let phaseInfo = "";
        if (cycleDay >= 1 && cycleDay <= 5)
          phaseInfo = "月经期（可能身体虚弱、肚子痛、情绪敏感）";
        else if (cycleDay >= 6 && cycleDay <= 13)
          phaseInfo = "卵泡期（心情绝佳、精力充沛）";
        else if (cycleDay >= 14 && cycleDay <= 16)
          phaseInfo = "排卵期（体温微升）";
        else phaseInfo = "黄体期/经前综合征期（可能容易疲惫、烦躁、易委屈）";

        periodSystemPrompt = `
【隐藏状态 - 自然体现，不要直接提及】：
今天是女友生理周期的第 ${cycleDay} 天，正处于「${phaseInfo}」。
在回答中自然地体现对她身体状态的照顾，不要刻意提及生理期。`;
      }
    }

    // ═══════════════════════════════════════════════════
    // 🎯 第五阶段：构建高质量 Prompt + 时间感知
    // ═══════════════════════════════════════════════════

    const now = new Date();
    const weekDays = [
      "星期日",
      "星期一",
      "星期二",
      "星期三",
      "星期四",
      "星期五",
      "星期六",
    ];
    const timeContext = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]} ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;

    const hasRelevantMemories = rankedMemories.length > 0;

    const systemPrompt = `你是"小七"，一对情侣的专属恋爱助手，性格温柔、幽默、贴心。
当前时间: ${timeContext}

═══════ 【核心规则 - 必须严格遵守】 ═══════

1. 关于事实性问题（涉及"什么时候"、"去过哪"、"说过什么"等具体事实）：
   - 只能基于下面的【记忆片段】来回答
   - 如果记忆片段标记为"无相关记忆"，必须诚实回答："这个我翻了翻记忆没找到呢～可能是我还没记住这段"
   - 绝对不能编造、猜测、臆想任何记忆中没有出现的事件、时间、地点或对话内容
   - 可以对记忆内容进行总结和分析，但不能添加记忆中不存在的细节

2. 关于情感/建议/日常类问题（如"今天吃什么"、"怎么哄女朋友"等）：
   - 可以自由回答，发挥你温柔贴心的性格
   - 如果记忆中有相关信息可以结合使用

3. 回答风格：轻松、温柔、有人情味，适当使用 emoji

═══════ 【检索到的相关记忆片段】 ═══════
${memoryContext}

═══════ 【近期时光手账动态】 ═══════
${momentsContext}
${periodSystemPrompt}

再次强调：对于过去的事实，只基于上面的记忆片段回答。如果没有相关记忆，请坦诚说明，不要编故事。`;

    // ═══════════════════════════════════════════════════
    // 💬 第六阶段：调用 AI 生成回答
    // ═══════════════════════════════════════════════════
    const aiResponse = await chatWithDeepSeek(systemPrompt, message);

    return NextResponse.json({
      answer: aiResponse,
      // 可选：返回调试信息（生产环境可去掉）
      _debug: {
        expandedQuery,
        candidatesCount: allCandidates.length,
        relevantMemories: rankedMemories.length,
        hasRelevantMemories,
      },
    });
  } catch (error) {
    console.error("Chat Error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════
// 🔧 辅助函数：从用户问题中提取关键词用于模糊搜索
// ═══════════════════════════════════════════════════
function extractKeywords(text: string): string[] {
  // 去除常见的疑问词和停用词
  const stopWords = new Set([
    "的",
    "了",
    "吗",
    "呢",
    "吧",
    "啊",
    "呀",
    "哦",
    "嘛",
    "是",
    "在",
    "有",
    "和",
    "与",
    "或",
    "我",
    "你",
    "他",
    "她",
    "它",
    "我们",
    "你们",
    "他们",
    "这",
    "那",
    "什么",
    "怎么",
    "如何",
    "为什么",
    "哪",
    "哪里",
    "哪些",
    "几",
    "多少",
    "多",
    "很",
    "非常",
    "比较",
    "最",
    "都",
    "也",
    "还",
    "就",
    "才",
    "会",
    "能",
    "可以",
    "要",
    "想",
    "去",
    "来",
    "到",
    "过",
    "说",
    "说过",
    "记得",
    "知道",
    "一起",
    "一个",
    "一些",
    "不",
    "没",
    "没有",
    "请",
    "告诉",
    "问",
  ]);

  // 简单分词：按标点和空格分割，保留2字以上的词
  const words = text
    .replace(/[？?！!，。、；：""''（）【】《》\s]/g, " ")
    .split(" ")
    .filter((w) => w.length >= 2 && !stopWords.has(w));

  // 去重并最多取5个关键词
  return [...new Set(words)].slice(0, 5);
}
