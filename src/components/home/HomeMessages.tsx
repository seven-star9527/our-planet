'use client';

import { useState, useEffect } from 'react';

interface Message {
    id: number;
    content: string;
    color: string;
    size: string;
    isAnimated: boolean;
    showAt: Date;
    duration: number;
}

export default function HomeMessages({ initialMessages }: { initialMessages: Message[] }) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setMessages(prev => prev.filter(msg => {
                if (msg.duration === 0) return true;
                const endTime = new Date(new Date(msg.showAt).getTime() + msg.duration * 1000);
                return now <= endTime;
            }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const animatedMessages = messages.filter(m => m.isAnimated);

    if (animatedMessages.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
            {animatedMessages.map((msg) => {
                const top = `${10 + (msg.id * 17) % 70}%`;
                const animationDuration = `${15 + (msg.id % 20)}s`;

                return (
                    <div
                        key={msg.id}
                        className={`absolute animate-float whitespace-nowrap drop-shadow-md font-bold ${msg.size}`}
                        style={{
                            color: msg.color,
                            top,
                            left: '100%',
                            animation: `float-across ${animationDuration} linear infinite`,
                            animationDelay: `${(msg.id * 2) % 10}s`
                        }}
                    >
                        {msg.content}
                    </div>
                );
            })}
        </div>
    );
}
