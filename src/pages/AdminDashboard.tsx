import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Users, Building2, Briefcase, TrendingUp, Award, Activity as ActivityIcon,
  ArrowUpRight, ChevronRight, FileText, Megaphone, BarChart3,
  Plus, CheckCircle2, XCircle, CalendarDays, X,
} from 'lucide-react';
import { GlassCard, Reveal, Badge, CountUp, ProgressBar, GradientButton } from '../components/ui';
import { adminStats, jobs as mockJobs, applications as mockApplications } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import { cn } from '../utils/cn';

function KpiWidget({ label, value, suffix, icon: Icon, trend, color, decimals }: {
  label: string; value: number; suffix?: string; icon: typeof Users; trend: string; color: string; decimals?: number;
}) {
  return (
    <GlassCard hover className="relative overflow-hidden">
      <div className={cn('absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl', color)} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className={cn('rounded-xl p-2.5 text-white', color)}><Icon size={20} /></div>
          <span className="flex items-center gap-1 text-xs font-semibold text-success"><ArrowUpRight size={14} /> {trend}</span>
        </div>
        <p className="mt-4 font-display text-3xl font-bold">
          <CountUp to={value} suffix={suffix} decimals={decimals ?? 0} />
        </p>
        <p className="mt-1 text-sm text-soft">{label}</p>
      </div>
    </GlassCard>
  );
}

function LineChart({ data, height = 160 }: { data: number[]; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / range) * 80 - 10;
    return `${x},${y}`;
  }).join(' ');
  const areaPoints = `0,100 ${points} 100,100`;
  return (
    <div className="relative" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
        <defs>
          <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.polygon initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1 }}
          points={areaPoints} fill="url(#chart-grad)" />
        <motion.polyline initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.5, ease: 'easeInOut' }}
          points={points} fill="none" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {data.map((v, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = 100 - ((v - min) / range) * 80 - 10;
          return <motion.circle key={i} initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            cx={x} cy={y} r="1.2" fill="#8B5CF6" vectorEffect="non-scaling-stroke" />;
        })}
      </svg>
    </div>
  );
}

