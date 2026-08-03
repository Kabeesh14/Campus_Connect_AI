import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import {
  Mail, MapPin, GraduationCap, Award, Github, Linkedin, Globe,
  FileText, Plus, Pencil, CheckCircle2, Trophy, Code2, BookOpen, Upload, Trash2, Download, RefreshCw, X,
} from 'lucide-react';
import { GlassCard, Reveal, Badge, GradientButton, ProgressBar, ProgressRing } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';

interface SkillItem { id: string; name: string; level: number; category: string }
interface ProjectItem { id: string; name: string; desc: string; stack: string[]; link: string }
interface CertItem { id: string; name: string; issuer: string; year: string }
interface ResumeInfo { id: string; fileName: string; filePath: string; fileSize: number; mimeType: string; uploadedAt?: string }

const defaultAchievements = [
  { title: 'Hackathon Winner', desc: 'Smart India Hackathon 2025', icon: Trophy },
  { title: 'Top Coder', desc: 'Ranked 142 on LeetCode', icon: Code2 },
  { title: "Dean's List", desc: 'Top 5% of department', icon: Award },
  { title: 'Open Source', desc: '3 merged PRs to React', icon: Github },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);

  // Profile Form States
  const [name, setName] = useState(user?.name ?? '');
  const [headline, setHeadline] = useState(user?.headline ?? '');
  const [department, setDepartment] = useState(user?.department ?? 'Computer Science & Engineering');
  const [cgpa, setCgpa] = useState<number>(user?.cgpa ?? 8.6);
  const [graduationYear, setGraduationYear] = useState<number>(user?.graduationYear ?? 2026);
  const [avatar, setAvatar] = useState(user?.avatar ?? '');
  const [completion, setCompletion] = useState(78);

  // Dynamic Array States
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [certifications, setCertifications] = useState<CertItem[]>([]);
  const [resume, setResume] = useState<ResumeInfo | null>(null);

  // Modal / Add States
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState(75);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial profile from backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiRequest('/student/profile');
        if (res.success && res.data) {
          const { student, skills: sk, projects: pr, certifications: cr, resume: rs } = res.data;
          setName(student.name);
          setHeadline(student.headline);
          setDepartment(student.department);
          setCgpa(student.cgpa);
          setGraduationYear(student.graduationYear);
          setAvatar(student.avatar);
          setCompletion(student.completion || 82);
          if (sk && sk.length > 0) setSkills(sk);
          if (pr && pr.length > 0) setProjects(pr);
          if (cr && cr.length > 0) setCertifications(cr);
          if (rs) setResume(rs);
        }
      } catch {
        // Fallback to local states if offline
      }
    };
    fetchProfile();
  }, []);

  // Save profile edits
  const handleSaveProfile = async () => {
    try {
      await apiRequest('/student/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, headline, department, cgpa, graduationYear }),
      });
    } catch {
      // Local update fallback
    } finally {
      setEditing(false);
    }
  };

  // Avatar upload
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await apiRequest('/student/avatar', {
        method: 'POST',
        body: formData,
      });
      if (res.success && res.avatar) {
        setAvatar(res.avatar);
      } else {
        setAvatarError(res.message || 'Failed to upload profile photo.');
      }
    } catch (err: unknown) {
      setAvatarError((err as Error).message || 'Failed to upload profile photo. Please try again.');
    }
  };

  // Resume upload / replace
  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await apiRequest('/student/resume', {
        method: 'POST',
        body: formData,
      });
      if (res.success && res.resume) {
        setResume(res.resume);
      }
    } catch {
      setResume({
        id: 'r-' + Date.now(),
        fileName: file.name,
        filePath: URL.createObjectURL(file),
        fileSize: file.size,
        mimeType: file.type,
      });
    }
  };

  // Add Skill
  const handleAddSkill = async () => {
    if (!newSkillName.trim()) return;
    try {
      const res = await apiRequest('/student/skills', {
        method: 'POST',
        body: JSON.stringify({ name: newSkillName, level: newSkillLevel, category: 'Core' }),
      });
      if (res.success && res.skill) {
        setSkills((prev) => [...prev, res.skill]);
      }
    } catch {
      setSkills((prev) => [...prev, { id: 'sk-' + Date.now(), name: newSkillName, level: newSkillLevel, category: 'Core' }]);
    } finally {
      setNewSkillName('');
      setShowSkillModal(false);
    }
  };

  // Delete Skill
  const handleDeleteSkill = async (id: string) => {
    try {
      await apiRequest(`/student/skills/${id}`, { method: 'DELETE' });
    } catch {
      // Fallback
    } finally {
      setSkills((prev) => prev.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
      <input type="file" ref={resumeInputRef} onChange={handleResumeChange} accept=".pdf,.doc,.docx" className="hidden" />

      <Reveal>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">My Profile</h1>
            <p className="mt-1 text-soft">Manage your professional presence.</p>
          </div>
          <GradientButton onClick={editing ? handleSaveProfile : () => setEditing(true)} icon={editing ? <CheckCircle2 size={18} /> : <Pencil size={18} />} className="py-2.5">
            {editing ? 'Save Profile' : 'Edit Profile'}
          </GradientButton>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Reveal delay={0.05}>
          <GlassCard gradient className="relative overflow-hidden">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative flex flex-col items-center text-center">
              <div className="relative">
                <img src={avatar || user?.avatar} alt={name} className="h-28 w-28 rounded-3xl object-cover ring-4 ring-primary/20" />
                <button onClick={() => avatarInputRef.current?.click()} className="absolute -bottom-1 -right-1 rounded-xl bg-gradient-to-br from-primary to-secondary p-2 text-white shadow-glow transition-transform hover:scale-105">
                  <Upload size={16} />
                </button>
              </div>
              {avatarError && (
                <p className="mt-2 text-xs font-semibold text-danger">{avatarError}</p>
              )}
              {editing ? (
                <div className="mt-4 w-full space-y-2">
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="w-full rounded-lg border border-base bg-soft/50 px-3 py-1.5 text-center text-lg font-bold outline-none focus:border-primary" />
                  <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Headline" className="w-full rounded-lg border border-base bg-soft/50 px-3 py-1 text-center text-sm outline-none focus:border-primary" />
                  <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department" className="w-full rounded-lg border border-base bg-soft/50 px-3 py-1 text-center text-xs outline-none focus:border-primary" />
                  <div className="flex gap-2">
                    <input type="number" step="0.1" value={cgpa} onChange={(e) => setCgpa(parseFloat(e.target.value))} placeholder="CGPA" className="w-1/2 rounded-lg border border-base bg-soft/50 px-2 py-1 text-center text-xs outline-none focus:border-primary" />
                    <input type="number" value={graduationYear} onChange={(e) => setGraduationYear(parseInt(e.target.value))} placeholder="Grad Year" className="w-1/2 rounded-lg border border-base bg-soft/50 px-2 py-1 text-center text-xs outline-none focus:border-primary" />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="mt-4 font-display text-xl font-bold">{name}</h2>
                  <p className="text-sm text-soft">{headline}</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    <Badge variant="primary">{department}</Badge>
                    <Badge variant="accent">CGPA {cgpa}</Badge>
                    <Badge variant="success">{graduationYear}</Badge>
                  </div>
                </>
              )}
              <div className="mt-5 w-full">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-soft">Profile Completion</span><span className="font-semibold">{completion}%</span>
                </div>
                <ProgressBar value={completion} className="mt-2" />
              </div>
              <div className="mt-5 flex gap-3">
                {[Github, Linkedin, Globe, FileText].map((I, i) => (
                  <button key={i} className="rounded-xl border border-base bg-soft/40 p-2.5 text-soft transition-all hover:border-primary hover:text-primary"><I size={18} /></button>
                ))}
              </div>
            </div>
          </GlassCard>
        </Reveal>

        <Reveal delay={0.1}>
          <GlassCard className="flex flex-col items-center justify-center">
            <ProgressRing value={completion} size={140} label="Profile" />
            <p className="mt-4 text-center text-sm text-soft">Add resume, projects & certifications to reach 100%</p>
          </GlassCard>
        </Reveal>

        <Reveal delay={0.15}>
          <GlassCard>
            <h3 className="font-display text-lg font-semibold">Contact & Academic</h3>
            <div className="mt-4 space-y-3">
              {[
                { icon: Mail, label: 'Email', value: user?.email },
                { icon: GraduationCap, label: 'Department', value: department },
                { icon: Award, label: 'CGPA', value: cgpa?.toString() },
                { icon: MapPin, label: 'Graduation', value: graduationYear?.toString() },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3 rounded-xl border border-base bg-soft/40 p-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary"><row.icon size={16} /></div>
                  <div className="flex-1"><p className="text-xs text-soft">{row.label}</p><p className="text-sm font-semibold">{row.value}</p></div>
                </div>
              ))}
            </div>
          </GlassCard>
        </Reveal>
      </div>

      {/* Skills Section */}
      <Reveal delay={0.1}>
        <GlassCard>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Skills</h3>
            <button onClick={() => setShowSkillModal(true)} className="rounded-lg border border-base bg-soft/40 p-2 text-soft transition-colors hover:text-primary">
              <Plus size={18} />
            </button>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {skills.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="group relative">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-soft">{s.level}%</span>
                    <button onClick={() => handleDeleteSkill(s.id)} className="text-soft opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"><Trash2 size={14} /></button>
                  </div>
                </div>
                <ProgressBar value={s.level} className="mt-1.5" color={s.level >= 75 ? 'success' : s.level >= 50 ? 'primary' : 'warning'} />
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </Reveal>

      {/* Projects & Certifications */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Reveal delay={0.1}>
          <GlassCard>
            <h3 className="font-display text-lg font-semibold">Projects</h3>
            <div className="mt-4 space-y-3">
              {projects.map((p) => (
                <div key={p.id} className="rounded-2xl border border-base bg-soft/40 p-4 transition-all hover:border-primary/40">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-gradient-to-br from-primary to-secondary p-2 text-white"><Code2 size={16} /></div>
                      <h4 className="font-semibold">{p.name}</h4>
                    </div>
                    <Github size={16} className="text-soft" />
                  </div>
                  <p className="mt-2 text-sm text-soft">{p.desc}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.stack.map((s) => <span key={s} className="rounded-lg bg-soft px-2 py-0.5 text-xs font-medium text-soft">{s}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </Reveal>

        <div className="space-y-6">
          <Reveal delay={0.15}>
            <GlassCard>
              <h3 className="font-display text-lg font-semibold">Certifications</h3>
              <div className="mt-4 space-y-3">
                {certifications.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-xl border border-base bg-soft/40 p-3">
                    <div className="rounded-lg bg-success/10 p-2 text-success"><BookOpen size={16} /></div>
                    <div className="flex-1"><p className="text-sm font-semibold">{c.name}</p><p className="text-xs text-soft">{c.issuer} • {c.year}</p></div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.2}>
            <GlassCard>
              <h3 className="font-display text-lg font-semibold">Achievements</h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {defaultAchievements.map((a) => (
                  <div key={a.title} className="rounded-xl border border-base bg-soft/40 p-3">
                    <a.icon size={20} className="text-warning" />
                    <p className="mt-2 text-sm font-semibold">{a.title}</p>
                    <p className="text-xs text-soft">{a.desc}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </Reveal>
        </div>
      </div>

      {/* Resume Card */}
      <Reveal delay={0.15}>
        <GlassCard gradient className="relative overflow-hidden">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/30 blur-3xl" />
          <div className="relative flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-primary to-secondary p-4 text-white shadow-glow"><FileText size={28} /></div>
              <div>
                <h3 className="font-display text-lg font-semibold">Resume</h3>
                <p className="text-sm text-soft">
                  {resume ? `${resume.fileName} • ${Math.round((resume.fileSize || 1048576) / 1024)} KB` : 'No resume uploaded yet'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => resumeInputRef.current?.click()} className="btn-ghost flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold">
                <RefreshCw size={16} /> Replace
              </button>
              {resume && (
                <a href={resume.filePath} target="_blank" rel="noopener noreferrer" download>
                  <GradientButton className="py-2.5" icon={<Download size={16} />}>Download</GradientButton>
                </a>
              )}
            </div>
          </div>
        </GlassCard>
      </Reveal>

      {/* Add Skill Modal */}
      <AnimatePresence>
        {showSkillModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowSkillModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl glass-strong p-6 shadow-soft-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">Add Skill</h3>
                <button onClick={() => setShowSkillModal(false)} className="text-soft hover:text-[rgb(var(--text))]"><X size={18} /></button>
              </div>
              <div className="mt-4 space-y-4">
                <input value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} placeholder="Skill name (e.g. Node.js)" className="w-full rounded-xl border border-base bg-soft/50 px-4 py-3 text-sm outline-none focus:border-primary" />
                <div>
                  <label className="flex justify-between text-xs text-soft">Proficiency Level: <span className="font-bold text-primary">{newSkillLevel}%</span></label>
                  <input type="range" min="10" max="100" value={newSkillLevel} onChange={(e) => setNewSkillLevel(parseInt(e.target.value))} className="mt-2 w-full accent-primary" />
                </div>
                <GradientButton onClick={handleAddSkill} className="w-full py-3">Add Skill</GradientButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
