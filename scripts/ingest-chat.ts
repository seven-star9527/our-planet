// 🚀 微信聊天记录 → 向量数据库 导入脚本 (WeFlow JSON 版)
// 运行命令: npx tsx scripts/ingest-chat.ts
//
// 数据来源: WeFlow (https://github.com/hicccc77/WeFlow) 导出的 JSON
// 发送者映射: 无殊 = 女友, Tan90° = 我
// 策略: 按自然对话段落分组 → 向量化 → 存入 pgvector

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// ========== 配置区 ==========
const CONFIG = {
  // JSON 文件路径
  jsonFile: 'wechat_history_0316.json',
  // 对话分段：两条消息间隔超过此时间(秒)视为新对话
  segmentGapSeconds: 30 * 60, // 30 分钟
  // 过滤：对话段最少消息条数
  minMessagesPerSegment: 1,
  // 过滤：对话段最少字符数
  minCharsPerSegment: 4,
  // 对话段最大消息条数 (过长的对话会被拆分，避免 embedding 截断)
  maxMessagesPerSegment: 60,
  // API 调用间隔 (毫秒)，防止触发速率限制
  apiDelayMs: 200,
  // 失败重试次数
  maxRetries: 3,
  // 需要处理的消息类型
  validTypes: ['文本消息', '引用消息', '位置消息'],
};

// ========== 初始化 ==========
dotenv.config({ path: path.join(process.cwd(), 'prisma', '.env') });

const prisma = new PrismaClient();

const zhipu = new OpenAI({
  apiKey: process.env.ZHIPU_API_KEY,
  baseURL: 'https://open.bigmodel.cn/api/paas/v4',
});

// ========== 类型定义 ==========
interface WeFlowMessage {
  localId: number;
  createTime: number;
  formattedTime: string;
  type: string;
  localType: number;
  content: string;
  isSend: number; // 1 = 我发的, 0 = 对方发的
  senderUsername: string;
  senderDisplayName: string;
  source: string;
  senderAvatarKey: string;
  // 引用消息特有字段
  appMsgType?: string;
  appMsgKind?: string;
  quotedContent?: string;
  quotedSender?: string;
  quotedType?: string;
}

interface WeFlowData {
  weflow: { version: string; exportedAt: number; generator: string };
  session: { wxid: string; nickname: string; type: string; messageCount: number };
  messages: WeFlowMessage[];
}

interface ConversationSegment {
  startTime: Date;
  endTime: Date;
  messages: WeFlowMessage[];
  formattedContent: string;
}

// ========== 工具函数 ==========

async function generateEmbedding(text: string): Promise<number[]> {
  const cleanText = text.replace(/\n/g, ' ').substring(0, 2000); // embedding-2 有长度限制
  const response = await zhipu.embeddings.create({
    model: 'embedding-2',
    input: cleanText,
  });
  return response.data[0].embedding;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** 带重试的向量生成 */
async function generateEmbeddingWithRetry(text: string, retries = CONFIG.maxRetries): Promise<number[]> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await generateEmbedding(text);
    } catch (error: any) {
      if (attempt === retries) throw error;
      const waitTime = attempt * 1000; // 递增等待
      console.warn(`\n⚠️  向量化失败(第${attempt}次)，${waitTime / 1000}秒后重试...`);
      await sleep(waitTime);
    }
  }
  throw new Error('不可达');
}

/** 格式化单条消息为可读文本 */
function formatMessage(msg: WeFlowMessage): string {
  const time = msg.formattedTime.split(' ')[1] || msg.formattedTime; // 只取时间部分
  const sender = msg.senderDisplayName;

  switch (msg.type) {
    case '文本消息':
      return `[${time}] ${sender}: ${msg.content}`;

    case '引用消息': {
      let text = `[${time}] ${sender}: ${msg.content}`;
      if (msg.quotedContent && msg.quotedSender) {
        text += ` (引用${msg.quotedSender}: ${msg.quotedContent})`;
      }
      return text;
    }

    case '位置消息':
      return `[${time}] ${sender}: [分享位置] ${msg.content}`;

    default:
      return `[${time}] ${sender}: ${msg.content}`;
  }
}

/** 将消息列表按时间间隔分段 */
function segmentMessages(messages: WeFlowMessage[]): ConversationSegment[] {
  if (messages.length === 0) return [];

  const segments: ConversationSegment[] = [];
  let currentSegmentMsgs: WeFlowMessage[] = [messages[0]];

  for (let i = 1; i < messages.length; i++) {
    const gap = messages[i].createTime - messages[i - 1].createTime;

    // 时间间隔过大或当前段已超过最大条数 → 开启新段
    if (gap > CONFIG.segmentGapSeconds || currentSegmentMsgs.length >= CONFIG.maxMessagesPerSegment) {
      segments.push(buildSegment(currentSegmentMsgs));
      currentSegmentMsgs = [messages[i]];
    } else {
      currentSegmentMsgs.push(messages[i]);
    }
  }

  // 最后一段
  if (currentSegmentMsgs.length > 0) {
    segments.push(buildSegment(currentSegmentMsgs));
  }

  return segments;
}

/** 构建一个对话段 */
function buildSegment(msgs: WeFlowMessage[]): ConversationSegment {
  const dateStr = msgs[0].formattedTime.split(' ')[0]; // 取日期部分
  const formattedLines = msgs.map(m => formatMessage(m));
  const formattedContent = `📅 ${dateStr}\n${formattedLines.join('\n')}`;

  return {
    startTime: new Date(msgs[0].createTime * 1000),
    endTime: new Date(msgs[msgs.length - 1].createTime * 1000),
    messages: msgs,
    formattedContent,
  };
}

