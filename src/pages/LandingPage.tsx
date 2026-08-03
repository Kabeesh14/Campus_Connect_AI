import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Sparkles, Play, Search, FileText, Target, MessageSquare,
  TrendingUp, Building2, Calendar, Shield, Zap, Brain, BarChart3,
  Users, Star, ChevronDown, Github, Twitter, Linkedin, Mail, MapPin,
  CheckCircle2, Quote, Menu, X, Rocket, Moon, Sun,
} from 'lucide-react';
import {
  AuroraBackground, Reveal, CountUp, SectionHeading, GlassCard,
  GradientButton, GhostButton, Badge, TiltCard,
} from '../components/ui';
import { Logo } from '../components/Logo';
import { useTheme } from '../hooks/useTheme';
import { testimonials, faqs, trustedCompanies } from '../data/mockData';

const stats = [
  { value: 4280, suffix: '+', label: 'Students Placed', icon: Users },
  { value: 142, suffix: '+', label: 'Hiring Companies', icon: Building2 },
  { value: 73, suffix: '%', label: 'Placement Rate', icon: TrendingUp },
  { value: 12.4, suffix: 'L', label: 'Avg Package (₹)', icon: Target, decimals: 1 },
];

const features = [
  { icon: Brain, title: 'AI Career Advisor', desc: 'Get a personalized roadmap with weekly milestones tailored to your dream role.', color: 'from-primary to-secondary' },
  { icon: FileText, title: 'Resume ATS Analyzer', desc: 'Score your resume against real ATS parsers and fix gaps in seconds.', color: 'from-secondary to-accent' },
  { icon: MessageSquare, title: 'AI Interview Coach', desc: 'Practice with a conversational AI that simulates real interview rounds.', color: 'from-accent to-primary' },
  { icon: Target, title: 'Skill Gap Analysis', desc: 'Know exactly what to learn next based on the roles you want.', color: 'from-primary to-accent' },
  { icon: BarChart3, title: 'Placement Prediction', desc: 'AI forecasts your placement probability and suggests improvements.', color: 'from-secondary to-primary' },
  { icon: Zap, title: 'Smart Job Matching', desc: 'AI ranks roles by your match score so you apply where you win.', color: 'from-accent to-secondary' },
];