function BarChart({ data, color = 'from-primary to-secondary' }: { data: { dept: string; placed: number; total: number }[]; color?: string }) {
  const max = Math.max(...data.map((d) => d.total));
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <motion.div key={d.dept} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">{d.dept}</span>
            <span className="text-soft">{d.placed}/{d.total} • {Math.round((d.placed / d.total) * 100)}%</span>
          </div>
          <div className="relative mt-1.5 h-3 overflow-hidden rounded-full bg-soft">
            <motion.div initial={{ width: 0 }} whileInView={{ width: `${(d.placed / max) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: i * 0.08 }}
              className={cn('h-full rounded-full bg-gradient-to-r', color)} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function Heatmap() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const colors = ['bg-soft', 'bg-primary/20', 'bg-primary/40', 'bg-primary/60', 'bg-primary/80'];
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[500px]">
        <div className="mb-2 flex gap-1">
          <div className="w-10" />
          {Array.from({ length: 18 }).map((_, h) => (
            <div key={h} className="flex-1 text-center text-[8px] text-soft">{h + 6}h</div>
          ))}
        </div>
        {days.map((day, d) => (
          <div key={day} className="mb-1 flex items-center gap-1">
            <div className="w-10 text-xs font-medium text-soft">{day}</div>
            {Array.from({ length: 18 }).map((_, h) => {
              const cell = adminStats.heatmap.find((c) => c.day === d && c.hour === h);
              return <div key={h} className={cn('flex-1 rounded-sm aspect-square transition-colors hover:ring-2 hover:ring-primary/40', colors[cell?.value ?? 0])} />;
            })}
          </div>
        ))}
        <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-soft">
          Less {colors.map((c, i) => <div key={i} className={cn('h-3 w-3 rounded-sm', c)} />)} More
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const isRecruiter = user?.role === 'recruiter';

  // Live Analytics State
  const [statsData, setStatsData] = useState(adminStats);

  // Recruiter States
  const [jobs, setJobs] = useState(mockJobs);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [applicants, setApplicants] = useState<any[]>(mockApplications);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);

  useEffect(() => {
    apiRequest('/analytics/placement').then((res) => {
      if (res.success && res.analytics) {
        setStatsData((prev) => ({ ...prev, ...res.analytics }));
      }
    }).catch(() => {});
  }, []);

  // Job Form State
  const [roleTitle, setRoleTitle] = useState('');
  const [packageVal, setPackageVal] = useState('₹18L');
  const [locationVal, setLocationVal] = useState('Bangalore');
  const [jobType, setJobType] = useState('Full-time');
  const [isRemote, setIsRemote] = useState(false);
  const [reqsText, setReqsText] = useState('DSA, React, TypeScript');

  // Interview Form State
  const [ivDate, setIvDate] = useState('Jul 28');
  const [ivTime, setIvTime] = useState('10:00 AM');
  const [ivRound, setIvRound] = useState('Technical Round 1');
  const [ivLink, setIvLink] = useState('https://meet.google.com/abc-defg-hij');

  // Announcement Form State
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');

  const handleCreateAnnouncement = async () => {
    if (!annTitle.trim() || !annBody.trim()) return;
    try {
      await apiRequest('/officer/announcements', {
        method: 'POST',
        body: JSON.stringify({ title: annTitle, body: annBody }),
      });
    } catch {
      // Fallback
    } finally {
      setAnnTitle('');
      setAnnBody('');
      setShowAnnouncementModal(false);
    }
  };

  useEffect(() => {
    if (isRecruiter) {
      apiRequest('/recruiter/applicants').then((res) => {
        if (res.success && res.applicants) setApplicants(res.applicants);
      }).catch(() => {});
    }
  }, [isRecruiter]);

  const handlePostJob = async () => {
    if (!roleTitle.trim()) return;
    const requirements = reqsText.split(',').map((s) => s.trim());
    try {
      const res = await apiRequest('/recruiter/jobs', {
        method: 'POST',
        body: JSON.stringify({
          role: roleTitle,
          package: packageVal,
          location: locationVal,
          type: jobType,
          remote: isRemote,
          requirements,
          company: user?.headline || 'Tech Corp',
        }),
      });
      if (res.success && res.job) {
        setJobs((prev) => [res.job, ...prev]);
      }
    } catch {
      // Local fallback
      setJobs((prev) => [
        {
          id: 'j-' + Date.now(),
          companyId: 'c1',
          company: 'Google',
          logo: 'https://logo.clearbit.com/google.com',
          role: roleTitle,
          package: packageVal,
          location: locationVal,
          type: jobType,
          remote: isRemote,
          requirements,
          responsibilities: ['Build features', 'Design API'],
          eligibility: 'CGPA 7.0+',
          skills: requirements,
          match: 92,
          postedDays: 0,
          deadline: '14 days left',
          description: 'New role posted by recruiter.',
        },
        ...prev,
      ]);
    } finally {
      setRoleTitle('');
      setShowJobModal(false);
    }
  };

  const handleStatusUpdate = async (appId: string, stage: string, status: string) => {
    try {
      await apiRequest(`/recruiter/applicants/${appId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ stage, status }),
      });
    } catch {
      // Fallback
    } finally {
      setApplicants((prev) => prev.map((a) => a.id === appId ? { ...a, stage, status, updatedDate: 'Just now' } : a));
    }
  };

  const handleScheduleInterview = async () => {
    if (!selectedApplicant) return;
    try {
      await apiRequest('/recruiter/interviews', {
        method: 'POST',
        body: JSON.stringify({
          applicationId: selectedApplicant.id,
          studentId: 's-1',
          role: selectedApplicant.role,
          company: selectedApplicant.company,
          date: ivDate,
          time: ivTime,
          round: ivRound,
          meetingLink: ivLink,
        }),
      });
    } catch {
      // Fallback
    } finally {
      setShowInterviewModal(false);
    }
  };

  const manageItems = [
    { label: 'Students', icon: Users, count: '4,280', to: '#' },
    { label: 'Companies', icon: Building2, count: '142', to: '#' },
    { label: 'Jobs', icon: Briefcase, count: jobs.length.toString(), to: '#' },
    { label: 'Applications', icon: FileText, count: '18,650', to: '#' },
    { label: 'Interviews', icon: ActivityIcon, count: '247', to: '#' },
    { label: 'Announcements', icon: Megaphone, count: '12', to: '#' },
  ];

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">
              {isRecruiter ? 'Recruiter Control Center' : 'Admin Analytics'}
            </h1>
            <p className="mt-1 text-soft">
              {isRecruiter ? 'Manage job postings, applicants, and candidate interviews.' : 'Real-time placement intelligence across campus.'}
            </p>
          </div>
          <div className="flex gap-2">
            {isRecruiter ? (
              <GradientButton onClick={() => setShowJobModal(true)} icon={<Plus size={16} />}>Post New Job</GradientButton>
            ) : (
              <>
                <Badge variant="success"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Live</Badge>
                <GradientButton onClick={() => setShowAnnouncementModal(true)} className="py-2.5" icon={<Megaphone size={16} />}>New Announcement</GradientButton>
              </>
            )}
          </div>
        </div>
      </Reveal>

      {/* Recruiter Specific Applicants Section */}
      {isRecruiter && (
        <Reveal delay={0.05}>
          <GlassCard>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold">Active Applicants Pipeline</h3>
                <p className="text-xs text-soft">Review candidates, shortlist, reject, or schedule interviews</p>
              </div>
              <Badge variant="primary">{applicants.length} Applicants</Badge>
            </div>
            <div className="space-y-3">
              {applicants.map((app) => (
                <div key={app.id} className="flex flex-col gap-3 rounded-2xl border border-base bg-soft/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <img src={app.logo} alt={app.company} className="h-10 w-10 rounded-xl object-cover" />
                    <div>
                      <h4 className="font-semibold">{app.role}</h4>
                      <p className="text-xs text-soft">{app.company} • Applied {app.appliedDate}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={app.stage === 'offer' ? 'success' : app.stage === 'technical' ? 'primary' : 'warning'}>
                      {app.stage}
                    </Badge>
                    <button onClick={() => handleStatusUpdate(app.id, 'technical', 'shortlisted')} className="btn-ghost flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-success">
                      <CheckCircle2 size={14} /> Shortlist
                    </button>
                    <button onClick={() => handleStatusUpdate(app.id, 'screening', 'rejected')} className="btn-ghost flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-danger">
                      <XCircle size={14} /> Reject
                    </button>
                    <GradientButton onClick={() => { setSelectedApplicant(app); setShowInterviewModal(true); }} className="py-1 px-3 text-xs">
                      <CalendarDays size={14} /> Schedule Interview
                    </GradientButton>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </Reveal>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Reveal delay={0.05}><KpiWidget label="Total Students" value={statsData.totalStudents} icon={Users} trend="+12%" color="bg-primary/30" /></Reveal>
        <Reveal delay={0.1}><KpiWidget label="Placed Students" value={statsData.placedStudents} icon={Award} trend="+8%" color="bg-success/30" /></Reveal>
        <Reveal delay={0.15}><KpiWidget label="Applications" value={statsData.applications} icon={Briefcase} trend="+24%" color="bg-accent/30" /></Reveal>
        <Reveal delay={0.2}><KpiWidget label="Avg Package (₹L)" value={statsData.avgPackage} suffix="L" decimals={1} icon={TrendingUp} trend="+15%" color="bg-secondary/30" /></Reveal>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Reveal delay={0.1}>
          <GlassCard className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold">Student Growth</h3>
                <p className="text-xs text-soft">Total enrolled students over time</p>
              </div>
              <Badge variant="primary"><TrendingUp size={12} /> +148% YoY</Badge>
            </div>
            <LineChart data={statsData.studentGrowth} height={200} />
            <div className="mt-4 flex justify-between text-xs text-soft">
              {['2021', '2022', '2023', '2024', '2025'].map((y) => <span key={y}>{y}</span>)}
            </div>
          </GlassCard>
        </Reveal>

        <Reveal delay={0.15}>
          <GlassCard className="flex flex-col items-center justify-center">
            <div className="relative" style={{ width: 160, height: 160 }}>
              <svg width="160" height="160" className="-rotate-90">
                <defs>
                  <linearGradient id="admin-gauge" x1="0" y1="0" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
                <circle cx="80" cy="80" r="68" fill="none" stroke="currentColor" strokeWidth="12" className="text-soft/15" />
                <motion.circle cx="80" cy="80" r="68" fill="none" stroke="url(#admin-gauge)" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 68} initial={{ strokeDashoffset: 2 * Math.PI * 68 }}
                  whileInView={{ strokeDashoffset: 2 * Math.PI * 68 - (statsData.placementRate / 100) * 2 * Math.PI * 68 }}
                  viewport={{ once: true }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                  style={{ filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.5))' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-3xl font-bold"><CountUp to={statsData.placementRate} />%</span>
                <span className="text-xs text-soft">Placement Rate</span>
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-soft">{statsData.placedStudents} of {statsData.totalStudents} students placed</p>
          </GlassCard>
        </Reveal>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Reveal delay={0.1}>
          <GlassCard>
            <h3 className="mb-4 font-display text-lg font-semibold">Department Analytics</h3>
            <BarChart data={adminStats.departmentData} />
          </GlassCard>
        </Reveal>

        <Reveal delay={0.15}>
          <GlassCard>
            <h3 className="mb-4 font-display text-lg font-semibold">Top Recruiters</h3>
            <div className="space-y-3">
              {adminStats.topRecruiters.map((r, i) => (
                <motion.div key={r.name} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3 rounded-xl border border-base bg-soft/40 p-3">
                  <img src={r.logo} alt={r.name} className="h-10 w-10 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{r.name}</p>
                    <ProgressBar value={(r.hires / adminStats.topRecruiters[0].hires) * 100} className="mt-1.5 h-1.5" color="primary" />
                  </div>
                  <span className="text-sm font-bold text-primary">{r.hires}</span>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </Reveal>
      </div>

      {/* Heatmap */}
      <Reveal delay={0.1}>
        <GlassCard>
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-primary" />
            <h3 className="font-display text-lg font-semibold">Application Activity Heatmap</h3>
          </div>
          <Heatmap />
        </GlassCard>
      </Reveal>

      {/* Manage Section */}
      <Reveal delay={0.1}>
        <GlassCard>
          <h3 className="mb-4 font-display text-lg font-semibold">Manage</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {manageItems.map((m) => (
              <motion.a key={m.label} href={m.to} whileHover={{ y: -4 }}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-base bg-soft/40 p-4 text-center transition-all hover:border-primary/40 hover:shadow-glow">
                <div className="rounded-xl bg-gradient-to-br from-primary to-secondary p-2.5 text-white shadow-glow"><m.icon size={20} /></div>
                <span className="text-xs font-semibold">{m.label}</span>
                <span className="font-display text-lg font-bold">{m.count}</span>
                <ChevronRight size={14} className="text-soft transition-transform group-hover:translate-x-1" />
              </motion.a>
            ))}
          </div>
        </GlassCard>
      </Reveal>

      {/* Post Job Modal */}
      <AnimatePresence>
        {showJobModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowJobModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl glass-strong p-6 shadow-soft-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">Post New Job</h3>
                <button onClick={() => setShowJobModal(false)} className="text-soft hover:text-[rgb(var(--text))]"><X size={18} /></button>
              </div>
              <div className="mt-4 space-y-3">
                <input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="Role Title (e.g. Frontend Engineer)" className="w-full rounded-xl border border-base bg-soft/50 px-4 py-3 text-sm outline-none focus:border-primary" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={packageVal} onChange={(e) => setPackageVal(e.target.value)} placeholder="Package (e.g. ₹18L)" className="w-full rounded-xl border border-base bg-soft/50 px-3 py-2 text-sm outline-none focus:border-primary" />
                  <input value={locationVal} onChange={(e) => setLocationVal(e.target.value)} placeholder="Location" className="w-full rounded-xl border border-base bg-soft/50 px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
                <select value={jobType} onChange={(e) => setJobType(e.target.value)} className="w-full rounded-xl border border-base bg-soft/50 px-4 py-3 text-sm outline-none focus:border-primary">
                  <option value="Full-time">Full-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                </select>
                <input value={reqsText} onChange={(e) => setReqsText(e.target.value)} placeholder="Required Skills (comma separated)" className="w-full rounded-xl border border-base bg-soft/50 px-4 py-3 text-sm outline-none focus:border-primary" />
                <label className="flex items-center gap-2 text-sm text-soft">
                  <input type="checkbox" checked={isRemote} onChange={(e) => setIsRemote(e.target.checked)} className="rounded border-base accent-primary" /> Remote Position
                </label>
                <GradientButton onClick={handlePostJob} className="w-full py-3">Publish Job</GradientButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Interview Modal */}
      <AnimatePresence>
        {showInterviewModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowInterviewModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl glass-strong p-6 shadow-soft-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">Schedule Candidate Interview</h3>
                <button onClick={() => setShowInterviewModal(false)} className="text-soft hover:text-[rgb(var(--text))]"><X size={18} /></button>
              </div>
              <div className="mt-4 space-y-3">
                <p className="text-xs text-soft">Role: <span className="font-bold text-[rgb(var(--text))]">{selectedApplicant?.role}</span></p>
                <div className="grid grid-cols-2 gap-2">
                  <input value={ivDate} onChange={(e) => setIvDate(e.target.value)} placeholder="Date (e.g. Jul 28)" className="w-full rounded-xl border border-base bg-soft/50 px-3 py-2 text-sm outline-none focus:border-primary" />
                  <input value={ivTime} onChange={(e) => setIvTime(e.target.value)} placeholder="Time (e.g. 10:00 AM)" className="w-full rounded-xl border border-base bg-soft/50 px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
                <input value={ivRound} onChange={(e) => setIvRound(e.target.value)} placeholder="Round Name (e.g. Technical Round 1)" className="w-full rounded-xl border border-base bg-soft/50 px-4 py-3 text-sm outline-none focus:border-primary" />
                <input value={ivLink} onChange={(e) => setIvLink(e.target.value)} placeholder="Meeting Link (Google Meet / Zoom)" className="w-full rounded-xl border border-base bg-soft/50 px-4 py-3 text-sm outline-none focus:border-primary" />
                <GradientButton onClick={handleScheduleInterview} className="w-full py-3">Confirm Schedule</GradientButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Announcement Modal */}
      <AnimatePresence>
        {showAnnouncementModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowAnnouncementModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl glass-strong p-6 shadow-soft-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">New Campus Announcement</h3>
                <button onClick={() => setShowAnnouncementModal(false)} className="text-soft hover:text-[rgb(var(--text))]"><X size={18} /></button>
              </div>
              <div className="mt-4 space-y-3">
                <input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="Announcement Title (e.g. Amazon Placement Drive)" className="w-full rounded-xl border border-base bg-soft/50 px-4 py-3 text-sm outline-none focus:border-primary" />
                <textarea value={annBody} onChange={(e) => setAnnBody(e.target.value)} rows={4} placeholder="Announcement details & eligibility requirements..." className="w-full rounded-xl border border-base bg-soft/50 px-4 py-3 text-sm outline-none focus:border-primary" />
                <GradientButton onClick={handleCreateAnnouncement} className="w-full py-3" icon={<Megaphone size={16} />}>Broadcast Announcement</GradientButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
