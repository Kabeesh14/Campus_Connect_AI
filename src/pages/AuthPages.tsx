import { motion, AnimatePresence } from 'framer-motion';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Lock, User as UserIcon, Eye, EyeOff, ArrowRight, ArrowLeft,
  GraduationCap, Briefcase, Building2, CheckCircle2, Sparkles, Loader2, AlertCircle,
} from 'lucide-react';
import { AuroraBackground, GradientButton } from '../components/ui';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';
import { cn } from '../utils/cn';

const roles: { id: Role; label: string; desc: string; icon: typeof GraduationCap }[] = [
  { id: 'student', label: 'Student', desc: 'Find your dream placement', icon: GraduationCap },
  { id: 'officer', label: 'Placement Officer', desc: 'Manage campus placements', icon: Briefcase },
  { id: 'recruiter', label: 'Recruiter', desc: 'Hire top talent faster', icon: Building2 },
];

function Field({ icon, type = 'text', placeholder, value, onChange, toggle }: {
  icon: ReactNode; type?: string; placeholder: string; value: string; onChange: (v: string) => void; toggle?: ReactNode;
}) {
  return (
    <div className="group relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-soft transition-colors group-focus-within:text-primary">{icon}</span>
      <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} required
        className="w-full rounded-xl border border-base bg-soft/50 py-3.5 pl-12 pr-12 text-sm outline-none transition-all focus:border-primary focus:bg-[rgb(var(--card))] focus:shadow-glow" />
      {toggle && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-soft">{toggle}</span>}
    </div>
  );
}

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-base px-4 py-12">
      <AuroraBackground />
      <div className="absolute inset-0 bg-dots opacity-20" />
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="relative z-10 w-full max-w-md">
        <div className="gradient-border rounded-3xl p-8 shadow-soft-lg sm:p-10">
          <Link to="/" className="mb-8 inline-block"><Logo /></Link>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-soft">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-center text-sm text-soft">{footer}</div>
        </div>
      </motion.div>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [role, setRole] = useState<Role>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const u = await login(email, password, role);
      const targetPath = u.role === 'student' ? '/dashboard' : '/admin';
      navigate(targetPath);
    } catch (err: unknown) {
      setError((err as Error).message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const demoEmails: Record<Role, string> = {
        student: 'student@campus.edu',
        officer: 'officer@campus.edu',
        recruiter: 'recruiter@google.com',
      };
      const u = await login(demoEmails[role], 'password', role);
      const targetPath = u.role === 'student' ? '/dashboard' : '/admin';
      navigate(targetPath);
    } catch (err: unknown) {
      setError((err as Error).message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue your placement journey."
      footer={<>Don't have an account? <Link to="/signup" className="font-semibold text-primary">Create one</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs font-semibold text-danger">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-soft">I am a</label>
          <div className="grid grid-cols-3 gap-2">
            {roles.map((r) => (
              <button key={r.id} type="button" onClick={() => setRole(r.id)}
                className={cn('rounded-xl border p-3 text-center transition-all',
                  role === r.id ? 'gradient-border shadow-glow' : 'border-base bg-soft/40 hover:bg-soft')}>
                <r.icon size={20} className={cn('mx-auto', role === r.id ? 'text-primary' : 'text-soft')} />
                <span className="mt-1.5 block text-xs font-semibold">{r.label}</span>
              </button>
            ))}
          </div>
        </div>
        <Field icon={<Mail size={18} />} type="email" placeholder="Email address" value={email} onChange={setEmail} />
        <Field icon={<Lock size={18} />} type={show ? 'text' : 'password'} placeholder="Password" value={password} onChange={setPassword}
          toggle={<button type="button" onClick={() => setShow(!show)}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>} />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-soft"><input type="checkbox" className="rounded border-base accent-primary" /> Remember me</label>
          <Link to="/forgot-password" className="font-semibold text-primary">Forgot password?</Link>
        </div>
        <GradientButton type="submit" disabled={loading} className="w-full py-3.5" icon={loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}>
          {loading ? 'Signing in...' : 'Sign in'}
        </GradientButton>
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-base" /></div>
          <div className="relative flex justify-center"><span className="bg-[rgb(var(--card))] px-3 text-xs text-soft">or</span></div>
        </div>
        <button type="button" onClick={handleDemoLogin} disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-base bg-soft/40 py-3.5 text-sm font-semibold transition-all hover:bg-soft">
          <Sparkles size={16} className="text-primary" /> Try demo account
        </button>
      </form>
    </AuthLayout>
  );
}

export function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [role, setRole] = useState<Role>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const u = await signup(name, email, password, role);
      const targetPath = u.role === 'student' ? '/dashboard' : '/admin';
      navigate(targetPath);
    } catch (err: unknown) {
      setError((err as Error).message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start your AI-powered placement journey today."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-primary">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs font-semibold text-danger">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-soft">Choose your role</label>
          <div className="grid grid-cols-3 gap-2">
            {roles.map((r) => (
              <button key={r.id} type="button" onClick={() => setRole(r.id)}
                className={cn('rounded-xl border p-3 text-center transition-all',
                  role === r.id ? 'gradient-border shadow-glow' : 'border-base bg-soft/40 hover:bg-soft')}>
                <r.icon size={20} className={cn('mx-auto', role === r.id ? 'text-primary' : 'text-soft')} />
                <span className="mt-1.5 block text-xs font-semibold">{r.label}</span>
              </button>
            ))}
          </div>
        </div>
        <Field icon={<UserIcon size={18} />} placeholder="Full name" value={name} onChange={setName} />
        <Field icon={<Mail size={18} />} type="email" placeholder="Email address" value={email} onChange={setEmail} />
        <Field icon={<Lock size={18} />} type={show ? 'text' : 'password'} placeholder="Create password" value={password} onChange={setPassword}
          toggle={<button type="button" onClick={() => setShow(!show)}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>} />
        <label className="flex items-start gap-2 text-sm text-soft">
          <input type="checkbox" required className="mt-0.5 rounded border-base accent-primary" />
          <span>I agree to the Terms of Service and Privacy Policy</span>
        </label>
        <GradientButton type="submit" disabled={loading} className="w-full py-3.5" icon={loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}>
          {loading ? 'Creating account...' : 'Create account'}
        </GradientButton>
      </form>
    </AuthLayout>
  );
}

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset password" subtitle="Enter your email and we'll send you a reset link."
      footer={<Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-primary"><ArrowLeft size={16} /> Back to sign in</Link>}>
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div key="sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 rounded-full bg-success/15 p-4"><CheckCircle2 size={32} className="text-success" /></div>
            <h3 className="font-display text-lg font-semibold">Check your inbox</h3>
            <p className="mt-2 text-sm text-soft">We sent a reset link to {email}</p>
          </motion.div>
        ) : (
          <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit} className="space-y-4">
            <Field icon={<Mail size={18} />} type="email" placeholder="Email address" value={email} onChange={setEmail} />
            <GradientButton type="submit" disabled={loading} className="w-full py-3.5" icon={loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}>
              {loading ? 'Sending...' : 'Send reset link'}
            </GradientButton>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
