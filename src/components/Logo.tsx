import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

export function Logo({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-xl bg-gradient-aurora opacity-90"
          style={{ filter: 'blur(6px)' }}
        />
        <div className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white font-bold shadow-glow"
          style={{ width: size, height: size, fontSize: size * 0.5 }}>
          <svg viewBox="0 0 24 24" fill="none" width={size * 0.55} height={size * 0.55}>
            <path d="M4 7h16M4 12h10M4 17h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="18" cy="16" r="3" fill="currentColor" opacity="0.5" />
          </svg>
        </div>
      </div>
      <span className="font-display text-lg font-bold tracking-tight">
        Campus<span className="gradient-text">Connect</span>
      </span>
    </div>
  );
}
