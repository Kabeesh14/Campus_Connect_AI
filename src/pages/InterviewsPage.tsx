import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  CalendarDays, Clock, Video, MapPin, CheckCircle2, Circle,
  ExternalLink, ChevronRight, Bell, Users,
} from 'lucide-react';
import { GlassCard, Reveal, Badge, GradientButton, ProgressBar } from '../components/ui';
import { interviews } from '../data/mockData';
import { cn } from '../utils/cn';

function CountdownTimer({ daysLeft }: { daysLeft: number }) {
  const [seconds, setSeconds] = useState(daysLeft * 86400);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const box = (v: number, l: string) => (
    <div className="flex flex-col items-center">
      <div className="rounded-xl border border-base bg-soft/40 px-3 py-2 font-display text-2xl font-bold tabular-nums">
        {String(v).padStart(2, '0')}
      </div>
      <span className="mt-1 text-[10px] uppercase tracking-wider text-soft">{l}</span>
    </div>
  );
  return (
    <div className="flex items-center gap-2 sm:gap-3">{box(d, 'Days')}{box(h, 'Hrs')}{box(m, 'Min')}{box(s, 'Sec')}</div>
  );
}

// Simple calendar grid for current month
function MiniCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();
  const interviewDays = interviews.map((iv) => parseInt(iv.date.split(' ')[1]));

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <GlassCard>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">
          {now.toLocaleString('default', { month: 'long' })} {year}
        </h3>
        <CalendarDays size={20} className="text-primary" />
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weekdays.map((w, i) => (
          <div key={i} className="pb-2 text-center text-xs font-semibold text-soft">{w}</div>
        ))}
        {cells.map((day, i) => {
          const isToday = day === today;
          const hasInterview = day && interviewDays.includes(day);
          return (
            <div key={i} className={cn(
              'relative flex aspect-square items-center justify-center rounded-lg text-sm transition-colors',
              !day && 'opacity-0',
              isToday ? 'bg-gradient-to-br from-primary to-secondary font-bold text-white' : hasInterview ? 'bg-primary/15 font-semibold text-primary' : 'hover:bg-soft',
            )}>
              {day}
              {hasInterview && !isToday && <div className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-3 text-xs text-soft">
        <span className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded bg-gradient-to-br from-primary to-secondary" /> Today</span>
        <span className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded bg-primary/30" /> Interview</span>
      </div>
    </GlassCard>
  );
}

export default function InterviewsPage() {
  const [selectedId, setSelectedId] = useState(interviews[0].id);
  const selected = interviews.find((iv) => iv.id === selectedId)!;
  const [prep, setPrep] = useState(selected.prep);
  const prepDone = prep.filter((p) => p.done).length;
  const prepPct = Math.round((prepDone / prep.length) * 100);

  const togglePrep = (idx: number) => {
    setPrep((prev) => prev.map((p, i) => i === idx ? { ...p, done: !p.done } : p));
  };

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Interviews</h1>
          <p className="mt-1 text-soft">Stay prepared with countdowns, checklists, and meeting links.</p>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Interview list */}
        <div className="space-y-4">
          {interviews.map((iv, i) => (
            <Reveal key={iv.id} delay={i * 0.08}>
              <motion.button whileHover={{ x: 4 }} onClick={() => { setSelectedId(iv.id); setPrep(iv.prep); }}
                className={cn('w-full rounded-2xl border p-4 text-left transition-all',
                  selectedId === iv.id ? 'gradient-border shadow-glow' : 'border-base bg-soft/40 hover:bg-soft')}>
                <div className="flex items-center gap-3">
                  <img src={iv.logo} alt={iv.company} className="h-12 w-12 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{iv.company}</p>
                    <p className="text-xs text-soft">{iv.round}</p>
                  </div>
                  <Badge variant={iv.daysLeft <= 3 ? 'danger' : 'warning'}>{iv.daysLeft}d</Badge>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-soft">
                  <CalendarDays size={13} /> {iv.date} • {iv.time}
                </div>
              </motion.button>
            </Reveal>
          ))}
          <Reveal delay={0.2}><MiniCalendar /></Reveal>
        </div>

        {/* Selected interview detail */}
        <div className="space-y-6 lg:col-span-2">
          <Reveal delay={0.1}>
            <GlassCard gradient className="relative overflow-hidden">
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
              <div className="relative">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-4">
                    <img src={selected.logo} alt={selected.company} className="h-16 w-16 rounded-2xl object-cover ring-2 ring-primary/20" />
                    <div>
                      <h2 className="font-display text-xl font-bold">{selected.role}</h2>
                      <p className="text-sm text-soft">{selected.company}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="primary">{selected.type}</Badge>
                        <Badge variant="accent">{selected.round}</Badge>
                        <Badge variant={selected.mode === 'online' ? 'success' : 'warning'}>
                          {selected.mode === 'online' ? <Video size={12} /> : <MapPin size={12} />} {selected.mode}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary"><Clock size={16} /> Countdown to interview</p>
                  <CountdownTimer daysLeft={selected.daysLeft} />
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="rounded-xl border border-base bg-soft/40 px-4 py-2 text-sm">
                    <span className="text-soft">Date: </span><span className="font-semibold">{selected.date}</span>
                  </div>
                  <div className="rounded-xl border border-base bg-soft/40 px-4 py-2 text-sm">
                    <span className="text-soft">Time: </span><span className="font-semibold">{selected.time}</span>
                  </div>
                  {selected.meetingLink && (
                    <a href={selected.meetingLink} target="_blank" rel="noopener noreferrer">
                      <GradientButton className="py-2" icon={<ExternalLink size={16} />}>Join Meeting</GradientButton>
                    </a>
                  )}
                </div>
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.15}>
            <GlassCard>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">Preparation Checklist</h3>
                <Badge variant="success">{prepDone}/{prep.length} done</Badge>
              </div>
              <div className="mt-4">
                <ProgressBar value={prepPct} color={prepPct === 100 ? 'success' : 'primary'} />
              </div>
              <div className="mt-4 space-y-2.5">
                {prep.map((p, idx) => (
                  <motion.button key={idx} onClick={() => togglePrep(idx)}
                    whileHover={{ x: 2 }}
                    className={cn('flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all',
                      p.done ? 'border-success/30 bg-success/5' : 'border-base bg-soft/40 hover:bg-soft')}>
                    {p.done ? <CheckCircle2 size={20} className="text-success" /> : <Circle size={20} className="text-soft" />}
                    <span className={cn('text-sm', p.done ? 'text-soft line-through' : 'font-medium')}>{p.label}</span>
                  </motion.button>
                ))}
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.2}>
            <GlassCard>
              <h3 className="font-display text-lg font-semibold">Interview Instructions</h3>
              <div className="mt-4 space-y-3 text-sm">
                {[
                  { icon: Users, text: 'Have your ID and resume ready for verification at the start.' },
                  { icon: Video, text: 'Test your camera, microphone, and internet connection 15 minutes before.' },
                  { icon: Bell, text: 'Keep notifications muted and find a quiet, well-lit space.' },
                  { icon: ChevronRight, text: 'Prepare 2-3 thoughtful questions to ask the interviewer at the end.' },
                ].map((row, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl border border-base bg-soft/40 p-3">
                    <row.icon size={18} className="mt-0.5 shrink-0 text-primary" />
                    <span className="text-soft">{row.text}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
