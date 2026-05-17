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
import { logger } from "@/lib/logger";

// ========== 意图分类 ==========
type IntentType = 'fact_query' | 'emotion_support' | 'advice_request' | 'casual_chat';

function classifyIntent(userMessage: string): IntentType {
  const lowerMsg = userMessage.toLowerCase();

  // 事实查询类问题
  const factPatterns = [
    /什么时候|哪天|几号|哪天|去年|今年|去年|记得.*说|说过|去过|吃过|做过|我们.*第|第一次|最后|最早|最近|上周|下周|昨天|明天/,
    /是什么|在哪|是谁|有.*吗|没.*吗|是不是|有没有/,
    /告诉.*我|帮我.*回忆|翻.*记忆/,
  ];

  // 情感支持类问题
  const emotionPatterns = [
    /心情|难过|开心|生气|委屈|想.*你|爱你|喜欢|讨厌|烦恼|焦虑|担心/,
    /哄|安慰|鼓励|陪我|抱抱/,
  ];

  // 建议请求类问题
  const advicePatterns = [
    /怎么办|怎么办|怎么.*做|要不要|建议|推荐|想吃.*好|去哪.*好|送.*什么/,
    /约会|生日|纪念日|礼物/,
  ];

  if (factPatterns.some(p => p.test(lowerMsg))) return 'fact_query';
  if (emotionPatterns.some(p => p.test(lowerMsg))) return 'emotion_support';
  if (advicePatterns.some(p => p.test(lowerMsg))) return 'advice_request';
  return 'casual_chat';
}

// ========== 智能上下文补充 (多跳推理) ==========
async function expandContextWithNeighbors(
  memories: RankedMemory[],
  prisma: any
): Promise<RankedMemory[]> {
  if (memories.length === 0) return memories;

  const expanded: RankedMemory[] = [...memories];
  const addedIds = new Set(memories.map(m => m.content.substring(0, 100)));

  // 对于每条高相关记忆，尝试找相邻的记忆（时间上接近的）
  const topMemories = memories.filter(m => m.relevance === 'high').slice(0, 5);
  if (topMemories.length === 0) {
    // 如果没有 high 的，对 medium 的也做扩展
    topMemories.push(...memories.filter(m => m.relevance === 'medium').slice(0, 3));
  }

  for (const mem of topMemories) {
    try {
      const memTime = new Date(mem.sendTime);
      // 扩大时间窗口到 1 小时，捕获更多上下文
      const timeWindow = 60 * 60 * 1000;

      const neighbors = await prisma.$queryRaw<any[]>`
        SELECT content, sender, "sendTime"
        FROM chat_messages
        WHERE "sendTime" BETWEEN ${new Date(memTime.getTime() - timeWindow)} AND ${new Date(memTime.getTime() + timeWindow)}
        ORDER BY ABS(EXTRACT(EPOCH FROM ("sendTime" - ${memTime})))
        LIMIT 3
      `;

      for (const n of neighbors) {
        const preview = n.content.substring(0, 100);
        if (!addedIds.has(preview)) {
          addedIds.add(preview);
          expanded.push({
            content: n.content,
            sender: n.sender,
            sendTime: n.sendTime,
            relevance: 'medium',
            reason: `与主要记忆时间相邻，补充上下文`,
          });
        }
      }
    } catch (e) {
      // 静默失败，不影响主流程
    }
  }

  return expanded.slice(0, 10); // 最多返回10条
}

// ========== 时间感知权重调整 ==========
function adjustRelevanceByRecency(memories: RankedMemory[]): RankedMemory[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  return memories.map(m => {
    const age = now - new Date(m.sendTime).getTime();
    const days = age / dayMs;

    // 如果是7天内的新记忆，适当提升相关性标签
    if (days <= 7 && m.relevance === 'medium') {
      return { ...m, relevance: 'medium' as const, reason: m.reason + ' (近期记忆)' };
    }
    return m;
  });
}

