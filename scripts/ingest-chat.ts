// 运行命令: npx tsx scripts/ingest-wechat.ts

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const prisma = new PrismaClient();

// 单独初始化智谱客户端用于脚本
const zhipu = new OpenAI({
  apiKey: process.env.ZHIPU_API_KEY, 
  baseURL: "https://open.bigmodel.cn/api/paas/v4", 
});

async function generateEmbedding(text: string) {
  const response = await zhipu.embeddings.create({
    model: "embedding-2",
    input: text.replace(/\n/g, ' '),
  });
  return response.data[0].embedding;
}

async function main() {
  console.log("🚀 开始处理微信聊天记录...");

  // 1. 读取 JSON 文件
  const filePath = path.join(process.cwd(), 'scripts', 'wechat_history.json');
  if (!fs.existsSync(filePath)) {
    console.error("❌ 未找到 wechat_history.json，请先从 WeChatMsg 导出并放入 scripts 文件夹！");
    return;
  }

  const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`📂 读取到 ${rawData.length} 条原始记录`);

  // 2. 过滤有效信息 (去掉系统消息、太短的废话)
  const validMessages = rawData.filter((msg: any) => {
    return msg.type === 1 && // 1通常代表文本消息
           msg.content && 
           msg.content.length > 2 && // 过滤 "嗯" "哦"
           !msg.content.includes("撤回了一条消息");
  });

  console.log(`🧹 过滤后剩余 ${validMessages.length} 条有效对话`);

  let count = 0;
  
  // 3. 循环入库
  for (const msg of validMessages) {
    const msgDate = new Date(msg.createTime * 1000); // 微信通常是秒级时间戳
    
    // 简单查重：检查同一时间同一人发的内容是否已存在
    const exists = await prisma.chatMessage.findFirst({
      where: {
        sendTime: msgDate,
        content: msg.content
      }
    });

    if (exists) {
      process.stdout.write('.'); // 已存在打印个点，跳过
      continue;
    }

    // 向量化
    try {
      const vector = await generateEmbedding(msg.content);
      
      // 写入数据库
      const senderName = msg.isSend === 1 ? "我" : "女友"; // 根据 WeChatMsg 格式调整
      
      await prisma.$executeRaw`
        INSERT INTO chat_messages (sender, content, "sendTime", embedding)
        VALUES (${senderName}, ${msg.content}, ${msgDate}, ${vector}::vector)
      `;
      
      count++;
      process.stdout.write('✅'); // 成功入库
      
      // ⚠️ 关键：稍微停顿一下，防止触发 API 速率限制
      await new Promise(r => setTimeout(r, 200)); 

    } catch (e) {
      console.error(`\n❌ 处理失败: ${msg.content}`, e);
    }
  }

  console.log(`\n🎉 处理完成！新增入库 ${count} 条记忆。`);
}

main();