import React, { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PartyPopper } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
  gravity: number;
  decay: number;
}

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE'];

export const CelebrationModal: React.FC<CelebrationModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  const createBurst = useCallback((cx: number, cy: number) => {
    const count = 30;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 2 + Math.random() * 4;
      particlesRef.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        alpha: 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 3 + Math.random() * 4,
        gravity: 0.04,
        decay: 0.012 + Math.random() * 0.01,
      });
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Launch multiple bursts
    const burstInterval = setInterval(() => {
      const x = canvas.width * (0.15 + Math.random() * 0.7);
      const y = canvas.height * (0.15 + Math.random() * 0.35);
      createBurst(x, y);
    }, 800);

    // Initial bursts
    setTimeout(() => createBurst(canvas.width * 0.25, canvas.height * 0.3), 100);
    setTimeout(() => createBurst(canvas.width * 0.75, canvas.height * 0.2), 300);
    setTimeout(() => createBurst(canvas.width * 0.5, canvas.height * 0.15), 500);

    let running = true;
    const animate = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0.02);

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.alpha -= p.decay;
        p.vx *= 0.99;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      window.removeEventListener('resize', resize);
      clearInterval(burstInterval);
      cancelAnimationFrame(animFrameRef.current);
      particlesRef.current = [];
    };
  }, [isOpen, createBurst]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <canvas
            ref={canvasRef}
            className="fixed inset-0 z-[70] pointer-events-none"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6 pointer-events-none"
          >
            <div className="bg-white rounded-[32px] p-8 shadow-2xl border border-[#E0E0D5] max-w-sm w-full text-center pointer-events-auto">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 bg-[#F9F9F7] text-[#8A8A7A] hover:bg-[#EAEAE0] hover:text-[#4A4A40] rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
                className="w-20 h-20 bg-gradient-to-br from-[#FFEAA7] to-[#FDCB6E] rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg"
              >
                <PartyPopper className="w-10 h-10 text-[#E17055]" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-serif font-bold text-[#5A5A40] mb-2"
              >
                {t('video.checkInSuccess') || '打卡成功！'}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="text-[#848464] text-sm mb-6 leading-relaxed"
              >
                {t('video.checkInSuccessDesc') || '太棒了！你今天又进步了一点，继续保持学习的热情吧！'}
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onClick={onClose}
                className="bg-[#D48166] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#C27055] transition-colors shadow-md"
              >
                {t('video.continue') || '继续学习'}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
