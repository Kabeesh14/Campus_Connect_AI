import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  FileText, Search, CheckCircle2, ClipboardList, Code2, UserCheck,
  Gift, PartyPopper, Trash2,
} from 'lucide-react';
import { GlassCard, Reveal, Badge, ProgressBar } from '../components/ui';
import { applications as mockApplications } from '../data/mockData';
import { apiRequest } from '../utils/api';
import { cn } from '../utils/cn';

const stages = [
  { id: 'applied', label: 'Applied', icon: FileText, color: 'from-primary to-secondary' },
  { id: 'screening', label: 'Screening', icon: Search, color: 'from-secondary to-accent' },
  { id: 'assessment', label: 'Assessment', icon: ClipboardList, color: 'from-accent to-primary' },
  { id: 'technical', label: 'Technical', icon: Code2, color: 'from-primary to-secondary' },
  { id: 'hr', label: 'HR Round', icon: UserCheck, color: 'from-secondary to-accent' },
  { id: 'offer', label: 'Offer', icon: Gift, color: 'from-accent to-primary' },
  { id: 'joined', label: 'Joined', icon: PartyPopper, color: 'from-success to-accent' },
] as const;

export default function ApplicationsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [apps, setApps] = useState<any[]>(mockApplications);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selected, setSelected] = useState<any>(mockApplications[0]);

  useEffect(() => {
    apiRequest('/jobs/applications').then((res) => {
      if (res.success && res.applications && res.applications.length > 0) {
        setApps(res.applications);
        setSelected(res.applications[0]);
      }
    }).catch(() => {});
  }, []);

  const handleWithdraw = async (appId: string) => {
    try {
      await apiRequest(`/jobs/applications/${appId}`, { method: 'DELETE' });
    } catch {
      // Fallback
    } finally {
      const remaining = apps.filter((a) => a.id !== appId);
      setApps(remaining);
      if (remaining.length > 0) setSelected(remaining[0]);
    }
  };

  const currentIndex = stages.findIndex((s) => s.id === selected?.stage);

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Application Tracker</h1>
          <p className="mt-1 text-soft">Follow every application on an animated roadmap.</p>
        </div>
      </Reveal>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Total', value: apps.length, color: 'text-primary' },
          { label: 'In Progress', value: apps.filter((a) => a.stage !== 'offer' && a.stage !== 'joined').length, color: 'text-warning' },
          { label: 'Offers', value: apps.filter((a) => a.stage === 'offer' || a.stage === 'joined').length, color: 'text-success' },
          { label: 'Avg Days', value: 12, color: 'text-accent' },
        ].map((s, i) => (
          <Reveal key={s.label} delay={i * 0.06}>
            <GlassCard className="text-center">
              <p className={cn('font-display text-3xl font-bold', s.color)}>{s.value}</p>
              <p className="mt-1 text-xs text-soft">{s.label}</p>
            </GlassCard>
          </Reveal>
        ))}
      </div>

      {apps.length === 0 ? (
        <GlassCard className="py-12 text-center">
          <p className="text-soft">You haven't submitted any applications yet.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Applications list */}
          <div className="space-y-3">
            {apps.map((app, i) => (
              <Reveal key={app.id} delay={i * 0.06}>
                <div onClick={() => setSelected(app)}>
                  <GlassCard hover className={cn('cursor-pointer transition-all', selected?.id === app.id ? 'ring-2 ring-primary' : '')}>
                    <div className="flex items-center gap-3">
                      <img src={app.logo} alt={app.company} className="h-10 w-10 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{app.role}</p>
                        <p className="text-xs text-soft">{app.company}</p>
                      </div>
                      <Badge variant={app.stage === 'offer' ? 'success' : app.stage === 'technical' ? 'primary' : 'warning'}>
                        {app.stage}
                      </Badge>
                    </div>
                  </GlassCard>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Detailed Roadmap */}
          {selected && (
            <div className="space-y-6 lg:col-span-2">
              <Reveal delay={0.1}>
                <GlassCard gradient className="relative overflow-hidden">
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img src={selected.logo} alt={selected.company} className="h-14 w-14 rounded-2xl object-cover ring-2 ring-primary/20" />
                      <div>
                        <h2 className="font-display text-xl font-bold">{selected.role}</h2>
                        <p className="text-sm text-soft">{selected.company} • Applied {selected.appliedDate}</p>
                      </div>
                    </div>
                    <button onClick={() => handleWithdraw(selected.id)} className="btn-ghost flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-danger">
                      <Trash2 size={14} /> Withdraw
                    </button>
                  </div>

                  <div className="mt-6 flex items-center justify-between text-sm">
                    <span className="text-soft">Pipeline Progress</span>
                    <span className="font-semibold">{Math.round(((currentIndex + 1) / stages.length) * 100)}%</span>
                  </div>
                  <ProgressBar value={((currentIndex + 1) / stages.length) * 100} className="mt-2" color="primary" />
                </GlassCard>
              </Reveal>

              {/* Animated Timeline */}
              <Reveal delay={0.15}>
                <GlassCard>
                  <h3 className="mb-6 font-display text-lg font-semibold">Stage History</h3>
                  <div className="relative space-y-6 pl-6 before:absolute before:left-2.5 before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-base">
                    {stages.map((stg, i) => {
                      const isCompleted = i <= currentIndex;
                      const isCurrent = i === currentIndex;
                      return (
                        <motion.div key={stg.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                          className="relative flex items-start gap-4">
                          <div className={cn('absolute -left-6 top-0 flex h-6 w-6 items-center justify-center rounded-full text-white shadow-glow transition-all',
                            isCompleted ? 'bg-gradient-to-r from-primary to-secondary ring-4 ring-primary/20' : 'bg-soft text-soft')}>
                            <CheckCircle2 size={14} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className={cn('font-semibold text-sm', isCurrent ? 'text-primary' : isCompleted ? 'text-[rgb(var(--text))]' : 'text-soft')}>
                                {stg.label}
                              </h4>
                              {isCurrent && <Badge variant="primary">Current Stage</Badge>}
                            </div>
                            <p className="mt-0.5 text-xs text-soft">
                              {isCompleted ? 'Completed step verified by recruiting team.' : 'Awaiting scheduled review.'}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </GlassCard>
              </Reveal>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
