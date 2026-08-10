export type Role = 'student' | 'officer' | 'recruiter';
export type Theme = 'light' | 'dark';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  headline?: string;
  department?: string;
  cgpa?: number;
  graduationYear?: number;
}

export interface Company {
  id: string;
  name: string;
  logo: string;
  cover: string;
  industry: string;
  location: string;
  salary: string;
  hiring: boolean;
  openRoles: number;
  eligibility: string;
  deadlineDays: number;
  rating: number;
  size: string;
  culture: string[];
  benefits: string[];
  process: { step: string; detail: string }[];
  stats: { label: string; value: string }[];
  gallery: string[];
  employees: number;
}

export interface Job {
  id: string;
  companyId: string;
  company: string;
  logo: string;
  role: string;
  package: string;
  location: string;
  type: string;
  remote: boolean;
  requirements: string[];
  responsibilities: string[];
  eligibility: string;
  skills: string[];
  match: number;
  postedDays: number;
  deadline: string;
  description: string;
  redirectUrl?: string;
  title?: string;
  category?: string;
  contractType?: string;
  salaryMin?: number;
  salaryMax?: number;
  country?: string;
  defaultLogo?: string;
  source?: 'adzuna' | string;
  created?: string;
  salaryPredicted?: boolean;
  matchedSkills?: string[];
  missingSkills?: string[];
  matchReasons?: string[];
}

export interface Application {
  id: string;
  jobId: string;
  role: string;
  company: string;
  logo: string;
  stage: 'applied' | 'screening' | 'assessment' | 'technical' | 'hr' | 'offer' | 'joined';
  appliedDate: string;
  updatedDate: string;
  salary: string;
}

export interface Interview {
  id: string;
  role: string;
  company: string;
  logo: string;
  date: string;
  time: string;
  type: string;
  round: string;
  mode: 'online' | 'onsite';
  meetingLink?: string;
  location?: string;
  daysLeft: number;
  prep: { label: string; done: boolean }[];
}

export interface NotificationItem {
  id: string;
  type: 'interview' | 'deadline' | 'approval' | 'announcement' | 'application';
  title: string;
  body: string;
  time: string;
  read: boolean;
}

export interface ActivityItem {
  id: string;
  action: string;
  detail: string;
  time: string;
  icon: 'apply' | 'interview' | 'score' | 'save' | 'skill';
}

export interface SkillProgress {
  name: string;
  level: number;
  category: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
}
