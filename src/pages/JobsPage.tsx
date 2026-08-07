import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Search, MapPin, DollarSign, Clock, Bookmark, Zap, ArrowRight, ArrowLeft,
  Brain, CheckCircle2, Briefcase, Building2, Calendar, Star, Loader2, AlertCircle,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { GlassCard, Reveal, Badge, GradientButton, GhostButton, ProgressBar } from '../components/ui';
import { apiRequest, getImageUrl } from '../utils/api';
import { cn } from '../utils/cn';
import type { Job } from '../types';

export function JobsPage() {
  const [jobsList, setJobsList] = useState<Job[]>([]);
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'match' | 'recent'>('match');
  const [showFilters, setShowFilters] = useState(false);
  const [location, setLocation] = useState('all');
  const [minMatch, setMinMatch] = useState(0);
  const [contractType, setContractType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    apiRequest('/jobs/saved')
      .then((res) => {
        if (res.success && Array.isArray(res.savedJobs)) {
          const ids = res.savedJobs.map((j: { id: string }) => String(j.id));
          setSaved(new Set(ids));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.append('search', query);
        if (location !== 'all') params.append('location', location);
        if (minMatch) params.append('minMatch', minMatch.toString());
        if (contractType !== 'all') params.append('contractType', contractType);
        params.append('sortBy', sortBy);

        const res = await apiRequest(`/jobs?${params.toString()}`);
        if (res.success && Array.isArray(res.jobs)) {
          setJobsList(res.jobs);
        } else {
          setJobsList([]);
        }
      } catch {
        setJobsList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [query, location, minMatch, sortBy, contractType]);

  const locations = ['all', ...Array.from(new Set(jobsList.map((j) => j.location).filter(Boolean)))];

  const filtered = useMemo(() => jobsList
    .filter((j) => {
      const q = query.toLowerCase();
      const mq = !q || (j.role || j.title || '').toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || (j.category || '').toLowerCase().includes(q);
      const ml = location === 'all' || j.location === location;
      const mm = (j.match || 75) >= minMatch;
      const mc = contractType === 'all' || (j.contractType || j.type || '').toLowerCase().includes(contractType.toLowerCase());
      return mq && ml && mm && mc;
    })
    .sort((a, b) => sortBy === 'match' ? (b.match || 0) - (a.match || 0) : (a.postedDays || 0) - (b.postedDays || 0)), [jobsList, query, location, minMatch, sortBy, contractType]);

  const itemsPerPage = 8;
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedJobs = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [query, location, minMatch, contractType, sortBy]);

  const toggleSave = async (job: Job) => {
    const isSaved = saved.has(job.id);
    setSaved((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(job.id); else next.add(job.id);
      return next;
    });
    try {
      if (isSaved) {
        await apiRequest(`/jobs/save/${job.id}`, { method: 'DELETE' });
      } else {
        await apiRequest('/jobs/save', { method: 'POST', body: JSON.stringify({ jobId: job.id, job }) });
      }
    } catch {
      // Fail-safe
    }
  };

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Open Positions</h1>
          <p className="mt-1 text-soft">Live Jobs matched to your profile via Adzuna API.</p>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <GlassCard className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-soft" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search live roles, skills (Data Analyst, Python, Java)..."
              className="w-full rounded-xl border border-base bg-soft/40 py-3 pl-12 pr-4 text-sm outline-none focus:border-primary" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowFilters(!showFilters)} className="btn-ghost rounded-xl px-4 py-2.5 text-sm font-semibold">Filters</button>
            <div className="flex gap-1 rounded-xl border border-base bg-soft/40 p-1">
              {(['match', 'recent'] as const).map((s) => (
                <button key={s} onClick={() => setSortBy(s)}
                  className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all',
                    sortBy === s ? 'bg-gradient-to-r from-primary to-secondary text-white' : 'text-soft')}>
                  {s === 'match' ? 'Best Match' : 'Recent'}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>
      </Reveal>

      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <GlassCard className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-soft">Location</label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {locations.slice(0, 6).map((l) => (
                    <button key={l} onClick={() => setLocation(l)}
                      className={cn('rounded-full border px-3 py-1 text-xs font-semibold transition-all',
                        location === l ? 'border-primary bg-primary/10 text-primary' : 'border-base text-soft hover:bg-soft')}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-soft">Job Type</label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {['all', 'full_time', 'part_time', 'internship', 'contract'].map((t) => (
                    <button key={t} onClick={() => setContractType(t)}
                      className={cn('rounded-full border px-3 py-1 text-xs font-semibold capitalize transition-all',
                        contractType === t ? 'border-primary bg-primary/10 text-primary' : 'border-base text-soft hover:bg-soft')}>{t.replace('_', ' ')}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-soft">
                  Min Match Score <span className="text-primary">{minMatch}%</span>
                </label>
                <input type="range" min="0" max="100" value={minMatch} onChange={(e) => setMinMatch(Number(e.target.value))}
                  className="mt-3 w-full accent-primary" />
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="mt-3 text-sm text-soft">Fetching live Adzuna jobs...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <AlertCircle size={40} className="mx-auto text-soft" />
          <h3 className="mt-3 font-display text-xl font-bold">No jobs found</h3>
          <p className="mt-1 text-sm text-soft">Try adjusting your search criteria or resetting filters.</p>
          <button onClick={() => { setQuery(''); setLocation('all'); setMinMatch(0); setContractType('all'); }}
            className="mt-4 rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20">
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {paginatedJobs.map((j, i) => (
              <Reveal key={j.id} delay={i * 0.04}>
                <GlassCard hover className="group h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-start gap-4">
                      <img
                        src={getImageUrl(j.logo)}
                        alt={j.company}
                        onError={(e) => {
                          const initials = (j.company || 'CO').split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                          e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%236366F1"/><text x="50" y="55" font-family="sans-serif" font-size="36" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`;
                        }}
                        className="h-12 w-12 rounded-2xl object-cover ring-2 ring-primary/15"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display text-lg font-semibold">{j.role || j.title}</h3>
                        <p className="text-sm text-soft">{j.company} • {j.location}</p>
                      </div>
                      <button onClick={() => toggleSave(j)} className="rounded-lg p-2 text-soft transition-colors hover:bg-soft">
                        <Bookmark size={18} className={saved.has(j.id) ? 'fill-primary text-primary' : ''} />
                      </button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="success"><Brain size={12} /> {j.match || 80}% match</Badge>
                      <Badge variant="primary">{j.type || 'Full Time'}</Badge>
                      {j.remote && <Badge variant="accent">Remote</Badge>}
                      {j.category && <Badge variant="neutral">{j.category}</Badge>}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl border border-base bg-soft/40 p-3">
                        <p className="text-xs text-soft">Salary</p><p className="font-semibold">{j.package || j.salary || 'Salary Not Disclosed'}</p>
                      </div>
                      <div className="rounded-xl border border-base bg-soft/40 p-3">
                        <p className="text-xs text-soft">Posted</p><p className="font-semibold">{j.postedDays ? `${j.postedDays}d ago` : 'Recently'}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(j.skills || []).slice(0, 5).map((s) => (
                        <span key={s} className="rounded-lg bg-soft px-2.5 py-1 text-xs font-medium text-soft">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-base pt-4">
                    <span className="text-xs text-soft">Adzuna Verified</span>
                    <div className="flex gap-2">
                      {j.redirectUrl && (
                        <a
                          href={j.redirectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold rounded-lg bg-primary/10 px-3 py-1.5 text-primary hover:bg-primary/20"
                        >
                          Apply <Zap size={12} />
                        </a>
                      )}
                      <Link to={`/jobs/${j.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                        Details <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </GlassCard>
              </Reveal>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 rounded-xl border border-base bg-soft/40 px-3.5 py-2 text-sm font-semibold text-soft disabled:opacity-40 hover:bg-soft"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="text-sm font-semibold text-soft">
                Page <span className="text-primary">{page}</span> of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 rounded-xl border border-base bg-soft/40 px-3.5 py-2 text-sm font-semibold text-soft disabled:opacity-40 hover:bg-soft"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [relatedJobs, setRelatedJobs] = useState<Job[]>([]);
  const [bookmarked, setBookmarked] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setFetchError(null);
    apiRequest(`/jobs/${id}`)
      .then((res) => {
        if (res.success && res.job) {
          setJob(res.job);
        } else {
          setJob(null);
          setFetchError(res.message || 'Job not found');
        }
      })
      .catch((err: unknown) => {
        setJob(null);
        setFetchError((err as Error).message || 'Job not found');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!job) return;
    const fetchRelated = async () => {
      try {
        const queryTerm = job.category || job.company || 'developer';
        const res = await apiRequest(`/jobs?search=${encodeURIComponent(queryTerm)}`);
        if (res.success && res.jobs) {
          const filtered = res.jobs.filter((rj: Job) => String(rj.id) !== String(job.id)).slice(0, 3);
          setRelatedJobs(filtered);
        }
      } catch {
        // Fail-safe
      }
    };
    fetchRelated();
  }, [job]);

  const handleApply = async () => {
    if (!id || applied || applying) return;
    if (job?.redirectUrl) {
      window.open(job.redirectUrl, '_blank', 'noopener,noreferrer');
    }
    setApplying(true);
    setErrorMsg(null);
    try {
      const res = await apiRequest(`/jobs/${id}/apply`, { method: 'POST' });
      if (res.success) {
        setApplied(true);
      } else {
        setErrorMsg(res.message || 'Failed to submit application.');
      }
    } catch (err: unknown) {
      if ((err as Error).message?.toLowerCase().includes('already applied')) {
        setApplied(true);
      } else {
        setErrorMsg((err as Error).message || 'An error occurred while submitting your application.');
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 size={36} className="animate-spin text-primary" />
        <p className="mt-3 text-sm text-soft">Loading job details...</p>
      </div>
    );
  }

  if (!job || fetchError) {
    return (
      <div className="py-20 text-center">
        <h2 className="font-display text-2xl font-bold">Job not found</h2>
        <p className="mt-2 text-sm text-soft">The job position you are looking for does not exist or has expired.</p>
        <Link to="/jobs" className="mt-4 inline-block font-semibold text-primary">Back to jobs</Link>
      </div>
    );
  }

  const requirementsList = Array.isArray(job.requirements) && job.requirements.length > 0 ? job.requirements : [
    `Proficiency in ${(job.skills || []).slice(0, 2).join(' and ') || 'relevant tech stack'}`,
    'Strong analytical and problem-solving skills',
    'Experience working with modern web or cloud APIs',
    'Good verbal and written communication skills',
  ];

  const responsibilitiesList = Array.isArray(job.responsibilities) && job.responsibilities.length > 0 ? job.responsibilities : [
    'Design, implement, and maintain core software features',
    'Collaborate closely with product managers and engineering teammates',
    'Perform code reviews, testing, and continuous deployment',
  ];

  return (
    <div className="space-y-6">
      <Reveal>
        <button onClick={() => navigate('/jobs')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-soft transition-colors hover:text-primary">
          <ArrowLeft size={16} /> Back to jobs
        </button>
      </Reveal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Reveal delay={0.05}>
            <GlassCard gradient className="relative overflow-hidden">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
              <div className="relative flex items-start gap-4">
                <img
                  src={getImageUrl(job.logo)}
                  alt={job.company}
                  onError={(e) => {
                    const initials = (job.company || 'CO').split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                    e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%236366F1"/><text x="50" y="55" font-family="sans-serif" font-size="36" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`;
                  }}
                  className="h-16 w-16 rounded-2xl object-cover ring-2 ring-primary/20"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="success"><Brain size={12} /> {job.match || 88}% AI Match</Badge>
                    <Badge variant="primary">{job.type || job.contractType || 'Full Time'}</Badge>
                    {job.remote && <Badge variant="accent">Remote</Badge>}
                    {job.category && <Badge variant="neutral">{job.category}</Badge>}
                  </div>
                  <h1 className="mt-3 font-display text-2xl font-bold">{job.role || job.title}</h1>
                  <p className="text-sm font-semibold text-primary">{job.company}</p>
                </div>
                <button onClick={() => setBookmarked(!bookmarked)} className="rounded-xl border border-base bg-soft/40 p-3 transition-all hover:bg-soft">
                  <Bookmark size={20} className={bookmarked ? 'fill-primary text-primary' : 'text-soft'} />
                </button>
              </div>
              <p className="relative mt-4 text-sm leading-relaxed text-soft">{job.description}</p>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.1}>
            <GlassCard>
              <h3 className="font-display text-lg font-semibold">Requirements</h3>
              <div className="mt-4 space-y-2.5">
                {requirementsList.map((r, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary" /><span className="text-sm">{r}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.15}>
            <GlassCard>
              <h3 className="font-display text-lg font-semibold">Responsibilities</h3>
              <div className="mt-4 space-y-2.5">
                {responsibilitiesList.map((r, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-primary to-secondary" /><span className="text-sm">{r}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.2}>
            <GlassCard>
              <h3 className="font-display text-lg font-semibold">Required Skills</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {(job.skills || []).map((s) => (
                  <span key={s} className="rounded-xl border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-sm font-semibold text-primary">{s}</span>
                ))}
              </div>
            </GlassCard>
          </Reveal>

          {relatedJobs.length > 0 && (
            <Reveal delay={0.25}>
              <GlassCard>
                <h3 className="font-display text-lg font-semibold">Related Live Jobs</h3>
                <div className="mt-4 space-y-3">
                  {relatedJobs.map((rj) => (
                    <Link key={rj.id} to={`/jobs/${rj.id}`} className="block">
                      <div className="group flex items-center justify-between rounded-xl border border-base bg-soft/40 p-3 transition-all hover:border-primary/40 hover:bg-soft">
                        <div className="flex items-center gap-3">
                          <img
                            src={getImageUrl(rj.logo)}
                            alt={rj.company}
                            onError={(e) => {
                              const initials = (rj.company || 'CO').split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                              e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%236366F1"/><text x="50" y="55" font-family="sans-serif" font-size="36" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`;
                            }}
                            className="h-10 w-10 rounded-xl object-cover"
                          />
                          <div>
                            <p className="font-semibold text-sm">{rj.role || rj.title}</p>
                            <p className="text-xs text-soft">{rj.company} • {rj.location}</p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform">Details →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </GlassCard>
            </Reveal>
          )}
        </div>

        <div className="space-y-6">
          <Reveal delay={0.1}>
            <GlassCard className="sticky top-24">
              <h3 className="font-display text-lg font-semibold">Job Overview</h3>
              <div className="mt-4 space-y-3">
                {[
                  { icon: DollarSign, label: 'Package', value: job.package || job.salary || 'Competitive Salary' },
                  { icon: MapPin, label: 'Location', value: job.location },
                  { icon: Briefcase, label: 'Type', value: job.type || job.contractType || 'Full Time' },
                  { icon: Building2, label: 'Eligibility', value: job.eligibility || 'Degree in CS / Engineering' },
                  { icon: Calendar, label: 'Deadline', value: job.deadline || 'Apply Soon' },
                  { icon: Clock, label: 'Posted', value: job.postedDays ? `${job.postedDays} days ago` : 'Recently' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between border-b border-base pb-3">
                    <span className="flex items-center gap-2 text-sm text-soft"><row.icon size={16} /> {row.label}</span>
                    <span className="text-sm font-semibold">{row.value}</span>
                  </div>
                ))}
              </div>

              {errorMsg && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-danger/10 p-3 text-xs font-semibold text-danger">
                  <AlertCircle size={16} /> {errorMsg}
                </div>
              )}

              <div className="mt-5 space-y-3">
                <GradientButton onClick={handleApply} disabled={applied || applying} className="w-full py-3.5" icon={applying ? <Loader2 size={18} className="animate-spin" /> : applied ? <CheckCircle2 size={18} /> : <Zap size={18} />}>
                  {applying ? 'Submitting...' : applied ? 'Application Sent!' : 'Apply Now'}
                </GradientButton>
                <GhostButton onClick={() => setBookmarked(!bookmarked)} className="w-full py-3.5" icon={<Bookmark size={18} className={bookmarked ? 'fill-primary text-primary' : ''} />}>
                  {bookmarked ? 'Saved' : 'Save for later'}
                </GhostButton>
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.15}>
            <GlassCard gradient className="relative overflow-hidden">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-accent/30 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary"><Brain size={18} /> AI Match Analysis</div>
                <div className="mt-4 flex items-center gap-4">
                  <div className="font-display text-4xl font-bold gradient-text">{job.match || 88}%</div>
                  <div className="flex-1">
                    <ProgressBar value={job.match || 88} color={(job.match || 88) >= 85 ? 'success' : 'primary'} />
                    <p className="mt-2 text-xs text-soft">{(job.match || 88) >= 85 ? 'Excellent match — high success probability' : 'Good match — consider applying'}</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
