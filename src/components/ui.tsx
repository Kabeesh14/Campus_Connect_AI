import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../utils/cn';

export function AuroraBackground({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-primary/40 blur-[120px] animate-aurora" />
      <div className="absolute top-20 -right-24 h-[26rem] w-[26rem] rounded-full bg-secondary/40 blur-[120px] animate-aurora" style={{ animationDelay: '4s' }} />
      <div className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-accent/30 blur-[120px] animate-aurora" style={{ animationDelay: '8s' }} />
      <div className="absolute inset-0 bg-grid opacity-40" />
    </div>
  );
}

export function GlassCard({
  children, className, gradient, hover,
}: { children: ReactNode; className?: string; gradient?: boolean; hover?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hover ? { y: -4, transition: { duration: 0.25 } } : undefined}
      className={cn(
        gradient ? 'gradient-border' : 'glass',
        'rounded-3xl p-6 shadow-soft',
        hover && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

export function Reveal({
  children, delay = 0, y = 24, className,
}: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function CountUp({ to, suffix = '', duration = 1.6, decimals = 0 }: { to: number; suffix?: string; duration?: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(to * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return (
    <span ref={ref}>
      {val.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

export function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useSpring(useMotionValue(0), { stiffness: 150, damping: 15 });
  const ry = useSpring(useMotionValue(0), { stiffness: 150, damping: 15 });
  const tX = useTransform(rx, [-10, 10], ['10deg', '-10deg']);
  const tY = useTransform(ry, [-10, 10], ['-10deg', '10deg']);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 20);
    rx.set(((e.clientY - r.top) / r.height - 0.5) * 20);
  };
  const onLeave = () => { rx.set(0); ry.set(0); };

  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ rotateX: tX, rotateY: tY, transformStyle: 'preserve-3d' }} className={className}>
      {children}
    </motion.div>
  );
}

export function Badge({ children, variant = 'primary', className }: { children: ReactNode; variant?: 'primary' | 'success' | 'warning' | 'danger' | 'accent' | 'neutral'; className?: string }) {
  const variants: Record<string, string> = {
    primary: 'bg-primary/15 text-primary border-primary/25',
    success: 'bg-success/15 text-success border-success/25',
    warning: 'bg-warning/15 text-warning border-warning/25',
    danger: 'bg-danger/15 text-danger border-danger/25',
    accent: 'bg-accent/15 text-accent border-accent/25',
    neutral: 'bg-soft text-soft border-base',
  };
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold', variants[variant], className)}>
      {children}
    </span>
  );
}

export function ProgressRing({
  value, size = 120, stroke = 10, label, sublabel, gradient = true,
}: { value: number; size?: number; stroke?: number; label?: string; sublabel?: string; gradient?: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true });
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circ);
  useEffect(() => {
    if (inView) setOffset(circ - (value / 100) * circ);
  }, [inView, value, circ]);
  const id = `ring-${label}-${size}-${Math.random().toString(36).slice(2, 7)}`;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg ref={ref} width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-soft/15" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={gradient ? `url(#${id})` : '#6366F1'}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.5))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-xl font-bold"><CountUp to={value} />%</span>
        {label && <span className="text-[10px] uppercase tracking-wider text-soft">{label}</span>}
        {sublabel && <span className="text-[10px] text-soft">{sublabel}</span>}
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-xl', className)} />;
}

export const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export function SectionHeading({ eyebrow, title, subtitle, center }: { eyebrow?: string; title: ReactNode; subtitle?: string; center?: boolean }) {
  return (
    <div className={cn('max-w-2xl', center && 'mx-auto text-center')}>
      {eyebrow && (
        <Reveal>
          <span className="mb-3 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</span>
        </Reveal>
      )}
      <Reveal delay={0.05}>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{title}</h2>
      </Reveal>
      {subtitle && (
        <Reveal delay={0.1}>
          <p className="mt-4 text-base text-soft sm:text-lg">{subtitle}</p>
        </Reveal>
      )}
    </div>
  );
}

export function GradientButton({
  children, onClick, className, type = 'button', icon, disabled,
}: { children: ReactNode; onClick?: () => void; className?: string; type?: 'button' | 'submit'; icon?: ReactNode; disabled?: boolean }) {
  return (
    <motion.button type={type} onClick={onClick} disabled={disabled} whileHover={disabled ? undefined : { scale: 1.02 }} whileTap={disabled ? undefined : { scale: 0.98 }}
      className={cn('btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold', disabled && 'opacity-60 cursor-not-allowed', className)}>
      {icon}{children}
    </motion.button>
  );
}

export function GhostButton({
  children, onClick, className, icon, disabled,
}: { children: ReactNode; onClick?: () => void; className?: string; icon?: ReactNode; disabled?: boolean }) {
  return (
    <motion.button whileHover={disabled ? undefined : { scale: 1.02 }} whileTap={disabled ? undefined : { scale: 0.98 }} onClick={onClick} disabled={disabled}
      className={cn('btn-ghost inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-[rgb(var(--text))]', disabled && 'opacity-60 cursor-not-allowed', className)}>
      {icon}{children}
    </motion.button>
  );
}

export function ProgressBar({ value, className, color = 'primary' }: { value: number; className?: string; color?: 'primary' | 'success' | 'warning' | 'danger' }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const colors: Record<string, string> = {
    primary: 'from-primary to-secondary',
    success: 'from-success to-accent',
    warning: 'from-warning to-primary',
    danger: 'from-danger to-warning',
  };
  return (
    <div ref={ref} className={cn('h-2 w-full overflow-hidden rounded-full bg-soft', className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={inView ? { width: `${value}%` } : {}}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className={cn('h-full rounded-full bg-gradient-to-r', colors[color])}
      />
    </div>
  );
}
