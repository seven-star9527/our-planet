'use client'

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WelcomeAnimationPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    if (audioRef.current) {
      audioRef.current.volume = 0.4;
      audioRef.current.play().catch(e => console.log("浏览器限制自动播放", e));
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const fireworks: Firework[] = [];
    const particles: Particle[] = [];
    // 烟花颜色库 (使用 RGB 格式方便处理透明度)
    const colors = ['255, 105, 180', '138, 43, 226', '0, 255, 204', '255, 204, 0', '255, 0, 102'];

    // 1. 烟花升空火箭类
    class Firework {
      x: number; y: number;
      targetX: number; targetY: number;
      color: string; vx: number; vy: number;
      trail: {x: number, y: number}[]; exploded: boolean;

      constructor(x: number, y: number, targetX: number, targetY: number, color: string) {
        this.x = x; this.y = y;
        this.targetX = targetX; this.targetY = targetY;
        this.color = color;
        
        // 计算向目标点飞行的速度
        const distance = Math.sqrt((targetX - x) ** 2 + (targetY - y) ** 2);
        const speed = distance / 50; // 升空耗时约 50 帧，感觉更真实
        const angle = Math.atan2(targetY - y, targetX - x);
        
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.trail = [];
        this.exploded = false;
      }

      update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 3) this.trail.shift();
        
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.03; // 微弱的重力让上升轨迹有一点点抛物线

        // 到达最高点或者开始下坠时爆炸
        if (this.vy >= 0 || this.y <= this.targetY) {
          this.exploded = true;
          createParticles(this.x, this.y, this.color);
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        const start = this.trail[0] || { x: this.x, y: this.y };
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = '#ffffff'; // 升空时的白色引线
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // 2. 爆炸散落粒子类
    class Particle {
      x: number; y: number; color: string;
      vx: number; vy: number; alpha: number;
      friction: number; gravity: number; decay: number;
      trail: {x: number, y: number}[];

      constructor(x: number, y: number, color: string) {
        this.x = x; this.y = y; this.color = color;
        const angle = Math.random() * Math.PI * 2;
        // 初始爆炸速度不同，形成立体的球形
        const speed = Math.random() * 5 + 1; 
        
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.alpha = 1;
        this.friction = 0.94; // 空气阻力：迅速减速
        this.gravity = 0.08;  // 重力：下坠垂落感
        this.decay = Math.random() * 0.015 + 0.01; // 燃烧衰减速度
        this.trail = [];
      }

      update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 4) this.trail.shift();
        
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        if (this.trail.length > 0) {
          ctx.moveTo(this.trail[0].x, this.trail[0].y);
          ctx.lineTo(this.x, this.y);
        } else {
          ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
        }
        ctx.strokeStyle = `rgba(${this.color}, ${this.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    const createParticles = (x: number, y: number, color: string) => {
      for (let i = 0; i < 60; i++) {
        particles.push(new Particle(x, y, color));
      }
    };

    // 自动随机发射烟花
    const autoLaunch = () => {
      const x = Math.random() * canvas.width;
      const y = canvas.height;
      const targetX = x + (Math.random() * 200 - 100);
      const targetY = Math.random() * (canvas.height / 2.5); // 炸在屏幕中上方
      const color = colors[Math.floor(Math.random() * colors.length)];
      fireworks.push(new Firework(x, y, targetX, targetY, color));
    };

    // 初始连放3发
    setTimeout(autoLaunch, 200);
    setTimeout(autoLaunch, 800);
    setTimeout(autoLaunch, 1500);

    // 持续发射
    const interval = setInterval(() => {
      if (Math.random() < 0.6) autoLaunch(); // 随机发射间隔，更自然
    }, 800);

    // 动画引擎帧循环
    let animationId: number;
    const loop = () => {
      // 制造夜空和烟花的残影拖尾效果
      ctx.fillStyle = 'rgba(10, 10, 10, 0.2)'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        fireworks[i].draw(ctx);
        if (fireworks[i].exploded) fireworks.splice(i, 1);
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw(ctx);
        if (particles[i].alpha <= 0) particles.splice(i, 1);
      }
      animationId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div 
      onClick={() => router.push('/')}
      className="fixed inset-0 z-50 bg-[#0a0a0a] overflow-hidden cursor-pointer flex flex-col items-center justify-center select-none"
    >
      {/* 烟花音效 */}
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3" loop />

      {/* 烟花画布 */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0"></canvas>

      {/* 飘落的鲜花 */}
      {mounted && [...Array(12)].map((_, i) => (
        <div 
          key={i} 
          className="absolute animate-float-down opacity-80 z-10"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-10%`,
            animationDuration: `${Math.random() * 4 + 4}s`,
            animationDelay: `${Math.random() * 2}s`,
            fontSize: `${Math.random() * 10 + 15}px`,
          }}
        >
          {['🌸', '✨', '💖'][Math.floor(Math.random() * 3)]}
        </div>
      ))}

      {/* 主体文字 - 去掉了难看的黑框和边框，完全融入夜空 */}
      <div className="relative z-20 text-center animate-fade-in-up mt-[-10vh]">
        <div className="text-6xl mb-6 animate-bounce drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">🎂</div>
        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-200 to-indigo-300 tracking-wider mb-3 drop-shadow-[0_0_25px_rgba(236,72,153,0.8)]">
          生日快乐，宝贝
        </h1>
        <p className="text-lg text-pink-100/90 font-medium tracking-widest mt-4 drop-shadow-md">
          新的一岁，也要一直开心
        </p>
      </div>

      <div className="absolute bottom-12 text-white/50 text-sm tracking-widest animate-pulse flex flex-col items-center gap-2 z-20">
        <span>点击屏幕进入我们的星球</span>
        <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>

      <style jsx global>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(30px) scale(0.9); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up { animation: fade-in-up 2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        @keyframes float-down {
          0% { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(120vh) rotate(360deg); }
        }
        .animate-float-down { animation-name: float-down; animation-timing-function: linear; animation-iteration-count: infinite; }
      `}</style>
    </div>
  );
}