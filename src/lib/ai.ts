import OpenAI from 'openai';

// 1. 初始化 DeepSeek 客户端 (用于对话)
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL,
});

// 2. 初始化智谱客户端 (用于生成向量)
// 智谱的 Key 通常是 "id.secret" 格式，SDK 会自动处理
const zhipu = new OpenAI({
  apiKey: process.env.ZHIPU_API_KEY, 
  baseURL: "https://open.bigmodel.cn/api/paas/v4", 
});

// --- 功能 A: 将文本转化为向量 (Embedding) ---
// 这是 RAG 的核心：把你们的聊天记录变成计算机能懂的 1024/1536 维数字
export async function generateEmbedding(text: string): Promise<number[]> {
  // 移除换行符，减少干扰
  const cleanText = text.replace(/\n/g, ' ');

  try {
    const response = await zhipu.embeddings.create({
      model: "embedding-2", // 智谱目前性价比最高的向量模型
      input: cleanText,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("向量化失败:", error);
    throw error;
  }
}

// --- 功能 B: DeepSeek 对话 ---
export async function chatWithDeepSeek(systemPrompt: string, userMessage: string) {
  try {
    const completion = await deepseek.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      model: "deepseek-chat", 
      temperature: 1.3, // 温度设高一点，让 AI 更感性、更有“人味”
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("DeepSeek 调用失败:", error);
    return "抱歉，我的大脑暂时短路了，请稍后再试...";
  }
}