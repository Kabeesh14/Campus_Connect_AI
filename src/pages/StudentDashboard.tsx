import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Target, FileText, Brain, ArrowRight, CalendarDays, CheckCircle2,
  Circle, Zap, Sparkles, Flame, Trophy, Bookmark, Briefcase,
  Bell, Lightbulb, TrendingUp,
} from 'lucide-react';
import { GlassCard, ProgressRing, ProgressBar, Reveal, Badge, GradientButton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { jobs, companies, interviews, notifications, activities, skillsProgress } from '../data/mockData';
import { getMediaUrl } from '../utils/api';

function ProfileWidget() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name ?? 'Student',
    avatar: user?.avatar ?? 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
    headline: user?.headline ?? 'Final Year • Computer Science',
    department: user?.department ?? 'Computer Science & Engineering',
    cgpa: user?.cgpa ?? 8.6,
    completion: 78,
  });

  useEffect(() => {
    import('../utils/api').then(({ apiRequest }) => {
      apiRequest('/student/profile').then((res) => {
        if (res.success && res.data?.student) {
          const s = res.data.student;
          setProfile({
            name: s.name,
            avatar: s.avatar,
            headline: s.headline,
            department: s.department,
            cgpa: s.cgpa,
            completion: s.completion || 78,
          });
        }
      }).catch(() => {});
    });
  }, [user]);

  return (
    <GlassCard gradient className="relative overflow-hidden">
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative flex items-center gap-4">
        <div className="relative">
          <img src={getMediaUrl(profile.avatar)} alt={profile.name} className="h-16 w-16 rounded-2xl object-cover ring-2 ring-primary/30" />
          <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-success ring-2 ring-[rgb(var(--card))]" />
        </div>
        <div className="flex-1">
          <h2 className="font-display text-xl font-bold">{profile.name}</h2>
          <p className="text-sm text-soft">{profile.headline}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <Badge variant="primary">{profile.department}</Badge>
            <Badge variant="accent">CGPA {profile.cgpa}</Badge>
          </div>
        </div>
      </div>
      <div className="relative mt-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-soft">Profile completion</span>
          <span className="font-semibold">{profile.completion}%</span>
        </div>
        <ProgressBar value={profile.completion} className="mt-2" />
      </div>
    </GlassCard>
  );
}

function StatRing({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Target; color: string }) {
  return (
    <GlassCard className="flex flex-col items-center text-center">
      <ProgressRing value={value} size={110} label={label} />
      <div className="mt-3 flex items-center gap-1.5 text-sm text-soft">
        <Icon size={15} className={color} /> {label}
      </div>
    </GlassCard>
  );
}

