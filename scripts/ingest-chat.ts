// 运行命令: npx tsx scripts/ingest-chat.ts

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const prisma = new PrismaClient();

// 初始化智谱客户端用于生成向量
const zhipu = new OpenAI({
  apiKey: process.env.ZHIPU_API_KEY, 
  baseURL: "https://open.bigmodel.cn/api/paas/v4", 
});

async function generateEmbedding(text: string) {
  const response = await zhipu.embeddings.create({
    model: "embedding-2",
    input: text.replace(/\n/g, ' '), // 向量化时去掉换行符更利于语义连贯
  });
  return response.data[0].embedding;
}

// 定义解析后的消息结构
interface ParsedMessage {
  date: Date;
  sender: string;
  content: string;
}

async function main() {
  console.log("🚀 开始处理手工精选的微信聊天记录...");

  // 1. 读取 TXT 文件
  const filePath = path.join(process.cwd(), 'scripts', 'chat_history.txt');
  if (!fs.existsSync(filePath)) {
    console.error("❌ 未找到 chat_history.txt，请先在 scripts 文件夹下创建并录入数据！");
    return;
  }

  const rawText = fs.readFileSync(filePath, 'utf-8');
  const lines = rawText.split('\n');

  // 2. 智能解析文本 (支持正则匹配和多行消息自动拼接)
  const messages: ParsedMessage[] = [];
  // 匹配规则: "2023-05-20 角色名: 消息内容" (支持包含时分秒，支持中英文冒号)
  const regex = /^(\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2}:\d{2})?)\s+(.+?)[:：]\s*(.+)$/;
  
  let currentMsg: ParsedMessage | null = null;

  for (const line of lines) {
    if (!line.trim()) continue; // 跳过空行

    const match = line.match(regex);
    if (match) {
      // 如果上一条消息已经解析完，推入数组
      if (currentMsg) messages.push(currentMsg);
      
      const parsedDate = new Date(match[1]);
      // 容错处理：如果日期格式写错了
      const validDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

      currentMsg = {
        date: validDate,
        sender: match[2].trim(),
        content: match[3].trim()
      };
    } else if (currentMsg) {
      // 如果没有匹配到日期开头，说明这是上一条消息的换行内容，直接拼接
      currentMsg.content += '\n' + line.trim();
    }
  }
  // 把最后一条消息推入数组
  if (currentMsg) messages.push(currentMsg);

  console.log(`🧹 解析完成，共提取出 ${messages.length} 条有效记忆锚点。`);

  let count = 0;
  
  // 3. 循环入库并向量化
  for (const msg of messages) {
    // 简单查重：检查同一时间同一人发的内容是否已存在 (防止重复运行脚本录入重复数据)
    const exists = await prisma.chatMessage.findFirst({
      where: {
        sendTime: msg.date,
        content: msg.content
      }
    });

    if (exists) {
      process.stdout.write('⏭️ '); // 已存在打印跳过
      continue;
    }

    try {
      // 调用大模型将文字转化为向量 (Embedding)
      const vector = await generateEmbedding(msg.content);
      
      // 写入带有 pgvector 扩展的 PostgreSQL 数据库
      await prisma.$executeRaw`
        INSERT INTO chat_messages (sender, content, "sendTime", embedding)
        VALUES (${msg.sender}, ${msg.content}, ${msg.date}, ${vector}::vector)
      `;
      
      count++;
      process.stdout.write('✅ '); // 成功入库
      
      // ⚠️ 关键：稍微停顿一下，防止触发智谱 API 的并发速率限制
      await new Promise(r => setTimeout(r, 200)); 

    } catch (e) {
      console.error(`\n❌ 处理失败: [${msg.sender}] ${msg.content.substring(0, 10)}...`, e);
    }
  }

  console.log(`\n🎉 记忆灌入完成！AI 大脑新增了 ${count} 条专属回忆。`);
}

main();