// 简单的内存会话存储 (生产环境应使用 Redis 等方案)
const sessionStore = new Map<string, Array<{ role: string; content: string }>>();
const SESSION_MAX_MESSAGES = 10;

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId, history: clientHistory } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "请输入内容" }, { status: 400 });
    }

    // 会话管理
    const sid = sessionId || "default";
    if (!sessionStore.has(sid)) {
      sessionStore.set(sid, []);
    }
    const sessionHistory = sessionStore.get(sid)!;

    // 合并客户端传来的历史
    const conversationHistory = clientHistory || sessionHistory;

    // 将当前消息加入历史（异步保留）
    sessionHistory.push({ role: "user", content: message });
    if (sessionHistory.length > SESSION_MAX_MESSAGES) {
      sessionHistory.splice(0, sessionHistory.length - SESSION_MAX_MESSAGES);
    }

    // 构建对话历史文本，补充检索上下文
    const historyText = conversationHistory.length > 0
      ? conversationHistory.slice(-6).map((m: any) => `${m.role === "user" ? "对方" : "小七"}: ${m.content}`).join("\n")
      : "";

    // ═══════════════════════════════════════════════════
    // 🧠 第一阶段：智能查询扩展 (Query Expansion)
    // ═══════════════════════════════════════════════════
    let expandedQuery = message;
    try {
      expandedQuery = await expandQuery(message);
      logger.log(`📝 原始问题: "${message}"`);
      logger.log(`🔍 扩展查询: "${expandedQuery}"`);
    } catch (e) {
      logger.warn("⚠️ 查询扩展失败，使用原始问题:", e);
    }

    // ═══════════════════════════════════════════════════
    // 🔎 第二阶段：混合检索 (Hybrid Search)
    // ═══════════════════════════════════════════════════

    // 2a. 向量搜索
    let vectorResults: Array<{
      id: number;
      content: string;
      sender: string;
      sendTime: Date;
      similarity: number;
    }> = [];

    try {
      const queryEmbedding = await generateEmbedding(expandedQuery);
      const vectorQuery = `[${queryEmbedding.join(",")}]`;

      const rawVectorResults: any[] = await prisma.$queryRaw`
        SELECT id, content, sender, "sendTime",
               1 - (embedding <=> ${vectorQuery}::vector) as similarity
        FROM chat_messages
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> ${vectorQuery}::vector
        LIMIT 15
      `;

      vectorResults = rawVectorResults
        .map((r) => ({
          id: Number(r.id),
          content: r.content,
          sender: r.sender,
          sendTime: r.sendTime,
          similarity: Number(r.similarity),
        }))
        .filter((r) => r.similarity > 0.15);

      logger.log(
        `🔎 向量搜索: ${rawVectorResults.length}条 → 过滤后${vectorResults.length}条`
      );
    } catch (e) {
      logger.warn("⚠️ 向量搜索失败:", e);
    }

    // 2b. 关键词搜索
    let keywordResults: Array<{
      id: number;
      content: string;
      sender: string;
      sendTime: Date;
    }> = [];

    try {
      const keywords = extractKeywords(message);
      if (keywords.length > 0) {
        // 使用参数化查询防止 SQL 注入，用 Prisma 的 $queryRaw
        const likePattern = `%${keywords.join("%")}%`;
        keywordResults = (
          await prisma.$queryRaw<any[]>`
          SELECT id, content, sender, "sendTime"
          FROM chat_messages
          WHERE content ILIKE ${likePattern}
          ORDER BY "sendTime" DESC
          LIMIT 8
        `
        ).map((r) => ({
          id: Number(r.id),
          content: r.content,
          sender: r.sender,
          sendTime: r.sendTime,
        }));

        // 如果单个模式匹配不够，逐个关键词也搜索一下
        if (keywordResults.length < 3) {
          for (const kw of keywords.slice(0, 3)) {
            const kwPattern = `%${kw}%`;
            const moreResults: any[] = await prisma.$queryRaw`
              SELECT id, content, sender, "sendTime"
              FROM chat_messages
              WHERE content ILIKE ${kwPattern}
              ORDER BY "sendTime" DESC
              LIMIT 4
            `;
            for (const r of moreResults) {
              keywordResults.push({
                id: Number(r.id),
                content: r.content,
                sender: r.sender,
                sendTime: r.sendTime,
              });
            }
          }
        }

        logger.log(`🔑 关键词搜索: ${keywordResults.length}条`);
      }
    } catch (e) {
      logger.warn("⚠️ 关键词搜索失败:", e);
    }

    // 2c. 使用 RRF (Reciprocal Rank Fusion) 合并去重
    // RRF 能有效融合不同来源的排序结果，无需手动调权重
    const RRF_K = 60; // RRF 常数

    const vectorRankMap = new Map<number, number>();
    vectorResults.forEach((r, i) => vectorRankMap.set(r.id, i + 1));

    const keywordRankMap = new Map<number, number>();
    keywordResults.forEach((r, i) => keywordRankMap.set(r.id, i + 1));

    const rrfScores = new Map<number, { score: number; id: number; content: string; sender: string; sendTime: Date; similarity: number }>();

    for (const r of vectorResults) {
      const vecRank = vectorRankMap.get(r.id) || 999;
      const kwRank = keywordRankMap.get(r.id) || 999;
      const rrfScore = 1 / (RRF_K + vecRank) + 1 / (RRF_K + kwRank);
      rrfScores.set(r.id, {
        score: rrfScore,
        id: r.id,
        content: r.content,
        sender: r.sender,
        sendTime: r.sendTime,
        similarity: r.similarity,
      });
    }

    for (const r of keywordResults) {
      if (rrfScores.has(r.id)) continue; // 已在向量结果中
      const vecRank = 999;
      const kwRank = keywordRankMap.get(r.id) || 999;
      const rrfScore = 1 / (RRF_K + vecRank) + 1 / (RRF_K + kwRank);
      rrfScores.set(r.id, {
        score: rrfScore,
        id: r.id,
        content: r.content,
        sender: r.sender,
        sendTime: r.sendTime,
        similarity: 0.3, // 纯关键词匹配给一个基础相似度
      });
    }

    // 按 RRF 分数降序排列
    const allCandidates: MemoryCandidate[] = Array.from(rrfScores.values())
      .sort((a, b) => b.score - a.score)
      .map((r) => ({
        id: r.id,
        content: r.content,
        sender: r.sender,
        sendTime: r.sendTime,
        similarity: r.similarity,
        source: (vectorRankMap.has(r.id) ? "vector" : "keyword") as "vector" | "keyword",
      }));

    logger.log(`📊 RRF合并后候选: ${allCandidates.length}条`);

    // ═══════════════════════════════════════════════════
    // 🏆 第三阶段：AI 智能重排序 (Rerank)
    // ═══════════════════════════════════════════════════
    let rankedMemories: RankedMemory[] = [];

    if (allCandidates.length > 0) {
      try {
        rankedMemories = await rerankMemories(message, allCandidates);
        logger.log(`✅ 重排序后保留 ${rankedMemories.length} 条相关记忆`);
      } catch (e) {
        logger.warn("⚠️ 重排序失败，使用原始候选:", e);
        // 降级：直接用相似度最高的前5条
        rankedMemories = allCandidates
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 5)
          .map((c) => ({
            content: c.content,
            sender: c.sender,
            sendTime: c.sendTime,
            relevance: "medium" as const,
            reason: "基于相似度排序",
          }));
      }
    }

    // ═══════════════════════════════════════════════════
    // 🔗 第三阶段增强：多跳推理 + 时间感知
    // ═══════════════════════════════════════════════════
    try {
      // 意图分类
      const intent = classifyIntent(message);
      logger.log(`🎯 识别到问题类型: ${intent}`);

      // 事实查询类问题启用多跳推理
      if (intent === 'fact_query' && rankedMemories.length > 0) {
        rankedMemories = await expandContextWithNeighbors(rankedMemories, prisma);
        logger.log(`🔗 多跳推理后扩展到 ${rankedMemories.length} 条记忆`);
      }

      // 时间感知调整
      rankedMemories = adjustRelevanceByRecency(rankedMemories);
    } catch (e) {
      logger.warn("⚠️ 多跳推理/时间感知处理失败:", e);
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
    // 📒 第四阶段：获取辅助上下文
    // ═══════════════════════════════════════════════════

    let momentsContext = "近期没有手账记录";
    try {
      const recentMoments = await prisma.moment.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      if (recentMoments.length > 0) {
        momentsContext = recentMoments
          .map(
            (m) =>
              `[${new Date(m.createdAt).toLocaleDateString("zh-CN")}] ${m.author} 记录了: ${m.content}`
          )
          .join("\n");
      }
    } catch (e) {
      logger.warn("⚠️ 获取手账失败:", e);
    }

    // 生理期状态
    let periodSystemPrompt = "";
    try {
      const latestPeriod = await prisma.periodRecord.findFirst({
        orderBy: { startDate: "desc" },
      });

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
    } catch (e) {
      logger.warn("⚠️ 获取生理期数据失败:", e);
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

${historyText ? `═══════ 【近期对话上下文】 ═══════\n${historyText}\n` : ""}
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

    // 将AI回复也存入会话历史
    sessionHistory.push({ role: "assistant", content: aiResponse || "" });
    if (sessionHistory.length > SESSION_MAX_MESSAGES) {
      sessionHistory.splice(0, sessionHistory.length - SESSION_MAX_MESSAGES);
    }

    return NextResponse.json({
      answer: aiResponse,
      _debug: {
        expandedQuery,
        candidatesCount: allCandidates.length,
        relevantMemories: rankedMemories.length,
        vectorResultsCount: vectorResults.length,
        keywordResultsCount: keywordResults.length,
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("Chat API Error:", detail, error);
    return NextResponse.json(
      {
        answer:
          "抱歉，我的大脑暂时短路了 😵，请稍后再试一下～",
        _error: process.env.NODE_ENV === "development" ? detail : undefined,
      },
      { status: 200 }
    );
  }
}

// ═══════════════════════════════════════════════════
// 🔧 辅助函数：从用户问题中提取关键词用于模糊搜索
// 针对中文优化：使用字符 bigram + 智能分词
// ═══════════════════════════════════════════════════
function extractKeywords(text: string): string[] {
  // 停用词：仅保留真正的语法虚词，去掉会影响记忆检索的动词
  const stopWords = new Set([
    "的", "了", "吗", "呢", "吧", "啊", "呀", "哦", "嘛", "嗯",
    "是", "在", "有", "和", "与", "或",
    "我", "你", "他", "她", "它", "我们", "你们", "他们",
    "这", "那", "这个", "那个", "这些", "那些",
    "什么", "怎么", "如何", "为什么", "哪", "哪里", "哪些",
    "几", "多少", "多",
    "很", "非常", "比较", "最",
    "都", "也", "还", "就", "才", "把", "被", "让",
    "会", "能", "可以", "要", "想", "应该", "可能",
    "去", "来", "到",
    "一个", "一些", "一下", "一种",
    "不", "没", "没有",
    "请", "问", "帮", "给",
  ]);

  const keywords: string[] = [];

  // 策略 1：提取 2-4 字的连续中文字符作为 bigram/trigram
  const chineseOnly = text.replace(/[^一-龥]/g, "");
  for (let len = 4; len >= 2; len--) {
    for (let i = 0; i <= chineseOnly.length - len; i++) {
      const gram = chineseOnly.substring(i, i + len);
      if (!stopWords.has(gram) && gram.length >= 2) {
        keywords.push(gram);
      }
    }
  }

  // 策略 2：按标点分割后提取有意义的完整词组
  const segments = text
    .replace(/[？?！!，。、；：""''（）【】《》\s]+/g, " ")
    .split(" ")
    .filter((w) => w.length >= 2);

  for (const seg of segments) {
    // 移除停用词字符后再判断
    let cleaned = seg;
    for (const sw of stopWords) {
      cleaned = cleaned.replace(new RegExp(sw, "g"), "");
    }
    if (cleaned.length >= 2 && !keywords.includes(seg)) {
      keywords.push(seg);
    }
  }

  // 去重并按长度降序排列（更长的词更精准）
  const unique = [...new Set(keywords)]
    .filter((k) => k.length >= 2)
    .sort((a, b) => b.length - a.length)
    .slice(0, 8);

  return unique;
}