const timeline = [
  { step: '01', title: 'Create Your Profile', desc: 'Add skills, projects, CGPA and goals. Our AI builds your placement fingerprint in seconds.', icon: Users },
  { step: '02', title: 'AI Analyzes You', desc: 'Resume scoring, skill gaps, and a personalized career roadmap — generated instantly.', icon: Brain },
  { step: '03', title: 'Get Matched', desc: 'AI surfaces roles and companies where you have the highest probability of success.', icon: Target },
  { step: '04', title: 'Track & Interview', desc: 'Follow every application on an animated roadmap and prep with the AI interview coach.', icon: Calendar },
  { step: '05', title: 'Get Placed', desc: 'Receive offers, compare packages, and land your dream placement — faster.', icon: Rocket },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const links = [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#timeline' },
    { label: 'AI Tools', href: '#ai-showcase' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'FAQ', href: '#faq' },
  ];
  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 px-4 transition-all duration-300 ${scrolled ? 'py-2' : 'py-4'}`}
    >
      <div className={`mx-auto flex max-w-7xl items-center justify-between gap-4 px-2 transition-all duration-300 ${scrolled ? 'glass-strong rounded-2xl py-2 shadow-soft' : ''}`}>
        <Logo />
        <div className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-soft transition-colors hover:bg-soft hover:text-[rgb(var(--text))]">
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="rounded-lg p-2 text-soft transition-colors hover:bg-soft hover:text-[rgb(var(--text))]">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link to="/login" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-soft transition-colors hover:text-[rgb(var(--text))] sm:block">
            Sign in
          </Link>
          <Link to="/signup">
            <GradientButton className="hidden px-4 py-2 sm:inline-flex">Get Started</GradientButton>
          </Link>
          <button onClick={() => setOpen(!open)} className="rounded-lg p-2 text-soft lg:hidden">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mx-auto mt-2 max-w-7xl overflow-hidden rounded-2xl glass-strong p-4 lg:hidden">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm font-medium text-soft hover:bg-soft hover:text-[rgb(var(--text))]">
                {l.label}
              </a>
            ))}
            <Link to="/login" className="mt-2 block rounded-lg px-3 py-3 text-sm font-semibold text-primary">Sign in</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const onMouse = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setMouse({ x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 });
  };
  return (
    <section ref={ref} onMouseMove={onMouse} className="relative flex min-h-screen items-center overflow-hidden pt-28 pb-16">
      <AuroraBackground />
      <motion.div style={{ x: mouse.x * 40, y: mouse.y * 30 }} className="absolute left-[10%] top-[20%] h-3 w-3 rounded-full bg-primary shadow-glow animate-float-slow" />
      <motion.div style={{ x: mouse.x * -60, y: mouse.y * 40 }} className="absolute right-[15%] top-[30%] h-4 w-4 rounded-full bg-accent shadow-glow animate-float-slow" />
      <motion.div style={{ x: mouse.x * 50, y: mouse.y * -30 }} className="absolute left-[40%] top-[60%] h-2.5 w-2.5 rounded-full bg-secondary shadow-glow animate-float-slow" />

      <motion.div style={{ y, opacity }} className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <Badge variant="primary" className="mb-6 px-4 py-2 text-sm">
              <Sparkles size={14} /> AI-Powered Placement Platform
            </Badge>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
              Land Your Dream <span className="gradient-text glow-text">Placement</span> with AI
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-6 max-w-2xl text-base text-soft sm:text-xl">
              One intelligent platform that helps students get placed faster through AI-powered guidance, smart analytics, and recruiter connections.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/signup"><GradientButton icon={<ArrowRight size={18} />} className="px-7 py-3.5 text-base">Get Started</GradientButton></Link>
              <Link to="/companies"><GhostButton icon={<Search size={18} />} className="px-7 py-3.5 text-base">Explore Opportunities</GhostButton></Link>
              <GhostButton icon={<Play size={18} />} className="px-7 py-3.5 text-base">Watch Demo</GhostButton>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-soft">
              <Shield size={16} className="text-success" /> Free for students • No credit card required
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.3}>
          <TiltCard className="mx-auto mt-16 max-w-5xl">
            <div className="gradient-border overflow-hidden rounded-3xl shadow-soft-lg">
              <div className="flex items-center gap-2 border-b border-base px-5 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-danger/70" />
                  <div className="h-3 w-3 rounded-full bg-warning/70" />
                  <div className="h-3 w-3 rounded-full bg-success/70" />
                </div>
                <span className="ml-2 text-xs text-soft">campusconnect.ai/dashboard</span>
              </div>
              <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
                {[
                  { label: 'Placement Progress', value: 78, icon: Target },
                  { label: 'ATS Score', value: 86, icon: FileText },
                  { label: 'AI Match', value: 92, icon: Brain },
                ].map((c) => (
                  <div key={c.label} className="rounded-2xl border border-base bg-soft/50 p-5">
                    <c.icon className="mb-3 text-primary" size={22} />
                    <div className="font-display text-3xl font-bold"><CountUp to={c.value} />%</div>
                    <div className="mt-1 text-xs text-soft">{c.label}</div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-soft">
                      <motion.div initial={{ width: 0 }} whileInView={{ width: `${c.value}%` }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.4 }} className="h-full rounded-full bg-gradient-to-r from-primary to-accent" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TiltCard>
        </Reveal>
      </motion.div>

      <motion.div style={{ opacity }} className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <ChevronDown className="text-soft" size={24} />
        </motion.div>
      </motion.div>
    </section>
  );
}

function StatsSection() {
  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <GlassCard hover className="text-center">
                <s.icon className="mx-auto mb-4 text-primary" size={28} />
                <div className="font-display text-3xl font-bold sm:text-4xl">
                  <CountUp to={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
                </div>
                <div className="mt-2 text-sm text-soft">{s.label}</div>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustedCompanies() {
  return (
    <section className="relative py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-center text-sm font-medium uppercase tracking-wider text-soft">
            Trusted by students placed at world-class companies
          </p>
        </Reveal>
        <div className="relative mt-8 overflow-hidden">
          <div className="flex w-max gap-12 animate-marquee">
            {[...trustedCompanies, ...trustedCompanies].map((c, i) => (
              <span key={i} className="font-display text-xl font-bold text-soft/60 whitespace-nowrap transition-colors hover:text-[rgb(var(--text))]">
                {c}
              </span>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[rgb(var(--bg))] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[rgb(var(--bg))] to-transparent" />
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading center eyebrow="Features"
          title={<>Everything you need to <span className="gradient-text">get placed</span></>}
          subtitle="Seven AI-powered tools working together to take you from student to placed — faster than ever." />
        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.06}>
              <GlassCard hover className="group h-full">
                <div className={`mb-5 inline-flex rounded-2xl bg-gradient-to-br ${f.color} p-3 text-white shadow-glow`}>
                  <f.icon size={24} />
                </div>
                <h3 className="font-display text-xl font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-soft">{f.desc}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Learn more <ArrowRight size={14} />
                </div>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function TimelineSection() {
  return (
    <section id="timeline" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="How it works"
          title={<>From profile to <span className="gradient-text">placement</span> in 5 steps</>}
          subtitle="A guided journey powered by AI at every stage." />
        <div className="relative mt-16">
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-primary/50 via-secondary/50 to-accent/50 md:block" />
          <div className="space-y-8 md:space-y-0">
            {timeline.map((t, i) => (
              <Reveal key={t.step} delay={i * 0.08}>
                <div className={`relative flex flex-col gap-6 md:flex-row md:items-center ${i % 2 ? 'md:flex-row-reverse' : ''}`}>
                  <div className="flex-1 md:px-8">
                    <GlassCard className={`h-full ${i % 2 ? 'md:text-right' : ''}`}>
                      <div className={`flex items-center gap-3 ${i % 2 ? 'md:flex-row-reverse' : ''}`}>
                        <span className="font-display text-2xl font-bold gradient-text">{t.step}</span>
                        <t.icon className="text-primary" size={22} />
                      </div>
                      <h3 className="mt-3 font-display text-xl font-semibold">{t.title}</h3>
                      <p className="mt-2 text-sm text-soft">{t.desc}</p>
                    </GlassCard>
                  </div>
                  <div className="relative hidden h-4 w-4 shrink-0 md:block">
                    <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-primary to-secondary shadow-glow" />
                    <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/40 animate-pulse-ring" />
                  </div>
                  <div className="hidden flex-1 md:block" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AIShowcase() {
  const [active, setActive] = useState(0);
  const tools = [
    { name: 'AI Career Advisor', icon: Brain, desc: 'Personalized roadmap with weekly milestones and resource recommendations.', sample: 'Your 6-month plan to crack Google SWE: Weeks 1-4 DSA intensive, Weeks 5-8 system design, Weeks 9-12 mock interviews...' },
    { name: 'AI Resume Analyzer', icon: FileText, desc: 'ATS scoring, keyword gaps, and instant improvement tips.', sample: 'ATS Score: 86% • Missing: Kubernetes, CI/CD • Strong: React, TypeScript • Add 2 quantified achievements in experience.' },
    { name: 'AI Interview Coach', icon: MessageSquare, desc: 'Conversational practice across technical, system design, and behavioral rounds.', sample: "Coach: \"Walk me through how you'd design a URL shortener. Start with clarifying questions.\" You: \"What's the expected read/write ratio?\"" },
    { name: 'Skill Gap Analysis', icon: Target, desc: 'Know exactly what to learn for your target roles.', sample: 'For Stripe Backend: You\'re 78% ready. Close the gap: Distributed Systems (+15%), Go (+8%), API Design (+5%).' },
  ];
  return (
    <section id="ai-showcase" className="relative overflow-hidden py-24">
      <div className="absolute inset-0 bg-dots opacity-30" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading center eyebrow="AI Engine"
          title={<>Your personal <span className="gradient-text">AI career copilot</span></>}
          subtitle="Seven specialized AI models trained on placement data, working together to accelerate your journey." />
        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-3">
            {tools.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.06}>
                <button onClick={() => setActive(i)}
                  className={`w-full rounded-2xl border p-5 text-left transition-all ${active === i ? 'gradient-border shadow-glow' : 'border-base bg-soft/40 hover:bg-soft'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`rounded-xl p-2.5 ${active === i ? 'bg-gradient-to-br from-primary to-secondary text-white' : 'bg-soft text-primary'}`}>
                      <t.icon size={22} />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold">{t.name}</h3>
                      <p className="mt-0.5 text-sm text-soft">{t.desc}</p>
                    </div>
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.15}>
            <div className="sticky top-24">
              <div className="gradient-border overflow-hidden rounded-3xl">
                <div className="flex items-center gap-2 border-b border-base bg-soft/50 px-5 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-danger/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-success/60" />
                  </div>
                  <span className="ml-2 flex items-center gap-1.5 text-xs text-soft">
                    <Sparkles size={12} className="text-primary" /> CampusConnect AI
                  </span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div key={active} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }} className="p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-xl bg-gradient-to-br from-primary to-secondary p-2 text-white">
                        {(() => { const I = tools[active].icon; return <I size={20} />; })()}
                      </div>
                      <h4 className="font-display text-lg font-semibold">{tools[active].name}</h4>
                    </div>
                    <div className="rounded-2xl border border-base bg-soft/40 p-4">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-primary">
                        <Brain size={14} /> AI Response
                      </div>
                      <p className="text-sm text-soft leading-relaxed">{tools[active].sample}</p>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <div className="flex-1 rounded-xl bg-soft/60 px-4 py-3 text-sm text-soft">Ask a follow-up question...</div>
                      <button className="rounded-xl bg-gradient-to-br from-primary to-secondary p-3 text-white"><ArrowRight size={18} /></button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section id="testimonials" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading center eyebrow="Testimonials"
          title={<>Students who <span className="gradient-text">cracked it</span></>}
          subtitle="Real outcomes from students who used CampusConnect AI to land their dream roles." />
        <div className="mt-16 columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.05}>
              <GlassCard className="break-inside-avoid">
                <Quote className="mb-4 text-primary/40" size={32} />
                <p className="text-sm leading-relaxed text-[rgb(var(--text))]">"{t.quote}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/20" />
                  <div className="flex-1">
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-xs text-soft">{t.role}</div>
                  </div>
                  <div className="flex">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} size={14} className="fill-warning text-warning" />
                    ))}
                  </div>
                </div>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading center eyebrow="FAQ" title={<>Questions, <span className="gradient-text">answered</span></>} />
        <div className="mt-12 space-y-3">
          {faqs.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.04}>
              <div className={`overflow-hidden rounded-2xl border transition-colors ${open === i ? 'gradient-border' : 'border-base bg-soft/40'}`}>
                <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                  <span className="font-semibold">{f.q}</span>
                  <motion.div animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.3 }}>
                    <ChevronDown size={20} className="shrink-0 text-soft" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {open === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                      <p className="px-5 pb-5 text-sm text-soft">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="gradient-border overflow-hidden rounded-3xl">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-8 sm:p-12">
              <SectionHeading eyebrow="Contact"
                title={<>Ready to <span className="gradient-text">get placed?</span></>}
                subtitle="Join thousands of students accelerating their career with AI. Start free today." />
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/signup"><GradientButton icon={<ArrowRight size={18} />} className="px-7 py-3.5">Create free account</GradientButton></Link>
                <GhostButton icon={<Mail size={18} />} className="px-7 py-3.5">Talk to us</GhostButton>
              </div>
              <div className="mt-8 flex items-center gap-4 text-sm text-soft">
                <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-success" /> Free for students</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-success" /> No card required</span>
              </div>
            </div>
            <div className="relative overflow-hidden border-t border-base bg-soft/40 p-8 sm:p-12 lg:border-l lg:border-t-0">
              <AuroraBackground className="opacity-40" />
              <div className="relative space-y-4">
                <div className="flex items-center gap-3 text-sm"><Mail size={18} className="text-primary" /> hello@campusconnect.ai</div>
                <div className="flex items-center gap-3 text-sm"><MapPin size={18} className="text-primary" /> Bangalore, India</div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <input placeholder="Your name" className="rounded-xl border border-base bg-[rgb(var(--card))] px-4 py-3 text-sm outline-none focus:border-primary" />
                  <input placeholder="Email" className="rounded-xl border border-base bg-[rgb(var(--card))] px-4 py-3 text-sm outline-none focus:border-primary" />
                  <textarea placeholder="Message" rows={3} className="col-span-2 rounded-xl border border-base bg-[rgb(var(--card))] px-4 py-3 text-sm outline-none focus:border-primary" />
                  <GradientButton className="col-span-2">Send message</GradientButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    { title: 'Product', links: ['Features', 'AI Tools', 'Companies', 'Pricing', 'Changelog'] },
    { title: 'Company', links: ['About', 'Careers', 'Blog', 'Press', 'Contact'] },
    { title: 'Resources', links: ['Documentation', 'Help Center', 'Community', 'API', 'Status'] },
    { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Cookies', 'Compliance'] },
  ];
  return (
    <footer className="relative border-t border-base py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-soft">The AI-powered placement platform connecting students, placement officers, and recruiters.</p>
            <div className="mt-6 flex gap-3">
              {[Github, Twitter, Linkedin].map((I, i) => (
                <a key={i} href="#" className="rounded-lg border border-base p-2 text-soft transition-colors hover:border-primary hover:text-primary">
                  <I size={18} />
                </a>
              ))}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="font-display text-sm font-semibold">{c.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}><a href="#" className="text-sm text-soft transition-colors hover:text-[rgb(var(--text))]">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-base pt-8 sm:flex-row">
          <p className="text-sm text-soft">© 2026 CampusConnect AI. All rights reserved.</p>
          <p className="text-sm text-soft">Built with AI for the next generation of talent.</p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-base">
      <Navbar />
      <Hero />
      <StatsSection />
      <TrustedCompanies />
      <FeaturesSection />
      <TimelineSection />
      <AIShowcase />
      <TestimonialsSection />
      <FAQSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
