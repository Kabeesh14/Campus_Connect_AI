import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  Sun, Moon, Monitor, Lock, Trash2, Bell, Shield, User as UserIcon,
  Check, AlertTriangle, Mail,
} from 'lucide-react';
import { GlassCard, Reveal, Badge, GradientButton, GhostButton } from '../components/ui';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={cn('relative h-6 w-11 rounded-full transition-colors', on ? 'bg-gradient-to-r from-primary to-secondary' : 'bg-soft')}>
      <motion.div layout transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md', on ? 'left-[22px]' : 'left-0.5')} />
    </button>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [prefs, setPrefs] = useState({
    emailNotif: true,
    pushNotif: true,
    weeklyDigest: false,
    autoMatch: true,
    twoFactor: false,
  });
  const [deleteOpen, setDeleteOpen] = useState(false);

  const togglePref = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const themeOptions = [
    { id: 'light' as const, label: 'Light', icon: Sun },
    { id: 'dark' as const, label: 'Dark', icon: Moon },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Reveal>
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Settings</h1>
          <p className="mt-1 text-soft">Manage your account, preferences, and privacy.</p>
        </div>
      </Reveal>

      {/* Appearance */}
      <Reveal delay={0.05}>
        <GlassCard>
          <div className="flex items-center gap-2">
            <Monitor size={20} className="text-primary" />
            <h3 className="font-display text-lg font-semibold">Appearance</h3>
          </div>
          <p className="mt-1 text-sm text-soft">Choose your preferred theme.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {themeOptions.map((t) => (
              <button key={t.id} onClick={() => setTheme(t.id)}
                className={cn('flex items-center gap-3 rounded-2xl border p-4 transition-all',
                  theme === t.id ? 'gradient-border shadow-glow' : 'border-base bg-soft/40 hover:bg-soft')}>
                <div className={cn('rounded-xl p-2.5', theme === t.id ? 'bg-gradient-to-br from-primary to-secondary text-white' : 'bg-soft text-soft')}>
                  <t.icon size={20} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold">{t.label} mode</p>
                </div>
                {theme === t.id && <Check size={18} className="text-primary" />}
              </button>
            ))}
          </div>
        </GlassCard>
      </Reveal>

      {/* Account */}
      <Reveal delay={0.1}>
        <GlassCard>
          <div className="flex items-center gap-2">
            <UserIcon size={20} className="text-primary" />
            <h3 className="font-display text-lg font-semibold">Account</h3>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-base bg-soft/40 p-4">
              <div className="flex items-center gap-3">
                <img src={user?.avatar} alt={user?.name} className="h-10 w-10 rounded-full object-cover" />
                <div><p className="text-sm font-semibold">{user?.name}</p><p className="text-xs text-soft">{user?.email}</p></div>
              </div>
              <Badge variant="primary" className="capitalize">{user?.role}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-base bg-soft/40 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary"><Mail size={16} /></div>
                <span className="text-sm font-medium">Email address</span>
              </div>
              <span className="text-sm text-soft">{user?.email}</span>
            </div>
          </div>
        </GlassCard>
      </Reveal>

      {/* Change password */}
      <Reveal delay={0.1}>
        <GlassCard>
          <div className="flex items-center gap-2">
            <Lock size={20} className="text-primary" />
            <h3 className="font-display text-lg font-semibold">Change Password</h3>
          </div>
          <div className="mt-4 space-y-3">
            <input type="password" placeholder="Current password" className="w-full rounded-xl border border-base bg-soft/40 px-4 py-3 text-sm outline-none focus:border-primary" />
            <input type="password" placeholder="New password" className="w-full rounded-xl border border-base bg-soft/40 px-4 py-3 text-sm outline-none focus:border-primary" />
            <input type="password" placeholder="Confirm new password" className="w-full rounded-xl border border-base bg-soft/40 px-4 py-3 text-sm outline-none focus:border-primary" />
            <GradientButton className="py-2.5" icon={<Lock size={16} />}>Update Password</GradientButton>
          </div>
        </GlassCard>
      </Reveal>

      {/* Notifications */}
      <Reveal delay={0.15}>
        <GlassCard>
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-primary" />
            <h3 className="font-display text-lg font-semibold">Notifications</h3>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { key: 'emailNotif' as const, label: 'Email notifications', desc: 'Receive emails about your applications and interviews' },
              { key: 'pushNotif' as const, label: 'Push notifications', desc: 'Get real-time alerts in your browser' },
              { key: 'weeklyDigest' as const, label: 'Weekly digest', desc: 'A summary of your placement activity every Monday' },
              { key: 'autoMatch' as const, label: 'AI match alerts', desc: 'Notify me when a high-match job is posted' },
            ].map((row) => (
              <div key={row.key} className="flex items-center justify-between rounded-xl border border-base bg-soft/40 p-4">
                <div><p className="text-sm font-medium">{row.label}</p><p className="text-xs text-soft">{row.desc}</p></div>
                <Toggle on={prefs[row.key]} onChange={() => togglePref(row.key)} />
              </div>
            ))}
          </div>
        </GlassCard>
      </Reveal>

      {/* Security */}
      <Reveal delay={0.2}>
        <GlassCard>
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-primary" />
            <h3 className="font-display text-lg font-semibold">Security</h3>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-base bg-soft/40 p-4">
              <div><p className="text-sm font-medium">Two-factor authentication</p><p className="text-xs text-soft">Add an extra layer of security</p></div>
              <Toggle on={prefs.twoFactor} onChange={() => togglePref('twoFactor')} />
            </div>
          </div>
        </GlassCard>
      </Reveal>

      {/* Danger zone */}
      <Reveal delay={0.25}>
        <GlassCard className="border-danger/30">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-danger" />
            <h3 className="font-display text-lg font-semibold text-danger">Danger Zone</h3>
          </div>
          <p className="mt-2 text-sm text-soft">Once you delete your account, there is no going back. Please be certain.</p>
          <div className="mt-4">
            <GhostButton onClick={() => setDeleteOpen(true)} className="border-danger/30 text-danger hover:bg-danger/10" icon={<Trash2 size={16} />}>Delete Account</GhostButton>
          </div>
        </GlassCard>
      </Reveal>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
            onClick={() => setDeleteOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl glass-strong p-6 shadow-soft-lg">
              <div className="mx-auto mb-4 w-fit rounded-full bg-danger/15 p-4"><AlertTriangle size={28} className="text-danger" /></div>
              <h3 className="text-center font-display text-xl font-bold">Delete account?</h3>
              <p className="mt-2 text-center text-sm text-soft">This will permanently delete your profile, applications, and all data. This action cannot be undone.</p>
              <div className="mt-6 flex gap-3">
                <GhostButton onClick={() => setDeleteOpen(false)} className="flex-1 py-3">Cancel</GhostButton>
                <button onClick={() => setDeleteOpen(false)} className="flex-1 rounded-xl bg-danger py-3 text-sm font-semibold text-white transition-transform hover:scale-105">
                  Yes, delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
