import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain, FileText, MessageSquare, Target, TrendingUp, Sparkles,
  ArrowRight, Upload, FileCheck2, AlertTriangle, Lightbulb, BarChart3,
  Send, Zap, CheckCircle2, Award, Bot, User as UserIcon, Loader2, File,
  Copy, Check, Trash2, Code2, RefreshCw, Download, AlertCircle, ShieldAlert,
} from 'lucide-react';
import { GlassCard, Reveal, Badge, GradientButton, ProgressRing } from '../components/ui';
import { apiRequest } from '../utils/api';
import { cn } from '../utils/cn';
import type { ChatMessage } from '../types';

const aiTools = [
  { id: 'career-advisor', title: 'AI Career Advisor', desc: 'Personalized roadmap with weekly milestones.', icon: Brain, color: 'from-primary to-secondary', to: '/ai/career-advisor' },
  { id: 'resume', title: 'AI Resume Analyzer', desc: 'ATS scoring & keyword gap analysis.', icon: FileText, color: 'from-secondary to-accent', to: '/ai/resume' },
  { id: 'interview-coach', title: 'AI Interview Coach', desc: 'Conversational practice for any round.', icon: MessageSquare, color: 'from-accent to-primary', to: '/ai/interview-coach' },
  { id: 'skill-gap', title: 'AI Skill Gap Analysis', desc: 'Know exactly what to learn next.', icon: Target, color: 'from-primary to-accent', to: '/ai/skill-gap' },
  { id: 'placement', title: 'AI Placement Prediction', desc: 'Forecast your placement probability.', icon: TrendingUp, color: 'from-secondary to-primary', to: '/ai/career-advisor' },
  { id: 'jobs', title: 'AI Job Recommendation', desc: 'AI-ranked roles matched to you.', icon: Sparkles, color: 'from-accent to-secondary', to: '/jobs' },
];

const targetRolesList = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Java Developer',
  'Python Developer',
  'React Developer',
  'Node.js Developer',
  'AI Engineer',
  'Machine Learning Engineer',
  'Data Analyst',
  'Data Scientist',
  'Business Analyst',
  'Cloud Engineer',
  'DevOps Engineer',
  'Cybersecurity Analyst',
  'Network Engineer',
  'QA Engineer',
  'Automation Tester',
  'UI Designer',
  'UX Designer',
  'Product Manager',
  'Android Developer',
  'iOS Developer',
  'Flutter Developer',
  'Game Developer',
  'Embedded Engineer',
  'Blockchain Developer',
  'Site Reliability Engineer',
  'Database Administrator',
  'Solutions Architect',
  'Prompt Engineer',
];

