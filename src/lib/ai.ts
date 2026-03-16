import OpenAI from 'openai';

// 1. 初始化 DeepSeek 客户端 (用于对话)
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL,
});

// 2. 初始化智谱客户端 (用于生成向量)
const zhipu = new OpenAI({
  apiKey: process.env.ZHIPU_API_KEY,
  baseURL: "https://open.bigmodel.cn/api/paas/v4",
});

// --- 功能 A: 将文本转化为向量 (Embedding) ---
export async function generateEmbedding(text: string): Promise<number[]> {
  const cleanText = text.replace(/\n/g, ' ');

  try {
    const response = await zhipu.embeddings.create({
      model: "embedding-2",
      input: cleanText,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("向量化失败:", error);
    throw error;
  }
}

// --- 功能 B: DeepSeek 对话 (降温至 0.7，减少幻觉) ---
export async function chatWithDeepSeek(systemPrompt: string, userMessage: string) {
  try {
    const completion = await deepseek.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      model: "deepseek-chat",
      temperature: 0.7, // 从1.3降到0.7，兼顾温柔和准确性
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("DeepSeek 调用失败:", error);
    return "抱歉，我的大脑暂时短路了，请稍后再试...";
  }
}

// --- 功能 C: AI 查询扩展 (Query Expansion) ---
// 将用户的短问题扩展为丰富的搜索关键词，提升向量检索命中率
export async function expandQuery(userMessage: string): Promise<string> {
  try {
    const completion = await deepseek.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `你是一个搜索查询扩展助手。用户会输入一个关于情侣聊天记录的问题。
你的任务是将这个问题扩展为一段丰富的搜索文本，包含：
1. 原始问题的核心意图
2. 相关的同义词和近义词
3. 这类对话中可能出现的关键词和表达方式
4. 相关的情感词汇

直接输出扩展后的搜索文本，不要解释，不要用引号包裹，控制在100字以内。`
        },
        { role: "user", content: userMessage },
      ],
      model: "deepseek-chat",
      temperature: 0.3, // 低温度，保证稳定性
      max_tokens: 150,
    });

    return completion.choices[0].message.content || userMessage;
  } catch (error) {
    console.error("查询扩展失败，使用原始查询:", error);
    return userMessage; // 失败时回退到原始查询
  }
}

// --- 功能 D: AI 重排序 (Rerank) ---
// 让 AI 从候选记忆中挑选出最相关的，并判断相关性
export interface MemoryCandidate {
  id: number;
  content: string;
  sender: string;
  sendTime: Date;
  similarity: number;
  source: 'vector' | 'keyword'; // 来源标记
}

export interface RankedMemory {
  content: string;
  sender: string;
  sendTime: Date;
  relevance: 'high' | 'medium' | 'low';
  reason: string;
}

export async function rerankMemories(
  userQuestion: string,
  candidates: MemoryCandidate[]
): Promise<RankedMemory[]> {
  if (candidates.length === 0) return [];

  // 构建候选列表文本
  const candidateList = candidates.map((c, i) =>
    `【记忆${i + 1}】(相似度:${c.similarity.toFixed(2)}, 来源:${c.source})\n${c.content.substring(0, 300)}`
  ).join('\n\n');

  try {
    const completion = await deepseek.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `你是一个记忆相关性判断助手。用户会给你一个问题和多条聊天记忆候选。
你需要判断每条记忆与问题的相关性，并只选出真正相关的记忆。

输出严格的 JSON 数组格式，每个元素包含:
- "index": 记忆编号(从1开始)
- "relevance": "high"(直接回答问题) / "medium"(间接相关) / "low"(不相关)
- "reason": 一句话说明为什么相关或不相关

只输出 JSON 数组，不要其他内容。示例:
[{"index":1,"relevance":"high","reason":"直接提到了用户问的地点"},{"index":3,"relevance":"medium","reason":"虽然没直接说但提到了相关的事"}]

重要规则：
- 如果记忆内容和问题完全无关，必须标记为 "low"
- 宁可少选也不要错选，避免把不相关的内容标为相关
- 只选出 relevance 为 high 或 medium 的，最多选 5 条`
        },
        {
          role: "user",
          content: `问题: "${userQuestion}"\n\n候选记忆:\n${candidateList}`
        },
      ],
      model: "deepseek-chat",
      temperature: 0.1, // 极低温度，保证判断准确
      max_tokens: 500,
    });

    const responseText = completion.choices[0].message.content || '[]';

    // 提取 JSON（兼容 markdown code block）
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return fallbackRank(candidates);

    const rankings: Array<{ index: number; relevance: string; reason: string }> = JSON.parse(jsonMatch[0]);

    // 只保留 high 和 medium 的结果
    const relevant = rankings
      .filter(r => r.relevance === 'high' || r.relevance === 'medium')
      .sort((a, b) => (a.relevance === 'high' ? 0 : 1) - (b.relevance === 'high' ? 0 : 1))
      .slice(0, 5);

    return relevant.map(r => {
      const candidate = candidates[r.index - 1];
      if (!candidate) return null;
      return {
        content: candidate.content,
        sender: candidate.sender,
        sendTime: candidate.sendTime,
        relevance: r.relevance as 'high' | 'medium' | 'low',
        reason: r.reason,
      };
    }).filter(Boolean) as RankedMemory[];

  } catch (error) {
    console.error("重排序失败，使用基础排序:", error);
    return fallbackRank(candidates);
  }
}

// 重排序失败时的回退策略：按相似度取前3
function fallbackRank(candidates: MemoryCandidate[]): RankedMemory[] {
  return candidates
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3)
    .filter(c => c.similarity > 0.3) // 基础过滤
    .map(c => ({
      content: c.content,
      sender: c.sender,
      sendTime: c.sendTime,
      relevance: c.similarity > 0.5 ? 'high' as const : 'medium' as const,
      reason: '基于向量相似度排序',
    }));
}