function TodayOpportunities() {
  return (
    <GlassCard className="lg:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold">Today's Opportunities</h3>
          <p className="text-xs text-soft">AI-matched roles for you</p>
        </div>
        <Link to="/jobs" className="text-sm font-semibold text-primary">View all</Link>
      </div>
      <div className="space-y-3">
        {jobs.slice(0, 3).map((j, i) => (
          <motion.div key={j.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
            className="group flex items-center gap-3 rounded-2xl border border-base bg-soft/40 p-3 transition-all hover:border-primary/40 hover:bg-soft">
            <img src={j.logo} alt={j.company} className="h-11 w-11 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{j.role}</p>
              <p className="text-xs text-soft">{j.company} • {j.location}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success">{j.match}% match</Badge>
              <ArrowRight size={16} className="text-soft transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}

function InterviewTimeline() {
  return (
    <GlassCard>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Upcoming Interviews</h3>
        <Link to="/interviews" className="text-sm font-semibold text-primary">All</Link>
      </div>
      <div className="relative space-y-4 before:absolute before:left-[15px] before:top-2 before:h-full before:w-px before:bg-gradient-to-b before:from-primary/50 before:to-transparent">
        {interviews.map((iv, i) => (
          <motion.div key={iv.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="relative flex gap-3">
            <div className="relative z-10 h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-primary to-secondary p-0.5">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[rgb(var(--card))]">
                <CalendarDays size={14} className="text-primary" />
              </div>
            </div>
            <div className="flex-1 rounded-xl border border-base bg-soft/40 p-3">
              <p className="text-sm font-semibold">{iv.company}</p>
              <p className="text-xs text-soft">{iv.round}</p>
              <div className="mt-1.5 flex items-center gap-2 text-xs">
                <Badge variant={iv.daysLeft <= 3 ? 'danger' : 'warning'}>{iv.daysLeft} days left</Badge>
                <span className="text-soft">{iv.date}, {iv.time}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}

function RecommendedCompanies() {
  return (
    <GlassCard className="lg:col-span-3">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold">Recommended Companies</h3>
          <p className="text-xs text-soft">Based on your profile & goals</p>
        </div>
        <Link to="/companies" className="text-sm font-semibold text-primary">Explore</Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
        {companies.map((c) => (
          <Link key={c.id} to={`/companies/${c.id}`} className="group min-w-[200px] shrink-0">
            <motion.div whileHover={{ y: -6 }} className="rounded-2xl border border-base bg-soft/40 p-4 transition-all hover:border-primary/40 hover:shadow-glow">
              <div className="flex items-center justify-between">
                <img src={c.logo} alt={c.name} className="h-12 w-12 rounded-xl object-cover" />
                {c.hiring && <Badge variant="success"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Hiring</Badge>}
              </div>
              <h4 className="mt-3 font-semibold">{c.name}</h4>
              <p className="text-xs text-soft">{c.industry}</p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-soft">{c.openRoles} roles</span>
                <span className="font-semibold text-primary">{c.salary}</span>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </GlassCard>
  );
}

function SkillProgressCard() {
  return (
    <GlassCard>
      <h3 className="mb-4 font-display text-lg font-semibold">Skill Progress</h3>
      <div className="space-y-4">
        {skillsProgress.map((s, i) => (
          <motion.div key={s.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{s.name}</span>
              <span className="text-soft">{s.level}%</span>
            </div>
            <ProgressBar value={s.level} className="mt-1.5 h-1.5" color={s.level >= 75 ? 'success' : s.level >= 50 ? 'primary' : 'warning'} />
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}

function ActivityFeed() {
  const icons: Record<string, typeof Briefcase> = { apply: Briefcase, interview: CalendarDays, score: TrendingUp, save: Bookmark, skill: Zap };
  return (
    <GlassCard className="lg:col-span-2">
      <h3 className="mb-4 font-display text-lg font-semibold">Activity Feed</h3>
      <div className="space-y-3">
        {activities.map((a, i) => {
          const Icon = icons[a.icon];
          return (
            <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="flex gap-3">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-primary/10 p-2 text-primary"><Icon size={16} /></div>
              <div className="flex-1">
                <p className="text-sm"><span className="text-soft">{a.action} </span><span className="font-semibold">{a.detail}</span></p>
                <p className="text-xs text-soft">{a.time}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function DailyGoals() {
  const goals = [
    { label: 'Solve 2 DSA problems', done: true },
    { label: 'Update resume projects', done: true },
    { label: 'Apply to 1 new role', done: false },
    { label: '20 min mock interview', done: false },
  ];
  const done = goals.filter((g) => g.done).length;
  return (
    <GlassCard>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Daily Goals</h3>
        <Badge variant="success">{done}/{goals.length}</Badge>
      </div>
      <div className="space-y-2.5">
        {goals.map((g) => (
          <div key={g.label} className="flex items-center gap-3 rounded-xl border border-base bg-soft/40 p-3">
            {g.done ? <CheckCircle2 size={18} className="text-success" /> : <Circle size={18} className="text-soft" />}
            <span className={g.done ? 'text-sm text-soft line-through' : 'text-sm font-medium'}>{g.label}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function MotivationalInsight() {
  return (
    <GlassCard gradient className="relative overflow-hidden">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-secondary/30 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary"><Lightbulb size={18} /> AI Insight</div>
        <p className="mt-3 font-display text-lg font-semibold leading-snug">
          You're 92% matched for Atlassian Frontend. Focus on accessibility topics to push it to 98%.
        </p>
        <p className="mt-2 text-sm text-soft">Based on 23 applications and your skill trajectory this week.</p>
        <Link to="/ai/career-advisor">
          <GradientButton className="mt-4 py-2.5 text-sm" icon={<Sparkles size={16} />}>Ask AI Advisor</GradientButton>
        </Link>
      </div>
    </GlassCard>
  );
}

function QuickActions() {
  const actions = [
    { label: 'Analyze Resume', icon: FileText, to: '/ai/resume', color: 'from-primary to-secondary' },
    { label: 'Find Jobs', icon: Briefcase, to: '/jobs', color: 'from-secondary to-accent' },
    { label: 'AI Coach', icon: Brain, to: '/ai/interview-coach', color: 'from-accent to-primary' },
    { label: 'Skill Gap', icon: Target, to: '/ai/skill-gap', color: 'from-primary to-accent' },
  ];
  return (
    <GlassCard>
      <h3 className="mb-4 font-display text-lg font-semibold">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((a) => (
          <Link key={a.label} to={a.to}>
            <motion.div whileHover={{ y: -4 }} className="group flex flex-col items-center gap-2 rounded-2xl border border-base bg-soft/40 p-4 text-center transition-all hover:border-primary/40 hover:shadow-glow">
              <div className={`rounded-xl bg-gradient-to-br ${a.color} p-3 text-white shadow-glow`}><a.icon size={20} /></div>
              <span className="text-xs font-semibold">{a.label}</span>
            </motion.div>
          </Link>
        ))}
      </div>
    </GlassCard>
  );
}

function NotificationsPreview() {
  return (
    <GlassCard>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Notifications</h3>
        <Bell size={18} className="text-soft" />
      </div>
      <div className="space-y-2.5">
        {notifications.slice(0, 3).map((n) => (
          <div key={n.id} className={`rounded-xl border border-base p-3 ${!n.read ? 'bg-primary/5' : 'bg-soft/40'}`}>
            <p className="text-sm font-semibold">{n.title}</p>
            <p className="text-xs text-soft">{n.body}</p>
            <p className="mt-1 text-[11px] text-soft/70">{n.time}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-soft">Here's your placement journey at a glance.</p>
        </div>
      </Reveal>

      <Reveal delay={0.05}><ProfileWidget /></Reveal>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Reveal delay={0.1}><StatRing label="Placement" value={78} icon={Target} color="text-primary" /></Reveal>
        <Reveal delay={0.15}><StatRing label="Resume" value={86} icon={FileText} color="text-secondary" /></Reveal>
        <Reveal delay={0.2}><StatRing label="AI Match" value={92} icon={Brain} color="text-accent" /></Reveal>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Reveal delay={0.1}><TodayOpportunities /></Reveal>
        <Reveal delay={0.15}><InterviewTimeline /></Reveal>
        <Reveal delay={0.2}><DailyGoals /></Reveal>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Reveal delay={0.1}><RecommendedCompanies /></Reveal>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Reveal delay={0.1}><SkillProgressCard /></Reveal>
        <Reveal delay={0.15}><ActivityFeed /></Reveal>
        <Reveal delay={0.2}><MotivationalInsight /></Reveal>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Reveal delay={0.1}><QuickActions /></Reveal>
        <Reveal delay={0.15}><NotificationsPreview /></Reveal>
        <Reveal delay={0.2}>
          <GlassCard gradient className="relative overflow-hidden">
            <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-accent/30 blur-3xl" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-primary"><Flame size={18} /> Streak</div>
                <p className="mt-3 font-display text-4xl font-bold">14 days</p>
                <p className="mt-1 text-sm text-soft">Keep applying daily to maintain your streak!</p>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Trophy size={16} className="text-warning" />
                <span className="text-xs text-soft">Top 8% of active students</span>
              </div>
            </div>
          </GlassCard>
        </Reveal>
      </div>
    </div>
  );
}
