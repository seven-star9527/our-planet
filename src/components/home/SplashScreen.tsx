'use client';

import { useState, useEffect } from 'react';

interface SplashProps {
    enabled: boolean;
    mode: string; // 'template' | 'custom'
    templates: string; // comma separated: 'fireworks,cake,flowers,hearts,stars,balloons,meteor'
    mediaUrl: string;
    text: string;
    entryType: string; // 'click' | 'countdown'
    duration: number;
}

export default function SplashScreen({ config }: { config: SplashProps }) {
    const [isVisible, setIsVisible] = useState(true);
    const [timeLeft, setTimeLeft] = useState(config.duration || 5);

    useEffect(() => {
        // If the splash screen is disabled, just return right away
        if (!config.enabled) {
            setIsVisible(false);
            return;
        }

        // Handle countdown mode
        if (config.entryType === 'countdown') {
            if (timeLeft <= 0) {
                handleEnter();
                return;
            }
            const timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [config.enabled, config.entryType, timeLeft]);

    const handleEnter = () => {
        setIsVisible(false);
    };

    if (!isVisible) return null;

    const selectedTemplates = config.templates.split(',').map(t => t.trim()).filter(Boolean);

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center overflow-hidden animate-fade-in transition-opacity duration-1000">
            {/* Background Layers */}

            {/* 1. Custom Media Background */}
            {config.mode === 'custom' && config.mediaUrl && (
                <div className="absolute inset-0 z-0">
                    {/* Check if video or image by simple string search */}
                    {config.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video src={config.mediaUrl} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-60" />
                    ) : (
                        <img src={config.mediaUrl} alt="Splash Background" className="w-full h-full object-cover opacity-60" />
                    )}
                </div>
            )}

            {/* 2. Template Layers */}
            {config.mode === 'template' && (
                <div className="absolute inset-0 z-0 pointer-events-none">

                    {/* Stars Template */}
                    {selectedTemplates.includes('stars') && (
                        Array.from({ length: 30 }).map((_, i) => (
                            <div
                                key={`star-${i}`}
                                className="absolute text-yellow-200 animate-twinkle"
                                style={{
                                    top: `${Math.random() * 100}%`,
                                    left: `${Math.random() * 100}%`,
                                    fontSize: `${Math.random() * 1.5 + 0.5}rem`,
                                    animationDelay: `${Math.random() * 5}s`,
                                }}
                            >✨</div>
                        ))
                    )}

                    {/* Meteor Template */}
                    {selectedTemplates.includes('meteor') && (
                        Array.from({ length: 15 }).map((_, i) => (
                            <div
                                key={`meteor-${i}`}
                                className="absolute text-blue-100 animate-meteor"
                                style={{
                                    top: `${Math.random() * (-50)}%`, // Start above screen
                                    left: `${Math.random() * 150}%`, // Can come from sides
                                    fontSize: `${Math.random() * 1 + 1}rem`,
                                    animationDelay: `${Math.random() * 10}s`,
                                    transform: `rotate(-45deg)`
                                }}
                            >🌠</div>
                        ))
                    )}

                    {/* Hearts Template */}
                    {selectedTemplates.includes('hearts') && (
                        Array.from({ length: 25 }).map((_, i) => (
                            <div
                                key={`heart-${i}`}
                                className="absolute text-pink-500 animate-float-up"
                                style={{
                                    bottom: `-10%`,
                                    left: `${Math.random() * 100}%`,
                                    fontSize: `${Math.random() * 2 + 1}rem`,
                                    animationDuration: `${Math.random() * 5 + 5}s`,
                                    animationDelay: `${Math.random() * 10}s`,
                                }}
                            >💖</div>
                        ))
                    )}

                    {/* Balloons Template */}
                    {selectedTemplates.includes('balloons') && (
                        Array.from({ length: 15 }).map((_, i) => (
                            <div
                                key={`balloon-${i}`}
                                className="absolute animate-float-up"
                                style={{
                                    bottom: `-20%`,
                                    left: `${Math.random() * 100}%`,
                                    fontSize: `${Math.random() * 3 + 2}rem`,
                                    animationDuration: `${Math.random() * 8 + 6}s`,
                                    animationDelay: `${Math.random() * 8}s`,
                                }}
                            >🎈</div>
                        ))
                    )}

                    {/* Flowers Template */}
                    {selectedTemplates.includes('flowers') && (
                        Array.from({ length: 40 }).map((_, i) => (
                            <div
                                key={`flower-${i}`}
                                className="absolute text-pink-300 animate-fall-down"
                                style={{
                                    top: `-10%`,
                                    left: `${Math.random() * 100}%`,
                                    fontSize: `${Math.random() * 1.5 + 0.5}rem`,
                                    animationDuration: `${Math.random() * 6 + 4}s`,
                                    animationDelay: `${Math.random() * 10}s`,
                                }}
                            >🌸</div>
                        ))
                    )}

                    {/* Fireworks Template */}
                    {selectedTemplates.includes('fireworks') && (
                        Array.from({ length: 12 }).map((_, i) => (
                            <div
                                key={`firework-${i}`}
                                className="absolute animate-firework-boom text-transparent"
                                style={{
                                    top: `${Math.random() * 60 + 10}%`,
                                    left: `${Math.random() * 80 + 10}%`,
                                    animationDelay: `${Math.random() * 4}s`,
                                    textShadow: `0 0 20px ${['#ff0', '#f0f', '#0ff', '#f00', '#0f0'][Math.floor(Math.random() * 5)]}`
                                }}
                            >🎇</div>
                        ))
                    )}

                    {/* Cake Template (always center if active) */}
                    {selectedTemplates.includes('cake') && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-40">
                            <div className="text-[15rem] animate-pulse drop-shadow-2xl">
                                🎂
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Foreground Content */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 space-y-12">

                {/* Greeting Text */}
                {config.text && (
                    <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-300 drop-shadow-md animate-fade-in-up leading-tight max-w-2xl" style={{ animationDelay: '0.5s' }}>
                        {config.text.split('\n').map((line, i) => (
                            <span key={i} className="block mb-2">{line}</span>
                        ))}
                    </h1>
                )}

                {/* Interaction Controls */}
                <div className="animate-fade-in-up" autoFocus style={{ animationDelay: '1.5s' }}>
                    {config.entryType === 'countdown' ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="text-6xl font-black text-white/90 drop-shadow-lg tracking-tighter">
                                {timeLeft}
                            </div>
                            <button
                                onClick={handleEnter}
                                className="px-6 py-2 rounded-full border border-white/20 text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium backdrop-blur-sm"
                            >
                                跳过
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleEnter}
                            className="group relative px-8 py-3 bg-gradient-to-r from-pink-500 hover:from-pink-400 to-purple-500 hover:to-purple-400 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-pink-500/50 transition-all duration-300 transform hover:scale-105"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                点击进入星球 <span className="group-hover:translate-x-1 transition-transform">🚀</span>
                            </span>
                            <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping opacity-50"></div>
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
