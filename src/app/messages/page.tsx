import prisma from '@/lib/prisma';
import Link from 'next/link';
import { cookies } from 'next/headers';
import MessageForm from '@/components/messages/MessageForm';

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
    const cookieStore = await cookies();
    const role = cookieStore.get('user_role')?.value;

    const messages = await prisma.homeMessage.findMany({
        orderBy: { createdAt: 'desc' }
    });

    return (
        <main className="min-h-screen bg-gray-50 pb-24">
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center shadow-sm">
                <Link href="/" className="text-gray-500 hover:text-gray-800 transition-colors p-2 -ml-2 rounded-full hover:bg-gray-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <h1 className="text-lg font-bold text-gray-800 ml-2">💌 留言历史记录</h1>
            </div>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

                {/* 发送留言表单 */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 mb-6">
                    <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                        <span className="text-lg">✍️</span> 留下新的印记
                    </h2>
                    <MessageForm role={role} />
                </div>

                <h2 className="text-sm font-bold text-gray-700 mt-8 mb-2 px-1 flex items-center gap-1.5">
                    <span className="text-lg">🕰️</span> 历史留言
                </h2>

                {messages.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
                        <div className="text-4xl mb-3">📭</div>
                        <p>还没有任何留言记录哦~</p>
                    </div>
                ) : (
                    messages.map((msg: any) => (
                        <div key={msg.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 transition-all hover:shadow-md animate-fade-in-up">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${msg.sender === 'boy' ? 'bg-blue-100 text-blue-600' : msg.sender === 'girl' ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600'}`}>
                                        {msg.sender === 'boy' ? '👦' : msg.sender === 'girl' ? '👧' : '👤'}
                                    </span>
                                    <div>
                                        <div className="text-xs font-bold text-gray-700">
                                            {msg.sender === 'boy' ? '男生' : msg.sender === 'girl' ? '女生' : 'TA'}
                                        </div>
                                        <div className="text-[10px] text-gray-400">
                                            {msg.createdAt.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <form action={async () => {
                                    'use server';
                                    const { deleteMessage } = await import('@/actions/messages');
                                    await deleteMessage(msg.id);
                                }}>
                                    <button
                                        type="submit"
                                        className="w-7 h-7 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-full flex gap-1 items-center justify-center transition-colors"
                                        title="删除留言"
                                    >
                                        ×
                                    </button>
                                </form>
                            </div>

                            <p className="text-sm font-medium leading-relaxed bg-gray-50/50 p-3 rounded-xl border border-gray-50" style={{ color: msg.color }}>
                                {msg.content}
                            </p>

                            <div className="flex gap-2 mt-3 flex-wrap">
                                {msg.isAnimated && (
                                    <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium border border-purple-100">
                                        🚀 弹幕漂浮
                                    </span>
                                )}
                                <span className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100">
                                    {msg.duration === 0 ? '永久展示' : `${msg.duration}秒可见`}
                                </span>
                                <span className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100 flex items-center gap-1">
                                    颜色: <span className="w-2.5 h-2.5 rounded-full inline-block shadow-sm" style={{ backgroundColor: msg.color }}></span>
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </main>
    );
}
