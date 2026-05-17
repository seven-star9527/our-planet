import OpenAI from 'openai';

// 1. Initialize DeepSeek client (for chat)
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL,
});

// 2. Initialize Zhipu client (for embeddings)
const zhipu = new OpenAI({
  apiKey: process.env.ZHIPU_API_KEY,
  baseURL: "https://open.bigmodel.cn/api/paas/v4",
});

// --- Function A: Text to vector (Embedding) ---
const MAX_EMBEDDING_CHARS = 8000;

export async function generateEmbedding(text: string): Promise<number[]> {
  const cleanText = text.replace(/\n/g, ' ').substring(0, MAX_EMBEDDING_CHARS);

  try {
    const response = await zhipu.embeddings.create({
      model: "embedding-2",
      input: cleanText,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Embedding failed:", error);
    throw error;
  }
}

// --- Function B: DeepSeek chat ---
export async function chatWithDeepSeek(systemPrompt: string, userMessage: string) {
  try {
    const completion = await deepseek.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      model: "deepseek-chat",
      temperature: 0.7,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("DeepSeek call failed:", error);
    return "Sorry, I'm having a brain freeze, please try again...";
  }
}

// --- Function C: AI Query Expansion ---
export async function expandQuery(userMessage: string): Promise<string> {
  try {
    const completion = await deepseek.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a search query expansion expert for Chinese couple chat records. " +
            "Given a user question about past events, generate search keywords to improve retrieval. " +
            "Rules: 1) Keep the core meaning, add synonyms and related expressions. " +
            "2) Use casual/spoken language typical of WeChat chats. " +
            "3) Include time-related hints. " +
            "4) For location questions, add related landmarks, activities, food. " +
            "5) For event questions, add related actions, feelings, follow-up discussions. " +
            "6) Output space-separated keywords, no explanation, under 100 chars. " +
            "Example: Input: 'where was our first date' -> " +
            "Output: 'first date meeting place went where date location that day first meet went out'",
        },
        { role: "user", content: userMessage },
      ],
      model: "deepseek-chat",
      temperature: 0.3,
      max_tokens: 200,
    });

    const expanded = completion.choices[0].message.content || "";
    // Include original query to preserve semantics
    return userMessage + " " + expanded;
  } catch (error) {
    console.error("Query expansion failed, using original:", error);
    return userMessage;
  }
}

// --- Function D: AI Rerank ---
export interface MemoryCandidate {
  id: number;
  content: string;
  sender: string;
  sendTime: Date;
  similarity: number;
  source: 'vector' | 'keyword';
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

  const candidateList = candidates.map((c, i) =>
    `[Memory ${i + 1}](similarity:${c.similarity.toFixed(2)}, source:${c.source})\n${c.content.substring(0, 300)}`
  ).join('\n\n');

  try {
    const completion = await deepseek.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a memory relevance judge. Given a question and candidate chat memories, " +
            "select only the truly relevant ones. Output strict JSON array with fields: " +
            "'index' (1-based), 'relevance' ('high'/'medium'/'low'), 'reason' (one-sentence explanation). " +
            "Only include high or medium relevance items, max 5. " +
            "Example: [{\"index\":1,\"relevance\":\"high\",\"reason\":\"directly mentions the place asked about\"}] " +
            "Important: prefer fewer accurate results over many inaccurate ones.",
        },
        {
          role: "user",
          content: `Question: "${userQuestion}"\n\nCandidate memories:\n${candidateList}`
        },
      ],
      model: "deepseek-chat",
      temperature: 0.1,
      max_tokens: 500,
    });

    const responseText = completion.choices[0].message.content || '[]';

    // Extract JSON (compatible with markdown code blocks)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return fallbackRank(candidates);

    const rankings: Array<{ index: number; relevance: string; reason: string }> = JSON.parse(jsonMatch[0]);

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
    console.error("Rerank failed, using fallback:", error);
    return fallbackRank(candidates);
  }
}

// Fallback: take top 3 by similarity
function fallbackRank(candidates: MemoryCandidate[]): RankedMemory[] {
  return candidates
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3)
    .filter(c => c.similarity > 0.15)
    .map(c => ({
      content: c.content,
      sender: c.sender,
      sendTime: c.sendTime,
      relevance: c.similarity > 0.3 ? 'high' as const : 'medium' as const,
      reason: 'Based on vector similarity ranking',
    }));
}
