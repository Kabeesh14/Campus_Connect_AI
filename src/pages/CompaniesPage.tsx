import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Search, MapPin, DollarSign, Users, Clock, Star, Heart, Share2,
  CheckCircle2, Building2, ArrowRight, ArrowLeft, Zap, Award, Loader2,
} from 'lucide-react';
import { GlassCard, Reveal, Badge, GradientButton, GhostButton } from '../components/ui';
import { apiRequest, getImageUrl } from '../utils/api';
import { cn } from '../utils/cn';
import type { Company } from '../types';

export function CompaniesPage() {
  const [companiesList, setCompaniesList] = useState<Company[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'hiring' | 'saved'>('all');
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [industry, setIndustry] = useState('all');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await apiRequest('/companies');
        if (res.success && Array.isArray(res.companies)) {
          setCompaniesList(res.companies);
        } else {
          setCompaniesList([]);
          if (res.message) setErrorMsg(res.message);
        }
      } catch (err: unknown) {
        setCompaniesList([]);
        setErrorMsg((err as Error).message || 'Failed to fetch companies.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const industries = ['all', ...Array.from(new Set(companiesList.map((c) => c.industry).filter(Boolean)))];

  const filtered = useMemo(() => companiesList.filter((c) => {
    const mq = c.name.toLowerCase().includes(query.toLowerCase()) || c.industry.toLowerCase().includes(query.toLowerCase());
    const mi = industry === 'all' || c.industry === industry;
    const mf = filter === 'all' || (filter === 'hiring' && c.hiring) || (filter === 'saved' && saved.has(c.id));
    return mq && mi && mf;
  }), [companiesList, query, filter, industry, saved]);

  const toggleSave = (id: string) => setSaved((prev) => {
    const n = new Set(prev);
    if (n.has(id)) { n.delete(id); } else { n.add(id); }
    return n;
  });

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Company Explorer</h1>
          <p className="mt-1 text-soft">Discover hiring companies generated dynamically from live Adzuna jobs.</p>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <GlassCard className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-soft" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search live companies..."
              className="w-full rounded-xl border border-base bg-soft/40 py-3 pl-12 pr-4 text-sm outline-none focus:border-primary" />
          </div>
          <div className="flex gap-2">
            {(['all', 'hiring', 'saved'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn('rounded-xl px-4 py-2.5 text-sm font-semibold capitalize transition-all', filter === f ? 'btn-primary' : 'btn-ghost')}>{f}</button>
            ))}
          </div>
        </GlassCard>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="flex flex-wrap gap-2">
          {industries.map((ind) => (
            <button key={ind} onClick={() => setIndustry(ind)}
              className={cn('rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition-all',
                industry === ind ? 'border-primary bg-primary/10 text-primary' : 'border-base text-soft hover:bg-soft')}>{ind}</button>
          ))}
        </div>
      </Reveal>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="animate-spin text-primary" />
          <span className="mt-3 text-sm text-soft">Loading live hiring companies from Adzuna...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c, i) => (
            <Reveal key={c.id} delay={i * 0.05}>
              <GlassCard hover className="group h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <img
                      src={getImageUrl(c.logo)}
                      alt={c.name}
                      onError={(e) => {
                        const initials = (c.name || 'CO').split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                        e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%236366F1"/><text x="50" y="55" font-family="sans-serif" font-size="36" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`;
                      }}
                      className="h-14 w-14 rounded-2xl object-cover ring-2 ring-primary/15"
                    />
                    <button onClick={() => toggleSave(c.id)} className="rounded-lg p-2 text-soft transition-colors hover:bg-soft">
                      <Heart size={18} className={saved.has(c.id) ? 'fill-danger text-danger' : ''} />
                    </button>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold">{c.name}</h3>
                  <div className="mt-1 flex items-center gap-2 text-sm text-soft"><Building2 size={14} /> {c.industry}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {c.hiring && <Badge variant="success"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Hiring</Badge>}
                    <Badge variant="accent">{c.openRoles} open role{c.openRoles > 1 ? 's' : ''}</Badge>
                    <Badge variant="warning"><Clock size={12} /> {c.deadlineDays || 14}d left</Badge>
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-soft"><DollarSign size={15} /> Package</span>
                      <span className="font-semibold">{c.salary}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-soft"><MapPin size={15} /> Location</span>
                      <span className="font-semibold">{c.location}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-base pt-4">
                  <div className="flex items-center gap-1">
                    <Star size={15} className="fill-warning text-warning" />
                    <span className="text-sm font-semibold">{c.rating || 4.5}</span>
                  </div>
                  <Link to={`/companies/${c.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Details <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <div className="py-20 text-center">
          <Building2 size={48} className="mx-auto text-soft/40" />
          <p className="mt-4 text-soft font-semibold">{errorMsg || 'No companies match your filters.'}</p>
        </div>
      )}
    </div>
  );
}

export function CompanyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'culture' | 'process' | 'gallery'>('overview');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const fetchCompany = async () => {
      try {
        const res = await apiRequest('/companies');
        if (res.success && Array.isArray(res.companies)) {
          const found = res.companies.find((c: Company) => c.id === id || c.name.toLowerCase() === id.toLowerCase());
          if (found) setCompany(found);
        }
      } catch {
        setCompany(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 size={36} className="animate-spin text-primary" />
        <p className="mt-3 text-sm text-soft">Loading company profile...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="py-20 text-center">
        <h2 className="font-display text-2xl font-bold">Company not found</h2>
        <p className="mt-2 text-sm text-soft">The company you are looking for has no active roles or is unavailable.</p>
        <Link to="/companies" className="mt-4 inline-block font-semibold text-primary">Back to companies</Link>
      </div>
    );
  }

  const defaultCover = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80';
  const defaultCulture = company.culture || ['Innovation & Fast Paced', 'Hybrid Work Culture', 'Continuous Learning Stipend'];
  const defaultBenefits = company.benefits || ['Health Insurance', 'Stock Options / RSUs', 'Annual Learning Allowance'];
  const defaultProcess = company.process || [
    { step: 'Online Assessment', detail: 'Coding & Aptitude Test' },
    { step: 'Technical Round 1', detail: 'Data Structures & Algorithms' },
    { step: 'System Design', detail: 'Architecture & Design Patterns' },
    { step: 'HR Interview', detail: 'Culture & Behavioral Fit' },
  ];
  const defaultStats = company.stats || [
    { label: 'Open Positions', value: `${company.openRoles || 1}+` },
    { label: 'Avg Package', value: company.salary || 'Salary Not Disclosed' },
    { label: 'Location', value: company.location },
    { label: 'Deadline', value: `${company.deadlineDays || 14}d` },
  ];
  const defaultGallery = company.gallery || [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
  ];

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'culture' as const, label: 'Culture & Benefits' },
    { id: 'process' as const, label: 'Selection Process' },
    { id: 'gallery' as const, label: 'Gallery' },
  ];

  return (
    <div className="space-y-6">
      <Reveal>
        <button onClick={() => navigate('/companies')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-soft transition-colors hover:text-primary">
          <ArrowLeft size={16} /> Back to companies
        </button>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="gradient-border overflow-hidden rounded-3xl">
          <div className="relative h-48 overflow-hidden sm:h-64">
            <img src={company.cover || defaultCover} alt={company.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--card))] via-[rgb(var(--card))]/40 to-transparent" />
          </div>
          <div className="px-6 pb-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <img
                  src={getImageUrl(company.logo)}
                  alt={company.name}
                  onError={(e) => {
                    const initials = (company.name || 'CO').split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                    e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%236366F1"/><text x="50" y="55" font-family="sans-serif" font-size="36" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`;
                  }}
                  className="h-20 w-20 rounded-2xl object-cover ring-4 ring-[rgb(var(--card))] sm:-mt-10"
                />
                <div>
                  <h1 className="font-display text-2xl font-bold">{company.name}</h1>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-soft">
                    <span className="flex items-center gap-1"><Building2 size={14} /> {company.industry}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><MapPin size={14} /> {company.location}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <GhostButton icon={<Share2 size={16} />} className="px-4 py-2.5">Share</GhostButton>
                <Link to="/jobs">
                  <GradientButton icon={<Zap size={16} />} className="px-5 py-2.5">View Live Roles</GradientButton>
                </Link>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {company.hiring && <Badge variant="success"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Actively Hiring</Badge>}
              <Badge variant="primary"><Star size={12} className="fill-warning text-warning" /> {company.rating || 4.5} rating</Badge>
              <Badge variant="accent">{company.openRoles || 1} open role{company.openRoles > 1 ? 's' : ''}</Badge>
              <Badge variant="warning"><Clock size={12} /> {company.deadlineDays || 14} days to deadline</Badge>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {defaultStats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.06}>
            <GlassCard className="text-center">
              <p className="font-display text-2xl font-bold gradient-text">{s.value}</p>
              <p className="mt-1 text-xs text-soft">{s.label}</p>
            </GlassCard>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <div className="flex gap-1 overflow-x-auto rounded-2xl border border-base bg-soft/40 p-1 hide-scrollbar">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('relative whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors', tab === t.id ? 'text-white' : 'text-soft hover:text-[rgb(var(--text))]')}>
              {tab === t.id && <motion.div layoutId="company-tab" className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-secondary" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
              <span className="relative z-10">{t.label}</span>
            </button>
          ))}
        </div>
      </Reveal>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
          {tab === 'overview' && (
            <GlassCard>
              <h3 className="font-display text-lg font-semibold">About {company.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-soft">
                {company.name} is hiring for {company.openRoles || 1} live position(s) on Adzuna. Average salary package is {company.salary || 'disclosed upon application'} located in {company.location}.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-base bg-soft/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-soft">Eligibility</p>
                  <p className="mt-1 font-semibold">{company.eligibility || 'Degree in CS / Engineering'}</p>
                </div>
                <div className="rounded-2xl border border-base bg-soft/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-soft">Package Range</p>
                  <p className="mt-1 font-semibold">{company.salary || 'Salary Not Disclosed'}</p>
                </div>
              </div>
            </GlassCard>
          )}
          {tab === 'culture' && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <GlassCard>
                <h3 className="font-display text-lg font-semibold">Culture</h3>
                <div className="mt-4 space-y-3">
                  {defaultCulture.map((c) => (
                    <div key={c} className="flex items-center gap-3 rounded-xl border border-base bg-soft/40 p-3">
                      <CheckCircle2 size={18} className="text-success" /><span className="text-sm font-medium">{c}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
              <GlassCard>
                <h3 className="font-display text-lg font-semibold">Benefits</h3>
                <div className="mt-4 space-y-3">
                  {defaultBenefits.map((b) => (
                    <div key={b} className="flex items-center gap-3 rounded-xl border border-base bg-soft/40 p-3">
                      <Award size={18} className="text-primary" /><span className="text-sm font-medium">{b}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}
          {tab === 'process' && (
            <GlassCard>
              <h3 className="font-display text-lg font-semibold">Selection Process</h3>
              <div className="relative mt-6 space-y-4 before:absolute before:left-[19px] before:top-2 before:h-[calc(100%-2rem)] before:w-px before:bg-gradient-to-b before:from-primary before:to-accent">
                {defaultProcess.map((p, i) => (
                  <div key={p.step} className="relative flex gap-4">
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white shadow-glow">{i + 1}</div>
                    <div className="flex-1 rounded-2xl border border-base bg-soft/40 p-4">
                      <p className="font-semibold">{p.step}</p>
                      <p className="mt-0.5 text-sm text-soft">{p.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
          {tab === 'gallery' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {defaultGallery.map((g, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                  className="overflow-hidden rounded-2xl border border-base">
                  <img src={g} alt={`Gallery ${i + 1}`} className="h-48 w-full object-cover transition-transform duration-500 hover:scale-110" />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
