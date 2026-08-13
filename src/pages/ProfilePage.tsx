import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import {
  Mail, MapPin, GraduationCap, Award, Github, Linkedin, Globe,
  FileText, Plus, Pencil, CheckCircle2, Trophy, Code2, BookOpen, Upload, Trash2, Download, RefreshCw, X, ExternalLink, Loader2, Link as LinkIcon, FileCheck, Eye,
} from 'lucide-react';
import { GlassCard, Reveal, Badge, GradientButton, ProgressBar, ProgressRing } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { apiRequest, getMediaUrl } from '../utils/api';

interface SkillItem { id: string; name: string; level: number; category: string }

interface ProjectItem {
  id: string;
  name: string;
  desc: string;
  stack: string[];
  link?: string;
  githubUrl?: string;
  liveDemoUrl?: string;
  startDate?: string;
  endDate?: string;
  imageUrl?: string;
}

interface CertItem {
  id: string;
  name: string;
  issuer: string;
  year?: string;
  issueDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  certificateFileUrl?: string;
}

interface AchievementItem {
  id: string;
  title: string;
  description?: string;
  organization?: string;
  achievementDate?: string;
  url?: string;
  proofUrl?: string;
  createdAt?: string;
}

interface ResumeInfo { id: string; fileName: string; filePath: string; fileSize: number; mimeType: string; uploadedAt?: string }

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
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
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [resume, setResume] = useState<ResumeInfo | null>(null);

  // Skill Modal States
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState(75);

  // Project Modal States
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projStack, setProjStack] = useState('');
  const [projGithub, setProjGithub] = useState('');
  const [projLiveDemo, setProjLiveDemo] = useState('');
  const [projStartDate, setProjStartDate] = useState('');
  const [projEndDate, setProjEndDate] = useState('');
  const [projImageFile, setProjImageFile] = useState<File | null>(null);
  const [projImagePreview, setProjImagePreview] = useState<string | null>(null);
  const [projError, setProjError] = useState<string | null>(null);
  const [projSubmitting, setProjSubmitting] = useState(false);

  // Certification Modal States
  const [showCertModal, setShowCertModal] = useState(false);
  const [editingCert, setEditingCert] = useState<CertItem | null>(null);
  const [certName, setCertName] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certIssueDate, setCertIssueDate] = useState('');
  const [certCredentialId, setCertCredentialId] = useState('');
  const [certCredentialUrl, setCertCredentialUrl] = useState('');
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certFileName, setCertFileName] = useState<string | null>(null);
  const [certError, setCertError] = useState<string | null>(null);
  const [certSubmitting, setCertSubmitting] = useState(false);

  // Achievement Modal States
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<AchievementItem | null>(null);
  const [achTitle, setAchTitle] = useState('');
  const [achDesc, setAchDesc] = useState('');
  const [achOrg, setAchOrg] = useState('');
  const [achDate, setAchDate] = useState('');
  const [achUrl, setAchUrl] = useState('');
  const [achProofFile, setAchProofFile] = useState<File | null>(null);
  const [achProofFileName, setAchProofFileName] = useState<string | null>(null);
  const [achError, setAchError] = useState<string | null>(null);
  const [achSubmitting, setAchSubmitting] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // Load backend profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await apiRequest('/student/profile');
        if (res.success && res.data?.student) {
          const student = res.data.student;
          setName(student.name);
          setHeadline(student.headline);
          setDepartment(student.department);
          setCgpa(student.cgpa);
          setGraduationYear(student.graduationYear);
          setAvatar(student.avatar);
          setCompletion(student.completion || 78);
          if (res.data.skills) setSkills(res.data.skills);
          if (res.data.projects) setProjects(res.data.projects);
          if (res.data.certifications) setCertifications(res.data.certifications);
          if (res.data.achievements) setAchievements(res.data.achievements);
          if (res.data.resume) {
            setResume({
              id: res.data.resume.id,
              fileName: res.data.resume.file_name,
              filePath: res.data.resume.file_path,
              fileSize: res.data.resume.file_size,
              mimeType: res.data.resume.file_type,
              uploadedAt: res.data.resume.uploaded_at,
            });
          }
          updateUser({
            name: student.name,
            headline: student.headline,
            department: student.department,
            cgpa: student.cgpa,
            graduationYear: student.graduationYear,
            avatar: student.avatar,
          });
        }
      } catch {
        // Fallback
      }
    };
    loadProfile();
  }, []);

  // Save profile edits
  const handleSaveProfile = async () => {
    try {
      await apiRequest('/student/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, headline, department, cgpa, graduationYear }),
      });
      updateUser({ name, headline, department, cgpa, graduationYear });
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
        updateUser({ avatar: res.avatar });
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

  // Skills Handlers
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

  const handleDeleteSkill = async (id: string) => {
    try {
      await apiRequest(`/student/skills/${id}`, { method: 'DELETE' });
    } catch {
      // Fallback
    } finally {
      setSkills((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // Projects Handlers
  const openAddProjectModal = () => {
    setEditingProject(null);
    setProjName('');
    setProjDesc('');
    setProjStack('');
    setProjGithub('');
    setProjLiveDemo('');
    setProjStartDate('');
    setProjEndDate('');
    setProjImageFile(null);
    setProjImagePreview(null);
    setProjError(null);
    setShowProjectModal(true);
  };

  const openEditProjectModal = (proj: ProjectItem) => {
    setEditingProject(proj);
    setProjName(proj.name);
    setProjDesc(proj.desc);
    setProjStack(Array.isArray(proj.stack) ? proj.stack.join(', ') : proj.stack || '');
    setProjGithub(proj.githubUrl || proj.link || '');
    setProjLiveDemo(proj.liveDemoUrl || '');
    setProjStartDate(proj.startDate || '');
    setProjEndDate(proj.endDate || '');
    setProjImageFile(null);
    setProjImagePreview(proj.imageUrl ? getMediaUrl(proj.imageUrl) : null);
    setProjError(null);
    setShowProjectModal(true);
  };

  const handleSaveProject = async () => {
    setProjError(null);
    if (!projName.trim()) {
      setProjError('Project Name is required.');
      return;
    }
    if (!projDesc.trim()) {
      setProjError('Project Description is required.');
      return;
    }
    if (!projStack.trim()) {
      setProjError('Technologies / Skills are required.');
      return;
    }

    setProjSubmitting(true);
    const formData = new FormData();
    formData.append('name', projName.trim());
    formData.append('desc', projDesc.trim());
    formData.append('stack', projStack.trim());
    formData.append('github_url', projGithub.trim());
    formData.append('live_demo_url', projLiveDemo.trim());
    formData.append('start_date', projStartDate.trim());
    formData.append('end_date', projEndDate.trim());
    if (projImageFile) {
      formData.append('image', projImageFile);
    }

    try {
      const endpoint = editingProject ? `/student/projects/${editingProject.id}` : '/student/projects';
      const method = editingProject ? 'PUT' : 'POST';
      const res = await apiRequest(endpoint, { method, body: formData });

      if (res.success && res.project) {
        if (editingProject) {
          setProjects((prev) => prev.map((p) => (p.id === editingProject.id ? res.project : p)));
        } else {
          setProjects((prev) => [res.project, ...prev]);
        }
        setShowProjectModal(false);
      } else {
        setProjError(res.message || 'File upload failed. Please try again.');
      }
    } catch (err: unknown) {
      setProjError((err as Error).message || 'File upload failed. Please try again.');
    } finally {
      setProjSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const res = await apiRequest(`/student/projects/${id}`, { method: 'DELETE' });
      if (res.success) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // Certifications Handlers
  const openAddCertModal = () => {
    setEditingCert(null);
    setCertName('');
    setCertIssuer('');
    setCertIssueDate('');
    setCertCredentialId('');
    setCertCredentialUrl('');
    setCertFile(null);
    setCertFileName(null);
    setCertError(null);
    setShowCertModal(true);
  };

  const openEditCertModal = (cert: CertItem) => {
    setEditingCert(cert);
    setCertName(cert.name);
    setCertIssuer(cert.issuer);
    setCertIssueDate(cert.issueDate || cert.year || '');
    setCertCredentialId(cert.credentialId || '');
    setCertCredentialUrl(cert.credentialUrl || '');
    setCertFile(null);
    setCertFileName(cert.certificateFileUrl ? 'Existing Certificate Uploaded' : null);
    setCertError(null);
    setShowCertModal(true);
  };

  const handleSaveCert = async () => {
    setCertError(null);
    if (!certName.trim()) {
      setCertError('Certification Name is required.');
      return;
    }
    if (!certIssuer.trim()) {
      setCertError('Issuing Organization is required.');
      return;
    }

    setCertSubmitting(true);
    const formData = new FormData();
    formData.append('name', certName.trim());
    formData.append('issuer', certIssuer.trim());
    formData.append('issue_date', certIssueDate.trim());
    formData.append('credential_id', certCredentialId.trim());
    formData.append('credential_url', certCredentialUrl.trim());
    if (certFile) {
      formData.append('file', certFile);
    }

    try {
      const endpoint = editingCert ? `/student/certifications/${editingCert.id}` : '/student/certifications';
      const method = editingCert ? 'PUT' : 'POST';
      const res = await apiRequest(endpoint, { method, body: formData });

      if (res.success && res.certification) {
        if (editingCert) {
          setCertifications((prev) => prev.map((c) => (c.id === editingCert.id ? res.certification : c)));
        } else {
          setCertifications((prev) => [res.certification, ...prev]);
        }
        setShowCertModal(false);
      } else {
        setCertError(res.message || 'File upload failed. Please try again.');
      }
    } catch (err: unknown) {
      setCertError((err as Error).message || 'File upload failed. Please try again.');
    } finally {
      setCertSubmitting(false);
    }
  };

  const handleDeleteCert = async (id: string) => {
    try {
      const res = await apiRequest(`/student/certifications/${id}`, { method: 'DELETE' });
      if (res.success) {
        setCertifications((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {
      setCertifications((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // Achievement Modal Handlers
  const openAddAchievementModal = () => {
    setEditingAchievement(null);
    setAchTitle('');
    setAchDesc('');
    setAchOrg('');
    setAchDate('');
    setAchUrl('');
    setAchProofFile(null);
    setAchProofFileName(null);
    setAchError(null);
    setShowAchievementModal(true);
  };

  const openEditAchievementModal = (ach: AchievementItem) => {
    setEditingAchievement(ach);
    setAchTitle(ach.title || '');
    setAchDesc(ach.description || '');
    setAchOrg(ach.organization || '');
    setAchDate(ach.achievementDate || '');
    setAchUrl(ach.url || '');
    setAchProofFile(null);
    setAchProofFileName(ach.proofUrl ? 'Existing Certificate Uploaded' : null);
    setAchError(null);
    setShowAchievementModal(true);
  };

  const handleSaveAchievement = async () => {
    setAchError(null);
    if (!achTitle.trim()) {
      setAchError('Achievement Title is required.');
      return;
    }

    setAchSubmitting(true);
    const formData = new FormData();
    formData.append('title', achTitle.trim());
    formData.append('description', achDesc.trim());
    formData.append('organization', achOrg.trim());
    formData.append('achievement_date', achDate.trim());
    formData.append('url', achUrl.trim());
    if (achProofFile) {
      formData.append('proof', achProofFile);
    }

    try {
      const endpoint = editingAchievement ? `/student/achievements/${editingAchievement.id}` : '/student/achievements';
      const method = editingAchievement ? 'PUT' : 'POST';
      const res = await apiRequest(endpoint, { method, body: formData });

      if (res.success && res.achievement) {
        if (editingAchievement) {
          setAchievements((prev) => prev.map((a) => (a.id === editingAchievement.id ? res.achievement : a)));
        } else {
          setAchievements((prev) => [res.achievement, ...prev]);
        }
        setShowAchievementModal(false);
      } else {
        setAchError(res.message || 'Saving achievement failed. Please try again.');
      }
    } catch (err: unknown) {
      setAchError((err as Error).message || 'Saving achievement failed. Please try again.');
    } finally {
      setAchSubmitting(false);
    }
  };

  const handleDeleteAchievement = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this achievement?')) return;
    try {
      const res = await apiRequest(`/student/achievements/${id}`, { method: 'DELETE' });
      if (res.success) {
        setAchievements((prev) => prev.filter((a) => a.id !== id));
      }
    } catch {
      setAchievements((prev) => prev.filter((a) => a.id !== id));
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
                <img
                  src={getMediaUrl(avatar || user?.avatar)}
                  alt={name}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200';
                  }}
                  className="h-28 w-28 rounded-3xl object-cover ring-4 ring-primary/20"
                />
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
                  <p className="text-xs text-soft">{user?.email}</p>
                  <p className="mt-1 text-sm text-soft">{headline}</p>
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

      {/* Projects & Certifications Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Projects Section */}
        <Reveal delay={0.1}>
          <GlassCard>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Projects</h3>
              <button onClick={openAddProjectModal} className="rounded-lg border border-base bg-soft/40 p-2 text-soft transition-colors hover:text-primary">
                <Plus size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-base p-8 text-center">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Code2 size={24} />
                  </div>
                  <p className="mt-3 font-semibold">No projects added yet</p>
                  <p className="mt-1 text-xs text-soft">Showcase your technical work to recruiters.</p>
                  <button onClick={openAddProjectModal} className="mt-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2 text-xs font-semibold text-white shadow-glow">
                    <Plus size={16} /> Add Project
                  </button>
                </div>
              ) : (
                projects.map((p) => (
                  <div key={p.id} className="group relative overflow-hidden rounded-2xl border border-base bg-soft/40 p-4 transition-all hover:border-primary/40">
                    {p.imageUrl && (
                      <div className="mb-3 overflow-hidden rounded-xl bg-soft/60">
                        <img
                          src={getMediaUrl(p.imageUrl)}
                          alt={p.name}
                          className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="rounded-lg bg-gradient-to-br from-primary to-secondary p-2 text-white shadow-sm">
                          <Code2 size={16} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-base">{p.name}</h4>
                          {(p.startDate || p.endDate) && (
                            <p className="text-[11px] text-soft">
                              {p.startDate} {p.endDate ? ` - ${p.endDate}` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditProjectModal(p)} className="rounded-lg border border-base bg-soft/60 p-1.5 text-soft transition-colors hover:border-primary hover:text-primary">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDeleteProject(p.id)} className="rounded-lg border border-base bg-soft/60 p-1.5 text-soft transition-colors hover:border-danger hover:text-danger">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <p className="mt-2.5 text-sm text-soft leading-relaxed">{p.desc}</p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(Array.isArray(p.stack) ? p.stack : []).map((s) => (
                        <span key={s} className="rounded-lg border border-base bg-soft/60 px-2 py-0.5 text-xs font-medium text-soft">
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3 pt-2 border-t border-base/40">
                      {(p.githubUrl || p.link) && (
                        <a
                          href={p.githubUrl || p.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                        >
                          <Github size={14} /> Code / GitHub
                        </a>
                      )}
                      {p.liveDemoUrl && (
                        <a
                          href={p.liveDemoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold text-secondary hover:underline"
                        >
                          <ExternalLink size={14} /> Live Demo
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </Reveal>

        {/* Certifications & Achievements Side Column */}
        <div className="space-y-6">
          {/* Certifications Section */}
          <Reveal delay={0.15}>
            <GlassCard>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">Certifications</h3>
                <button onClick={openAddCertModal} className="rounded-lg border border-base bg-soft/40 p-2 text-soft transition-colors hover:text-primary">
                  <Plus size={18} />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {certifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-base p-8 text-center">
                    <div className="rounded-2xl bg-success/10 p-3 text-success">
                      <BookOpen size={24} />
                    </div>
                    <p className="mt-3 font-semibold">No certifications added yet</p>
                    <p className="mt-1 text-xs text-soft">Add verified certificates and online courses.</p>
                    <button onClick={openAddCertModal} className="mt-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-success to-accent px-4 py-2 text-xs font-semibold text-white shadow-glow">
                      <Plus size={16} /> Add Certification
                    </button>
                  </div>
                ) : (
                  certifications.map((c) => (
                    <div key={c.id} className="group relative rounded-xl border border-base bg-soft/40 p-4 transition-all hover:border-success/40">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-success/10 p-2.5 text-success">
                          <BookOpen size={18} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-sm">{c.name}</h4>
                              <p className="text-xs text-soft mt-0.5">
                                {c.issuer} {c.issueDate || c.year ? `• ${c.issueDate || c.year}` : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => openEditCertModal(c)} className="rounded-lg border border-base bg-soft/60 p-1 text-soft transition-colors hover:border-primary hover:text-primary">
                                <Pencil size={13} />
                              </button>
                              <button onClick={() => handleDeleteCert(c.id)} className="rounded-lg border border-base bg-soft/60 p-1 text-soft transition-colors hover:border-danger hover:text-danger">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          {c.credentialId && (
                            <p className="mt-1.5 text-[11px] font-mono text-soft">ID: {c.credentialId}</p>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-base/40">
                            {c.credentialUrl && (
                              <a
                                href={c.credentialUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                              >
                                <ExternalLink size={13} /> Verify Credential
                              </a>
                            )}
                            {c.certificateFileUrl && (
                              <>
                                <a
                                  href={getMediaUrl(c.certificateFileUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs font-semibold text-success hover:underline"
                                >
                                  <Eye size={13} /> View Certificate
                                </a>
                                <a
                                  href={getMediaUrl(c.certificateFileUrl)}
                                  download
                                  className="flex items-center gap-1 text-xs font-semibold text-soft hover:text-primary hover:underline"
                                >
                                  <Download size={13} /> Download
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          </Reveal>

          {/* Achievements */}
          <Reveal delay={0.2}>
            <GlassCard>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">Achievements</h3>
                <button onClick={openAddAchievementModal} className="rounded-lg border border-base bg-soft/40 p-2 text-soft transition-colors hover:text-primary">
                  <Plus size={18} />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {achievements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-base p-8 text-center">
                    <div className="rounded-2xl bg-warning/10 p-3 text-warning">
                      <Trophy size={24} />
                    </div>
                    <p className="mt-3 font-semibold">No achievements added yet</p>
                    <p className="mt-1 text-xs text-soft">Highlight your awards, hackathons, open source contributions, or honors.</p>
                    <button onClick={openAddAchievementModal} className="mt-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2 text-xs font-semibold text-white shadow-glow">
                      <Plus size={16} /> Add Achievement
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {achievements.map((a) => (
                      <div key={a.id} className="group relative overflow-hidden rounded-2xl border border-base bg-soft/40 p-4 transition-all hover:border-primary/40">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="rounded-xl bg-warning/10 p-2.5 text-warning shrink-0">
                              <Trophy size={20} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-sm truncate">{a.title}</h4>
                              {a.organization && (
                                <p className="text-xs text-primary font-medium mt-0.5">{a.organization}</p>
                              )}
                              {a.achievementDate && (
                                <p className="text-[11px] text-soft mt-0.5">{a.achievementDate}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => openEditAchievementModal(a)} className="rounded-lg border border-base bg-soft/60 p-1.5 text-soft transition-colors hover:border-primary hover:text-primary">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => handleDeleteAchievement(a.id)} className="rounded-lg border border-base bg-soft/60 p-1.5 text-soft transition-colors hover:border-danger hover:text-danger">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {a.description && (
                          <p className="mt-3 text-xs leading-relaxed text-soft">{a.description}</p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-base/40">
                          {a.url && (
                            <a href={a.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                              <ExternalLink size={13} /> View Link
                            </a>
                          )}
                          {a.proofUrl && (
                            <>
                              <a href={getMediaUrl(a.proofUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-semibold text-success hover:underline">
                                <Eye size={13} /> View Proof
                              </a>
                              <a href={getMediaUrl(a.proofUrl)} download className="flex items-center gap-1 text-xs font-semibold text-soft hover:text-primary hover:underline">
                                <Download size={13} /> Download
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                <a href={getMediaUrl(resume.filePath)} target="_blank" rel="noopener noreferrer" download>
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

      {/* Add / Edit Project Modal */}
      <AnimatePresence>
        {showProjectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowProjectModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl glass-strong p-6 shadow-soft-lg">
              <div className="flex items-center justify-between pb-4 border-b border-base">
                <h3 className="font-display text-lg font-semibold">
                  {editingProject ? 'Edit Project' : 'Add New Project'}
                </h3>
                <button onClick={() => setShowProjectModal(false)} className="text-soft hover:text-[rgb(var(--text))]">
                  <X size={18} />
                </button>
              </div>

              {projError && (
                <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs font-semibold text-danger">
                  {projError}
                </div>
              )}

              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-soft mb-1">Project Name *</label>
                  <input
                    value={projName}
                    onChange={(e) => setProjName(e.target.value)}
                    placeholder="e.g. E-Commerce Sales Analysis"
                    className="w-full rounded-xl border border-base bg-soft/50 px-4 py-2.5 outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-soft mb-1">Project Description *</label>
                  <textarea
                    rows={3}
                    value={projDesc}
                    onChange={(e) => setProjDesc(e.target.value)}
                    placeholder="Describe key features, objective, and achievements..."
                    className="w-full rounded-xl border border-base bg-soft/50 px-4 py-2.5 outline-none focus:border-primary resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-soft mb-1">Technologies / Skills *</label>
                  <input
                    value={projStack}
                    onChange={(e) => setProjStack(e.target.value)}
                    placeholder="e.g. Power BI, SQL, Excel (comma separated)"
                    className="w-full rounded-xl border border-base bg-soft/50 px-4 py-2.5 outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-soft mb-1">GitHub URL</label>
                    <input
                      value={projGithub}
                      onChange={(e) => setProjGithub(e.target.value)}
                      placeholder="https://github.com/..."
                      className="w-full rounded-xl border border-base bg-soft/50 px-3 py-2 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-soft mb-1">Live Demo URL</label>
                    <input
                      value={projLiveDemo}
                      onChange={(e) => setProjLiveDemo(e.target.value)}
                      placeholder="https://my-app.vercel.app"
                      className="w-full rounded-xl border border-base bg-soft/50 px-3 py-2 text-xs outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-soft mb-1">Start Date</label>
                    <input
                      value={projStartDate}
                      onChange={(e) => setProjStartDate(e.target.value)}
                      placeholder="e.g. Jan 2025"
                      className="w-full rounded-xl border border-base bg-soft/50 px-3 py-2 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-soft mb-1">End Date</label>
                    <input
                      value={projEndDate}
                      onChange={(e) => setProjEndDate(e.target.value)}
                      placeholder="e.g. Mar 2025 or Present"
                      className="w-full rounded-xl border border-base bg-soft/50 px-3 py-2 text-xs outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-soft mb-1">Project Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setProjImageFile(file);
                        setProjImagePreview(URL.createObjectURL(file));
                      }
                    }}
                    className="w-full rounded-xl border border-base bg-soft/50 px-3 py-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-primary/20 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/30"
                  />
                  {projImagePreview && (
                    <div className="mt-2 relative h-28 w-full overflow-hidden rounded-xl border border-base">
                      <img src={projImagePreview} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>

                <GradientButton
                  onClick={handleSaveProject}
                  disabled={projSubmitting}
                  className="w-full py-3 mt-4"
                  icon={projSubmitting ? <Loader2 className="animate-spin" size={18} /> : undefined}
                >
                  {projSubmitting ? 'Saving Project...' : editingProject ? 'Update Project' : 'Add Project'}
                </GradientButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add / Edit Certification Modal */}
      <AnimatePresence>
        {showCertModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowCertModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl glass-strong p-6 shadow-soft-lg">
              <div className="flex items-center justify-between pb-4 border-b border-base">
                <h3 className="font-display text-lg font-semibold">
                  {editingCert ? 'Edit Certification' : 'Add New Certification'}
                </h3>
                <button onClick={() => setShowCertModal(false)} className="text-soft hover:text-[rgb(var(--text))]">
                  <X size={18} />
                </button>
              </div>

              {certError && (
                <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs font-semibold text-danger">
                  {certError}
                </div>
              )}

              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-soft mb-1">Certification Name *</label>
                  <input
                    value={certName}
                    onChange={(e) => setCertName(e.target.value)}
                    placeholder="e.g. SQL for Data Science"
                    className="w-full rounded-xl border border-base bg-soft/50 px-4 py-2.5 outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-soft mb-1">Issuing Organization *</label>
                  <input
                    value={certIssuer}
                    onChange={(e) => setCertIssuer(e.target.value)}
                    placeholder="e.g. Simplilearn / Coursera / AWS"
                    className="w-full rounded-xl border border-base bg-soft/50 px-4 py-2.5 outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-soft mb-1">Issue Date</label>
                    <input
                      value={certIssueDate}
                      onChange={(e) => setCertIssueDate(e.target.value)}
                      placeholder="e.g. Feb 2025"
                      className="w-full rounded-xl border border-base bg-soft/50 px-3 py-2 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-soft mb-1">Credential ID</label>
                    <input
                      value={certCredentialId}
                      onChange={(e) => setCertCredentialId(e.target.value)}
                      placeholder="e.g. CERT-987654"
                      className="w-full rounded-xl border border-base bg-soft/50 px-3 py-2 text-xs outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-soft mb-1">Credential URL</label>
                  <input
                    value={certCredentialUrl}
                    onChange={(e) => setCertCredentialUrl(e.target.value)}
                    placeholder="https://verify.certificate.com/..."
                    className="w-full rounded-xl border border-base bg-soft/50 px-4 py-2.5 text-xs outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-soft mb-1">Certificate File (PDF, Image)</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCertFile(file);
                        setCertFileName(file.name);
                      }
                    }}
                    className="w-full rounded-xl border border-base bg-soft/50 px-3 py-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-success/20 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-success hover:file:bg-success/30"
                  />
                  {certFileName && (
                    <p className="mt-1 text-xs text-success font-medium flex items-center gap-1">
                      <FileCheck size={14} /> Attached: {certFileName}
                    </p>
                  )}
                </div>

                <GradientButton
                  onClick={handleSaveCert}
                  disabled={certSubmitting}
                  className="w-full py-3 mt-4"
                  icon={certSubmitting ? <Loader2 className="animate-spin" size={18} /> : undefined}
                >
                  {certSubmitting ? 'Saving Certification...' : editingCert ? 'Update Certification' : 'Add Certification'}
                </GradientButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add / Edit Achievement Modal */}
      <AnimatePresence>
        {showAchievementModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowAchievementModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl glass-strong p-6 shadow-soft-lg">
              <div className="flex items-center justify-between pb-4 border-b border-base">
                <h3 className="font-display text-lg font-semibold">
                  {editingAchievement ? 'Edit Achievement' : 'Add New Achievement'}
                </h3>
                <button onClick={() => setShowAchievementModal(false)} className="text-soft hover:text-[rgb(var(--text))]">
                  <X size={18} />
                </button>
              </div>

              {achError && (
                <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs font-semibold text-danger">
                  {achError}
                </div>
              )}

              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-soft mb-1">Achievement Title *</label>
                  <input
                    value={achTitle}
                    onChange={(e) => setAchTitle(e.target.value)}
                    placeholder="e.g. Hackathon Winner / Open Source Contributor"
                    className="w-full rounded-xl border border-base bg-soft/50 px-4 py-2.5 outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-soft mb-1">Organization / Event (Optional)</label>
                  <input
                    value={achOrg}
                    onChange={(e) => setAchOrg(e.target.value)}
                    placeholder="e.g. Smart India Hackathon / LeetCode / College TechFest"
                    className="w-full rounded-xl border border-base bg-soft/50 px-4 py-2.5 outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-soft mb-1">Date (Optional)</label>
                  <input
                    value={achDate}
                    onChange={(e) => setAchDate(e.target.value)}
                    placeholder="e.g. 2026-07-15 or July 2026"
                    className="w-full rounded-xl border border-base bg-soft/50 px-4 py-2.5 text-xs outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-soft mb-1">Description (Optional)</label>
                  <textarea
                    rows={3}
                    value={achDesc}
                    onChange={(e) => setAchDesc(e.target.value)}
                    placeholder="Brief description of your accomplishment..."
                    className="w-full rounded-xl border border-base bg-soft/50 px-4 py-2.5 outline-none focus:border-primary resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-soft mb-1">Verification URL (Optional)</label>
                  <input
                    value={achUrl}
                    onChange={(e) => setAchUrl(e.target.value)}
                    placeholder="https://hackathon.com/winners/..."
                    className="w-full rounded-xl border border-base bg-soft/50 px-4 py-2.5 text-xs outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-soft mb-1">Certificate / Proof File (Optional)</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setAchProofFile(file);
                        setAchProofFileName(file.name);
                      }
                    }}
                    className="w-full rounded-xl border border-base bg-soft/50 px-3 py-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-warning/20 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-warning hover:file:bg-warning/30"
                  />
                  {achProofFileName && (
                    <p className="mt-1 text-xs text-warning font-medium flex items-center gap-1">
                      <FileCheck size={14} /> Attached: {achProofFileName}
                    </p>
                  )}
                </div>

                <GradientButton
                  onClick={handleSaveAchievement}
                  disabled={achSubmitting}
                  className="w-full py-3 mt-4"
                  icon={achSubmitting ? <Loader2 className="animate-spin" size={18} /> : undefined}
                >
                  {achSubmitting ? 'Saving Achievement...' : editingAchievement ? 'Update Achievement' : 'Add Achievement'}
                </GradientButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