/** 进度条 */
function printProgress(current: number, total: number, extra = '') {
  const percent = Math.round((current / total) * 100);
  const filled = Math.round(percent / 2);
  const bar = '█'.repeat(filled) + '░'.repeat(50 - filled);
  process.stdout.write(`\r  [${bar}] ${percent}% (${current}/${total}) ${extra}`);
}

// ========== 主流程 ==========
async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  🧠 小七同学 · 记忆导入工具 (WeFlow JSON 版)     ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log();

  // ─── 1. 读取 JSON ───
  const filePath = path.join(process.cwd(), 'scripts', CONFIG.jsonFile);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 未找到文件: ${CONFIG.jsonFile}，请确认文件在 scripts/ 目录下！`);
    return;
  }

  console.log(`📂 正在读取 ${CONFIG.jsonFile}...`);
  const rawData: WeFlowData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const allMessages = rawData.messages;

  console.log(`📊 会话信息: ${rawData.session.nickname} (${rawData.session.type})`);
  console.log(`📊 总消息数: ${allMessages.length}`);
  console.log();

  // ─── 2. 过滤有效消息 ───
  const validMessages = allMessages.filter(m => CONFIG.validTypes.includes(m.type));

  // 统计类型分布
  const typeCounts: Record<string, number> = {};
  allMessages.forEach(m => {
    typeCounts[m.type] = (typeCounts[m.type] || 0) + 1;
  });

  console.log('📋 消息类型分布:');
  Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      const marker = CONFIG.validTypes.includes(type) ? '✅' : '⏭️';
      console.log(`   ${marker} ${type}: ${count} 条`);
    });
  console.log();

  console.log(`🔍 筛选后有效消息: ${validMessages.length} 条`);

  // 按时间排序 (确保顺序正确)
  validMessages.sort((a, b) => a.createTime - b.createTime);

  // ─── 3. 按对话段分组 ───
  const segments = segmentMessages(validMessages);

  // 过滤过短的段落
  const filteredSegments = segments.filter(seg => {
    if (seg.messages.length < CONFIG.minMessagesPerSegment) return false;
    // 计算纯文字内容长度（去掉时间标记和发送者名字）
    const pureTextLength = seg.messages.reduce((sum, m) => sum + m.content.length, 0);
    return pureTextLength >= CONFIG.minCharsPerSegment;
  });

  console.log(`💬 对话分段: ${segments.length} 段 → 过滤后: ${filteredSegments.length} 段`);
  console.log(`   (分段规则: 间隔>${CONFIG.segmentGapSeconds / 60}分钟 或 超${CONFIG.maxMessagesPerSegment}条消息)`);

  // 统计信息
  const avgMsgsPerSeg = Math.round(filteredSegments.reduce((sum, s) => sum + s.messages.length, 0) / filteredSegments.length);
  console.log(`📏 平均每段消息数: ${avgMsgsPerSeg} 条`);
  console.log();

  // ─── 4. 入库循环 ───
  console.log('🚀 开始向量化并入库...');
  console.log();

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 0; i < filteredSegments.length; i++) {
    const seg = filteredSegments[i];

    // 去重检查：用对话段的首条消息时间和内容前100字符做唯一性判断
    const contentPreview = seg.formattedContent.substring(0, 200);
    const exists = await prisma.chatMessage.findFirst({
      where: {
        sendTime: seg.startTime,
        content: { startsWith: contentPreview.substring(0, 50) },
      },
    });

    if (exists) {
      skipCount++;
      printProgress(i + 1, filteredSegments.length, `⏭️ 已存在`);
      continue;
    }

    try {
      // 生成向量
      const vector = await generateEmbeddingWithRetry(seg.formattedContent);

      // 确定主要发送者
      const senderCounts: Record<string, number> = {};
      seg.messages.forEach(m => {
        senderCounts[m.senderDisplayName] = (senderCounts[m.senderDisplayName] || 0) + 1;
      });
      const mainSender = seg.messages.length === 1
        ? seg.messages[0].senderDisplayName
        : '对话记录';

      // 插入数据库
      await prisma.$executeRaw`
        INSERT INTO chat_messages (sender, content, "sendTime", embedding)
        VALUES (${mainSender}, ${seg.formattedContent}, ${seg.startTime}, ${vector}::vector)
      `;

      successCount++;
      printProgress(i + 1, filteredSegments.length, `✅ +${successCount}`);

      // API 速率限制
      await sleep(CONFIG.apiDelayMs);

    } catch (error: any) {
      errorCount++;
      console.error(`\n❌ 第${i + 1}段处理失败: ${error.message?.substring(0, 80)}`);
      // 出错后额外等待一下
      await sleep(1000);
    }
  }

  // ─── 5. 完成统计 ───
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║              🎉 记忆导入完成！                   ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  ✅ 成功入库: ${String(successCount).padStart(5)} 段对话记忆              ║`);
  console.log(`║  ⏭️  跳过重复: ${String(skipCount).padStart(5)} 段                       ║`);
  console.log(`║  ❌ 处理失败: ${String(errorCount).padStart(5)} 段                       ║`);
  console.log(`║  📊 原始消息: ${String(allMessages.length).padStart(5)} 条 → ${filteredSegments.length} 段记忆      ║`);
  console.log('╚══════════════════════════════════════════════════╝');
  console.log();

  if (successCount > 0) {
    console.log('💡 小七同学现在拥有了你们的聊天记忆！');
    console.log('   去 /chat 页面和她聊聊天，问问她："我们第一次聊天说了什么？"');
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('💥 脚本异常退出:', e);
  await prisma.$disconnect();
  process.exit(1);
});