export function AIHubPage() {
  return (
    <div className="space-y-6">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl gradient-border p-8">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <Badge variant="primary" className="mb-4"><Sparkles size={14} /> AI Engine</Badge>
            <h1 className="font-display text-3xl font-bold sm:text-4xl">AI Tools Hub</h1>
            <p className="mt-3 max-w-xl text-soft">Real Google Gemini 1.5 Flash models powered by your personalized student profile, working together to accelerate your journey from student to placed.</p>
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {aiTools.map((t, i) => (
          <Reveal key={t.id} delay={i * 0.06}>
            <Link to={t.to}>
              <GlassCard hover className="group h-full">
                <div className={`mb-5 inline-flex rounded-2xl bg-gradient-to-br ${t.color} p-3 text-white shadow-glow`}>
                  <t.icon size={24} />
                </div>
                <h3 className="font-display text-xl font-semibold">{t.title}</h3>
                <p className="mt-2 text-sm text-soft">{t.desc}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Launch <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </div>
              </GlassCard>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ---------- Formatted Message Component (Markdown & Code Blocks) ---------- */

function FormattedContent({ text }: { text: string }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 leading-relaxed">
      {parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n');
          const firstLine = lines[0].trim();
          const language = /^[a-zA-Z0-9_#-]+$/.test(firstLine) ? firstLine : 'code';
          const codeContent = language !== 'code' ? lines.slice(1).join('\n') : lines.join('\n');

          return (
            <div key={i} className="my-3 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 font-mono text-xs text-slate-100 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-2 text-slate-400">
                <span className="flex items-center gap-1.5 font-sans font-semibold capitalize text-indigo-400">
                  <Code2 size={14} /> {language}
                </span>
                <button onClick={() => copyCode(codeContent, i)} className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-sans font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
                  {copiedIndex === i ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  {copiedIndex === i ? 'Copied!' : 'Copy code'}
                </button>
              </div>
              <pre className="overflow-x-auto p-4 leading-relaxed font-mono text-[12.5px] text-indigo-100">
                <code>{codeContent}</code>
              </pre>
            </div>
          );
        }

        const paragraphs = part.split('\n');
        return (
          <div key={i} className="space-y-2">
            {paragraphs.map((line, pIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={pIdx} className="h-1" />;

              if (trimmed.startsWith('### ')) {
                return <h4 key={pIdx} className="mt-3 font-display text-base font-bold text-[rgb(var(--text))]">{trimmed.replace(/^###\s+/, '')}</h4>;
              }
              if (trimmed.startsWith('## ')) {
                return <h3 key={pIdx} className="mt-4 font-display text-lg font-bold text-[rgb(var(--text))]">{trimmed.replace(/^##\s+/, '')}</h3>;
              }
              if (trimmed.startsWith('# ')) {
                return <h2 key={pIdx} className="mt-4 font-display text-xl font-bold text-[rgb(var(--text))]">{trimmed.replace(/^#\s+/, '')}</h2>;
              }

              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                const listText = trimmed.replace(/^[-*]\s+/, '');
                return (
                  <div key={pIdx} className="flex items-start gap-2 pl-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{parseBold(listText)}</span>
                  </div>
                );
              }

              if (/^\d+\.\s/.test(trimmed)) {
                return (
                  <div key={pIdx} className="flex items-start gap-2 pl-2 font-medium">
                    <span className="text-primary font-bold">{trimmed.match(/^\d+\./)?.[0]}</span>
                    <span>{parseBold(trimmed.replace(/^\d+\.\s/, ''))}</span>
                  </div>
                );
              }

              return <p key={pIdx}>{parseBold(trimmed)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

function parseBold(text: string) {
  const parts = text.split(/(\*\*[\s\S]*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold text-[rgb(var(--text))]">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

/* ---------- ChatGPT-Style Modern Chat Interface ---------- */

function ChatInterface({ title, toolType, icon: Icon, systemMessage, suggestions, accent }: {
  title: string; toolType: string; icon: typeof Brain; systemMessage: string; suggestions: string[]; accent: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'm0', role: 'assistant', content: systemMessage, time: 'now' },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastFailedInput, setLastFailedInput] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await apiRequest(`/ai/history/${toolType}`);
        if (res.success && res.chats && res.chats.length > 0) {
          const loaded: ChatMessage[] = [
            { id: 'm0', role: 'assistant', content: systemMessage, time: 'start' },
          ];
          res.chats.forEach((c: Record<string, unknown>) => {
            loaded.push({ id: `u-${c.id}`, role: 'user', content: c.question as string, time: new Date(c.created_at as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
            loaded.push({ id: `a-${c.id}`, role: 'assistant', content: c.response as string, time: new Date(c.created_at as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
          });
          setMessages(loaded);
        }
      } catch {
        // Chat history loading is optional
      }
    }
    loadHistory();
  }, [toolType, systemMessage]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleClearChat = async () => {
    try {
      await apiRequest(`/ai/history/clear/${toolType}`, { method: 'DELETE' });
    } catch {
      // Ignored
    }
    setMessages([{ id: 'm0', role: 'assistant', content: systemMessage, time: 'now' }]);
    setErrorMsg(null);
  };

  const handleDeleteMessage = async (msgId: string) => {
    const rawId = msgId.replace(/^[ua]-/, '');
    setMessages((m) => m.filter((msg) => msg.id !== msgId));
    if (rawId && !rawId.startsWith('m0') && !rawId.startsWith('u-') && !rawId.startsWith('a-')) {
      try {
        await apiRequest(`/ai/history/item/${rawId}`, { method: 'DELETE' });
      } catch {
        // Ignored
      }
    }
  };

  const downloadHistoryAsPDF = () => {
    const chatText = messages.map((m) => `[${m.role.toUpperCase()}]\n${m.content}\n`).join('\n----------------------------------------\n\n');
    const blob = new Blob([`${title} - Conversation Export\nGenerated by CampusConnect AI\nDate: ${new Date().toLocaleString()}\n\n${chatText}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${toolType}-chat-export.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const send = async (text: string) => {
    if (!text.trim()) return;
    setErrorMsg(null);
    setLastFailedInput(null);
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text, time: 'now' };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setTyping(true);

    try {
      const endpoint = toolType === 'skill-gap' ? '/ai/skill-gap' : '/ai/chat';
      const body = toolType === 'skill-gap'
        ? { targetRole: text, company: 'Target Role Analysis' }
        : { message: text, toolType, systemInstruction: systemMessage };

      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const replyContent = res.reply || res.analysisText;

      if (res.success && replyContent) {
        const reply: ChatMessage = { id: `a-${Date.now()}`, role: 'assistant', content: replyContent, time: 'now' };
        setMessages((m) => [...m, reply]);
      } else {
        throw new Error(res.message || 'No response returned from Gemini.');
      }
    } catch (err: unknown) {
      const errorStr = (err as Error).message || 'Could not process AI request.';
      setErrorMsg(errorStr);
      setLastFailedInput(text);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`rounded-2xl bg-gradient-to-br ${accent} p-3 text-white shadow-glow`}><Icon size={28} /></div>
            <div>
              <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
              <p className="text-soft">Personalized with your profile & Google Gemini AI</p>
            </div>
          </div>
          <button onClick={downloadHistoryAsPDF} title="Download Conversation"
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-base bg-soft/50 px-3.5 py-2 text-xs font-semibold hover:border-primary/40 hover:bg-soft transition-colors">
            <Download size={14} className="text-primary" /> Export Chat
          </button>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="flex h-[620px] flex-col overflow-hidden rounded-3xl gradient-border">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-base px-5 py-3.5">
            <div className="flex items-center gap-2">
              <div className={`rounded-lg bg-gradient-to-br ${accent} p-1.5 text-white`}><Bot size={16} /></div>
              <span className="text-sm font-semibold">{title}</span>
              <span className="flex items-center gap-1 text-xs text-success"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Live Gemini</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleClearChat} className="btn-ghost flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-soft hover:text-danger">
                <Trash2 size={14} /> Clear Chat
              </button>
              <Badge variant="primary"><Sparkles size={12} /> Gemini-1.5-Flash</Badge>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto p-5 scrollbar-thin">
            {messages.map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={cn('group flex gap-3', m.role === 'user' && 'flex-row-reverse')}>
                <div className={cn('h-9 w-9 shrink-0 rounded-xl p-2', m.role === 'assistant' ? `bg-gradient-to-br ${accent} text-white` : 'bg-soft text-soft')}>
                  {m.role === 'assistant' ? <Bot size={18} /> : <UserIcon size={18} />}
                </div>
                <div className="relative max-w-[82%]">
                  <div className={cn('rounded-2xl p-4 text-sm shadow-soft-sm', m.role === 'assistant' ? 'bg-soft/60 text-[rgb(var(--text))]' : 'bg-gradient-to-br from-primary to-secondary text-white')}>
                    <FormattedContent text={m.content} />
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 px-1 text-[11px] text-soft">
                    <span>{m.time}</span>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {m.role === 'assistant' && (
                        <button onClick={() => handleCopyMessage(m.content, m.id)} title="Copy message" className="hover:text-primary">
                          {copiedMsgId === m.id ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                        </button>
                      )}
                      {m.id !== 'm0' && (
                        <button onClick={() => handleDeleteMessage(m.id)} title="Delete message" className="hover:text-danger">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Typing Indicator */}
            {typing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${accent} p-2 text-white`}><Bot size={18} /></div>
                <div className="flex items-center gap-3 rounded-2xl bg-soft/60 px-4 py-3 text-xs text-soft font-medium">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:0.2s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:0.4s]" />
                  </div>
                  <span>AI is thinking & analyzing your request...</span>
                </div>
              </motion.div>
            )}

            {/* Error Message & Retry */}
            {errorMsg && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between rounded-2xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
                {lastFailedInput && (
                  <button onClick={() => send(lastFailedInput)} className="flex items-center gap-1 rounded-xl bg-danger px-3 py-1.5 font-semibold text-white hover:bg-danger/90">
                    <RefreshCw size={12} /> Retry
                  </button>
                )}
              </motion.div>
            )}
            <div ref={endRef} />
          </div>

          {/* Suggestions */}
          <div className="flex gap-2 overflow-x-auto border-t border-base p-3 scrollbar-none">
            {suggestions.map((s) => (
              <button key={s} onClick={() => send(s)}
                className="shrink-0 rounded-xl border border-base bg-soft/40 px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary/40 hover:bg-soft">
                {s}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="flex gap-2 border-t border-base p-3">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send(input)}
              placeholder="Ask coding doubts (SQL, Python, Java, Power BI), career, or resume tips..."
              className="flex-1 rounded-xl border border-base bg-soft/40 px-4 py-2.5 text-sm text-[rgb(var(--text))] placeholder:text-soft outline-none focus:border-primary" />
            <button onClick={() => send(input)} disabled={typing} className="rounded-xl bg-gradient-to-br from-primary to-secondary px-4 py-2.5 text-white shadow-glow transition-all hover:scale-105 active:scale-95 disabled:opacity-50">
              {typing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

export function CareerAdvisorPage() {
  return (
    <ChatInterface
      title="AI Career Advisor"
      toolType="career-advisor"
      icon={Brain}
      accent="from-primary to-secondary"
      systemMessage="Hello! I'm your AI Placement & Career Advisor. Ask me anything about engineering placement roadmaps, technical skill preparation, coding doubts (SQL, Python, Java, Power BI), project recommendations, or recruiter strategies."
      suggestions={[
        'Write SQL query for top 5 department CGPAs',
        'Python code for placement data analytics',
        'Create a 4-week SDE prep plan',
        'Java code for Two Sum problem',
        'Power BI DAX measure for placement rate',
      ]}
    />
  );
}

export function InterviewCoachPage() {
  return (
    <ChatInterface
      title="AI Interview Coach"
      toolType="interview-coach"
      icon={MessageSquare}
      accent="from-accent to-primary"
      systemMessage="Welcome to your AI Interview Coach! I simulate technical, system design, and behavioral rounds. Tell me which company and role you're preparing for, and let's start a mock interview!"
      suggestions={[
        'Start a Google technical mock',
        'Practice system design for Amazon',
        'Behavioral round for Atlassian',
        'Give me a hard DSA problem',
      ]}
    />
  );
}

export function SkillGapPage() {
  return (
    <ChatInterface
      title="AI Skill Gap Analysis"
      toolType="skill-gap"
      icon={Target}
      accent="from-primary to-accent"
      systemMessage="Welcome to Skill Gap Analysis! Tell me your target company or job role (e.g. SDE at Microsoft, Frontend Engineer at Uber), and I will compare your logged-in profile against job requirements to detect gaps and create a custom learning roadmap."
      suggestions={[
        'Microsoft SDE-1',
        'Google Backend Developer',
        'Uber Frontend Engineer',
        'Amazon Data Scientist',
      ]}
    />
  );
}

/* ---------- Resume Analyzer ---------- */

export function ResumeAnalyzerPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analyzed, setAnalyzed] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileValidationError, setFileValidationError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState('Full Stack Developer');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [extractedDetails, setExtractedDetails] = useState<any>(null);

  const [analysisData, setAnalysisData] = useState<{
    resumeScore: number;
    atsScore: number;
    grammarScore: number;
    industryMatch: number;
    missingSkills: string[];
    strengths: string[];
    weaknesses: string[];
    resumeSummary: string;
    improvementTips: string[];
    keywordAnalysis?: { presentKeywords: string[]; missingKeywords: string[] };
    atsCompatibility?: string;
    formattingFeedback?: string[];
    actionVerbs?: string[];
    recommendedProjects?: string[];
    recommendedCertifications?: string[];
  } | null>(null);

  const validateFile = (file: File): boolean => {
    setFileValidationError(null);
    const allowedExts = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png'];
    const fileName = file.name.toLowerCase();
    const isAllowedExt = allowedExts.some((ext) => fileName.endsWith(ext));

    if (!isAllowedExt) {
      setFileValidationError(`Invalid file format "${file.name}". Acceptable formats are PDF (.pdf), Word (.docx), and Image (.jpg, .png). Compressed files (ZIP, EXE) are prohibited.`);
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileValidationError('File size exceeds maximum limit of 10MB.');
      return false;
    }

    return true;
  };

  const uploadAndAnalyze = async (file: File) => {
    if (!validateFile(file)) return;

    // Reset previous analysis state to prevent caching
    setSelectedFile(file);
    setAnalysisData(null);
    setExtractedDetails(null);
    setAnalyzing(true);
    setFileValidationError(null);

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('targetRole', targetRole);

    try {
      const res = await apiRequest('/ai/resume/analyze', {
        method: 'POST',
        body: formData,
      });

      if (res.success && res.analysis) {
        setExtractedDetails(res.extractedInfo);
        setAnalysisData({
          resumeScore: res.analysis.resumeScore || res.analysis.atsScore || 85,
          atsScore: res.analysis.atsScore || 80,
          grammarScore: res.analysis.grammarScore || 90,
          industryMatch: res.analysis.industryMatch || 85,
          missingSkills: res.analysis.missingSkills || [],
          strengths: res.analysis.strengths || [],
          weaknesses: res.analysis.weaknesses || [],
          resumeSummary: res.analysis.resumeSummary || 'Resume evaluated by Gemini ATS Engine.',
          improvementTips: res.analysis.improvementTips || [],
          keywordAnalysis: res.analysis.keywordAnalysis,
          atsCompatibility: res.analysis.atsCompatibility,
          formattingFeedback: res.analysis.formattingFeedback,
          actionVerbs: res.analysis.actionVerbs,
          recommendedProjects: res.analysis.recommendedProjects,
          recommendedCertifications: res.analysis.recommendedCertifications,
        });
        setAnalyzed(true);
      } else {
        throw new Error(res.message || 'Gemini resume analysis failed.');
      }
    } catch (err: unknown) {
      setFileValidationError((err as Error).message || 'Failed to parse resume document.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleResetUpload = () => {
    setAnalyzed(false);
    setAnalysisData(null);
    setExtractedDetails(null);
    setSelectedFile(null);
    setFileValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadAndAnalyze(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadAndAnalyze(e.dataTransfer.files[0]);
    }
  };

  const downloadAnalysisReport = () => {
    if (!analysisData) return;
    const report = `CAMPUS CONNECT AI RESUME ANALYSIS REPORT
Document: ${selectedFile?.name || 'Resume'}
Target Position: ${targetRole}
Generated On: ${new Date().toLocaleString()}

--------------------------------------------------
SCORES
--------------------------------------------------
Resume Score: ${analysisData.resumeScore}%
ATS Score: ${analysisData.atsScore}%
Industry Match: ${analysisData.industryMatch}%
Grammar & Syntax: ${analysisData.grammarScore}%

--------------------------------------------------
EXECUTIVE SUMMARY
--------------------------------------------------
${analysisData.resumeSummary}

--------------------------------------------------
DETECTED MISSING SKILLS
--------------------------------------------------
${analysisData.missingSkills.join(', ') || 'None detected'}

--------------------------------------------------
RESUME STRENGTHS
--------------------------------------------------
${analysisData.strengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}

--------------------------------------------------
WEAKNESSES & FORMATTING ISSUES
--------------------------------------------------
${(analysisData.weaknesses || analysisData.formattingFeedback || []).map((w, i) => `${i + 1}. ${w}`).join('\n')}

--------------------------------------------------
RECOMMENDED IMPROVEMENTS
--------------------------------------------------
${analysisData.improvementTips.map((t, i) => `${i + 1}. ${t}`).join('\n')}
`;
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume-analysis-report-${targetRole.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const scores = analysisData ? [
    { label: 'Resume Score', value: analysisData.resumeScore, icon: FileCheck2, color: 'from-primary to-secondary' },
    { label: 'ATS Score', value: analysisData.atsScore, icon: Award, color: 'from-secondary to-accent' },
    { label: 'Industry Match', value: analysisData.industryMatch, icon: BarChart3, color: 'from-accent to-primary' },
    { label: 'Grammar', value: analysisData.grammarScore, icon: CheckCircle2, color: 'from-success to-accent' },
  ] : [];

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-secondary to-accent p-3 text-white shadow-glow"><FileText size={28} /></div>
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">AI Resume Analyzer</h1>
            <p className="text-soft">Upload your actual resume file (PDF, DOCX, JPG, PNG) for real server-side parsing & Gemini ATS analysis.</p>
          </div>
        </div>
      </Reveal>

      {!analyzed && (
        <Reveal delay={0.05}>
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="text-sm font-semibold text-soft">Target Position / Role:</label>
              <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)}
                className="rounded-xl border border-base bg-[rgb(var(--card))] text-[rgb(var(--text))] px-4 py-2 text-sm outline-none focus:border-primary shadow-soft-sm">
                {targetRolesList.map((role) => (
                  <option key={role} value={role} className="bg-[rgb(var(--card))] text-[rgb(var(--text))]">
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <input type="file" ref={fileInputRef} accept=".pdf,.docx,.doc,.jpg,.jpeg,.png" onChange={handleFileSelect} className="hidden" />

            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn('cursor-pointer rounded-3xl border-2 border-dashed p-12 text-center transition-all hover:border-primary/60 hover:bg-primary/5',
                dragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-base bg-soft/40')}
            >
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}
                className="mx-auto mb-6 w-fit rounded-2xl bg-gradient-to-br from-primary to-secondary p-5 text-white shadow-glow">
                <Upload size={36} />
              </motion.div>

              {selectedFile ? (
                <div className="mb-4 inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                  <File size={16} /> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                </div>
              ) : (
                <>
                  <h3 className="font-display text-xl font-semibold">Click to choose or drag & drop your resume</h3>
                  <p className="mt-2 text-sm text-soft">Supports PDF, DOCX, JPG, and PNG documents up to 10MB</p>
                </>
              )}

              <div className="mt-6 flex justify-center">
                {analyzing ? (
                  <div className="flex items-center gap-2 rounded-xl bg-soft px-6 py-3 text-sm font-semibold text-primary">
                    <Loader2 size={18} className="animate-spin" /> Extracting Resume & Analyzing with Gemini ATS...
                  </div>
                ) : (
                  <div onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                    <GradientButton icon={<Zap size={18} />} className="px-8 py-3.5">
                      {selectedFile ? 'Analyze Selected Resume' : 'Select Resume File'}
                    </GradientButton>
                  </div>
                )}
              </div>
            </div>

            {/* Validation Alert */}
            {fileValidationError && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-xs font-semibold text-danger">
                <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-sm mb-0.5">File Validation Error</h5>
                  <p className="font-normal">{fileValidationError}</p>
                </div>
              </motion.div>
            )}
          </div>
        </Reveal>
      )}

      {analyzed && analysisData && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-base bg-soft/40 p-4">
              <div className="flex items-center gap-3">
                <File size={20} className="text-primary" />
                <div>
                  <h4 className="font-semibold">{selectedFile?.name || 'Uploaded_Resume.pdf'}</h4>
                  <p className="text-xs text-soft">Analyzed for <span className="font-bold text-[rgb(var(--text))]">{targetRole}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={downloadAnalysisReport} className="flex items-center gap-1.5 rounded-xl border border-base bg-soft px-3 py-2 text-xs font-semibold hover:border-primary/40">
                  <Download size={14} className="text-primary" /> Download Report
                </button>
                <GradientButton onClick={handleResetUpload} icon={<Upload size={16} />} className="py-2 px-4 text-xs">
                  Upload Different Resume
                </GradientButton>
              </div>
            </div>

            {/* Extracted Details Banner */}
            {extractedDetails && (
              <Reveal delay={0.03}>
                <GlassCard className="border-primary/20">
                  <h4 className="font-display text-sm font-semibold text-primary mb-3">Extracted Resume Profile Data</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div><span className="text-soft">Name:</span> <strong className="text-[rgb(var(--text))]">{extractedDetails.name}</strong></div>
                    <div><span className="text-soft">Email:</span> <strong className="text-[rgb(var(--text))]">{extractedDetails.email || 'Not detected'}</strong></div>
                    <div><span className="text-soft">Phone:</span> <strong className="text-[rgb(var(--text))]">{extractedDetails.phone || 'Not detected'}</strong></div>
                    <div className="sm:col-span-3"><span className="text-soft">Detected Technologies:</span> <strong className="text-primary">{extractedDetails.skills?.join(', ') || 'Scanning skills...'}</strong></div>
                  </div>
                </GlassCard>
              </Reveal>
            )}

            {/* Dynamic Gemini Score rings */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {scores.map((s, i) => (
                <Reveal key={s.label} delay={i * 0.08}>
                  <GlassCard className="flex flex-col items-center text-center">
                    <ProgressRing value={s.value} size={120} label={s.label} />
                    <div className="mt-3 flex items-center gap-1.5 text-sm text-soft">
                      <s.icon size={15} className="text-primary" /> {s.label}
                    </div>
                  </GlassCard>
                </Reveal>
              ))}
            </div>

            {/* Executive Summary */}
            {analysisData.resumeSummary && (
              <Reveal delay={0.09}>
                <GlassCard>
                  <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                    <Sparkles size={18} className="text-primary" /> Executive ATS Summary
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-soft">{analysisData.resumeSummary}</p>
                </GlassCard>
              </Reveal>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Missing skills */}
              <Reveal delay={0.1}>
                <GlassCard>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={20} className="text-warning" />
                    <h3 className="font-display text-lg font-semibold">Detected Missing Skills</h3>
                  </div>
                  <p className="mt-2 text-sm text-soft">Add these missing keywords to improve match for {targetRole}:</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {analysisData.missingSkills.length > 0 ? (
                      analysisData.missingSkills.map((s) => (
                        <span key={s} className="rounded-xl border border-warning/20 bg-warning/10 px-3.5 py-1.5 text-sm font-semibold text-warning">{s}</span>
                      ))
                    ) : (
                      <span className="text-xs text-soft">No critical missing skills detected. Excellent match!</span>
                    )}
                  </div>
                </GlassCard>
              </Reveal>

              {/* Strengths */}
              <Reveal delay={0.15}>
                <GlassCard>
                  <div className="flex items-center gap-2">
                    <Sparkles size={20} className="text-primary" />
                    <h3 className="font-display text-lg font-semibold">Strengths & Keywords</h3>
                  </div>
                  <p className="mt-2 text-sm text-soft">Detected resume strengths:</p>
                  <div className="mt-3 space-y-2">
                    {analysisData.strengths.map((str, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-[rgb(var(--text))]">
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" />
                        <span>{str}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </Reveal>
            </div>

            {/* Improvement Tips */}
            <Reveal delay={0.2}>
              <GlassCard>
                <div className="flex items-center gap-2">
                  <Lightbulb size={20} className="text-accent" />
                  <h3 className="font-display text-lg font-semibold">Gemini Improvement Recommendations</h3>
                </div>
                <div className="mt-4 space-y-3">
                  {analysisData.improvementTips.map((t, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl border border-base bg-soft/40 p-3.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary text-xs font-bold text-white">{i + 1}</span>
                      <p className="text-sm">{t}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </Reveal>

            {/* Recommended Projects & Certifications */}
            {(analysisData.recommendedProjects || analysisData.recommendedCertifications) && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {analysisData.recommendedProjects && (
                  <Reveal delay={0.25}>
                    <GlassCard>
                      <h4 className="font-display text-base font-semibold text-primary mb-3">Recommended Target Projects</h4>
                      <ul className="space-y-2 text-xs">
                        {analysisData.recommendedProjects.map((p, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="font-bold text-primary">•</span> <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </GlassCard>
                  </Reveal>
                )}
                {analysisData.recommendedCertifications && (
                  <Reveal delay={0.28}>
                    <GlassCard>
                      <h4 className="font-display text-base font-semibold text-secondary mb-3">Recommended Certifications</h4>
                      <ul className="space-y-2 text-xs">
                        {analysisData.recommendedCertifications.map((c, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="font-bold text-secondary">•</span> <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </GlassCard>
                  </Reveal>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
