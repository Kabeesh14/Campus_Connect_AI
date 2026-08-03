import type {
  Company, Job, Application, Interview, NotificationItem,
  ActivityItem, SkillProgress, User,
} from '../types';

export const companies: Company[] = [
  {
    id: 'c1', name: 'Google', logo: 'https://logo.clearbit.com/google.com',
    cover: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1200',
    industry: 'Technology', location: 'Mountain View, CA', salary: '$120K - $180K',
    hiring: true, openRoles: 12, eligibility: 'CGPA 7.5+', deadlineDays: 14,
    rating: 4.8, size: '100,000+', employees: 182000,
    culture: ['Innovation-first', 'Open collaboration', '20% time for passion projects'],
    benefits: ['Free meals', 'Health & wellness', 'Stock options', 'Education reimbursement'],
    process: [
      { step: 'Online Assessment', detail: 'DSA & reasoning, 90 min' },
      { step: 'Technical Round 1', detail: 'Data structures & algorithms' },
      { step: 'Technical Round 2', detail: 'System design' },
      { step: 'Googliness', detail: 'Behavioral & culture fit' },
      { step: 'Hiring Committee', detail: 'Final review' },
    ],
    stats: [
      { label: 'Offer Rate', value: '0.2%' }, { label: 'Avg Package', value: '$160K' },
      { label: 'Hired This Year', value: '8,500' }, { label: 'Years on Campus', value: '12' },
    ],
    gallery: [
      'https://images.pexels.com/photos/380769/pexels-photo-380769.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1170412/pexels-photo-1170412.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
  },
  {
    id: 'c2', name: 'Microsoft', logo: 'https://logo.clearbit.com/microsoft.com',
    cover: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=1200',
    industry: 'Technology', location: 'Redmond, WA', salary: '$110K - $165K',
    hiring: true, openRoles: 8, eligibility: 'CGPA 7.0+', deadlineDays: 21,
    rating: 4.6, size: '220,000+', employees: 221000,
    culture: ['Growth mindset', 'Inclusive culture', 'Hybrid work'],
    benefits: ['Hybrid work', 'Health coverage', '401k match', 'Volunteer hours'],
    process: [
      { step: 'Online Assessment', detail: 'Aptitude + DSA' },
      { step: 'Technical Interview', detail: '2 rounds, coding + design' },
      { step: 'AA Round', detail: 'As-As assessment' },
      { step: 'HR Round', detail: 'Behavioral' },
    ],
    stats: [
      { label: 'Offer Rate', value: '0.8%' }, { label: 'Avg Package', value: '$140K' },
      { label: 'Hired This Year', value: '12,000' }, { label: 'Years on Campus', value: '15' },
    ],
    gallery: [
      'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/380769/pexels-photo-380769.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
  },
  {
    id: 'c3', name: 'Amazon', logo: 'https://logo.clearbit.com/amazon.com',
    cover: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1200',
    industry: 'E-commerce / Cloud', location: 'Seattle, WA', salary: '$115K - $170K',
    hiring: true, openRoles: 15, eligibility: 'CGPA 7.0+', deadlineDays: 9,
    rating: 4.2, size: '1,500,000+', employees: 1525000,
    culture: ['Customer obsession', 'Bias for action', 'Ownership'],
    benefits: ['RSU grants', 'Sign-on bonus', 'Transit subsidy', 'Career choice'],
    process: [
      { step: 'Online Assessment', detail: 'Debugging + DSA, 2 problems' },
      { step: 'Technical Round 1', detail: 'Data structures' },
      { step: 'Technical Round 2', detail: 'System design' },
      { step: 'Leadership Principles', detail: 'Bar raiser round' },
    ],
    stats: [
      { label: 'Offer Rate', value: '1.5%' }, { label: 'Avg Package', value: '$145K' },
      { label: 'Hired This Year', value: '30,000' }, { label: 'Years on Campus', value: '10' },
    ],
    gallery: [
      'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1170412/pexels-photo-1170412.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
  },
  {
    id: 'c4', name: 'Zoho', logo: 'https://logo.clearbit.com/zoho.com',
    cover: 'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&cs=tinysrgb&w=1200',
    industry: 'SaaS', location: 'Chennai, India', salary: '₹6L - ₹12L',
    hiring: true, openRoles: 6, eligibility: 'CGPA 6.5+', deadlineDays: 18,
    rating: 4.4, size: '15,000+', employees: 15000,
    culture: ['Bootstrapped', 'No politics', 'Long-term growth'],
    benefits: ['Free food', 'Transport', 'In-house gym', 'Sabbatical'],
    process: [
      { step: 'Aptitude', detail: 'Quant + logical' },
      { step: 'Coding Test', detail: 'C/Java/Python' },
      { step: 'Technical', detail: '2 rounds' },
      { step: 'HR', detail: 'Final' },
    ],
    stats: [
      { label: 'Offer Rate', value: '3%' }, { label: 'Avg Package', value: '₹9L' },
      { label: 'Hired This Year', value: '1,200' }, { label: 'Years on Campus', value: '18' },
    ],
    gallery: [
      'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/380769/pexels-photo-380769.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
  },
  {
    id: 'c5', name: 'Atlassian', logo: 'https://logo.clearbit.com/atlassian.com',
    cover: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=1200',
    industry: 'SaaS / Dev Tools', location: 'Sydney, AU', salary: '$105K - $150K',
    hiring: true, openRoles: 4, eligibility: 'CGPA 7.5+', deadlineDays: 12,
    rating: 4.7, size: '11,000+', employees: 11000,
    culture: ['Open company', 'Build with heart', "Don't #@!% the customer"],
    benefits: ['Remote-first', 'Wellness budget', 'Charity match', 'Paid volunteer'],
    process: [
      { step: 'CodePair', detail: 'Live coding with engineer' },
      { step: 'System Design', detail: 'Scalable architecture' },
      { step: 'Values Interview', detail: 'Culture alignment' },
      { step: 'Manager Round', detail: 'Team fit' },
    ],
    stats: [
      { label: 'Offer Rate', value: '1.2%' }, { label: 'Avg Package', value: '$130K' },
      { label: 'Hired This Year', value: '600' }, { label: 'Years on Campus', value: '8' },
    ],
    gallery: [
      'https://images.pexels.com/photos/1170412/pexels-photo-1170412.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
  },
  {
    id: 'c6', name: 'Stripe', logo: 'https://logo.clearbit.com/stripe.com',
    cover: 'https://images.pexels.com/photos/3184392/pexels-photo-3184392.jpeg?auto=compress&cs=tinysrgb&w=1200',
    industry: 'Fintech', location: 'San Francisco, CA', salary: '$130K - $200K',
    hiring: true, openRoles: 7, eligibility: 'CGPA 8.0+', deadlineDays: 16,
    rating: 4.9, size: '8,000+', employees: 8000,
    culture: ['Users first', 'Move with urgency', 'High bar'],
    benefits: ['Equity', 'Premium healthcare', 'Learning stipend', 'Home office'],
    process: [
      { step: 'Recruiter Call', detail: '30 min screening' },
      { step: 'Technical', detail: 'Pair programming' },
      { step: 'System Design', detail: 'API + scale' },
      { step: 'Bar Raiser', detail: 'Cross-team' },
    ],
    stats: [
      { label: 'Offer Rate', value: '0.3%' }, { label: 'Avg Package', value: '$175K' },
      { label: 'Hired This Year', value: '400' }, { label: 'Years on Campus', value: '6' },
    ],
    gallery: [
      'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1170412/pexels-photo-1170412.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/3184392/pexels-photo-3184392.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
  },
];

export const jobs: Job[] = [
  {
    id: 'j1', companyId: 'c1', company: 'Google', logo: 'https://logo.clearbit.com/google.com',
    role: 'SWE Intern — Search', package: '$8,500/mo', location: 'Bangalore', type: 'Internship',
    remote: false,
    requirements: ['DSA proficiency', 'Python/Java/C++', 'System design basics', '3rd/4th year'],
    responsibilities: ['Build search ranking features', 'Optimize query latency', 'Write tests', 'Design reviews'],
    eligibility: 'CGPA 7.5+, CS/IT related branch', skills: ['Python', 'DSA', 'System Design', 'Go'],
    match: 92, postedDays: 3, deadline: '14 days left',
    description: 'Join the Search team to build ranking systems serving billions of queries daily.',
  },
  {
    id: 'j2', companyId: 'c2', company: 'Microsoft', logo: 'https://logo.clearbit.com/microsoft.com',
    role: 'Software Engineer II — Azure', package: '₹28L', location: 'Hyderabad', type: 'Full-time',
    remote: true,
    requirements: ['4+ years exp', 'C#/.NET or Go', 'Cloud fundamentals', 'Distributed systems'],
    responsibilities: ['Scale Azure compute', 'Improve reliability', 'On-call rotation', 'Mentor juniors'],
    eligibility: 'CGPA 7.0+, any CS branch', skills: ['C#', 'Azure', 'Kubernetes', 'Distributed Systems'],
    match: 85, postedDays: 5, deadline: '21 days left',
    description: 'Help build the infrastructure powering millions of cloud workloads worldwide.',
  },
  {
    id: 'j3', companyId: 'c3', company: 'Amazon', logo: 'https://logo.clearbit.com/amazon.com',
    role: 'SDE I — Retail', package: '₹24L', location: 'Chennai', type: 'Full-time',
    remote: false,
    requirements: ['DSA', 'Java', 'Problem solving', 'System design awareness'],
    responsibilities: ['Build checkout services', 'Own microservices', 'Deploy to production', 'Operate at scale'],
    eligibility: 'CGPA 7.0+, CS/IT/IS', skills: ['Java', 'AWS', 'Microservices', 'DSA'],
    match: 88, postedDays: 2, deadline: '9 days left',
    description: 'Deliver features used by hundreds of millions of Amazon retail customers.',
  },
  {
    id: 'j4', companyId: 'c4', company: 'Zoho', logo: 'https://logo.clearbit.com/zoho.com',
    role: 'Member Technical Staff', package: '₹9L', location: 'Chennai', type: 'Full-time',
    remote: false,
    requirements: ['Strong fundamentals', 'C/Java', 'DBMS', 'OS'],
    responsibilities: ['Build Zoho products', 'Own modules end-to-end', 'Write clean code'],
    eligibility: 'CGPA 6.5+, any branch', skills: ['Java', 'SQL', 'OOP', 'DBMS'],
    match: 76, postedDays: 7, deadline: '18 days left',
    description: 'Engineer products used by 80M+ users across the Zoho suite.',
  },
  {
    id: 'j5', companyId: 'c5', company: 'Atlassian', logo: 'https://logo.clearbit.com/atlassian.com',
    role: 'Frontend Engineer — Jira', package: '$120K', location: 'Remote', type: 'Full-time',
    remote: true,
    requirements: ['React expertise', 'TypeScript', 'Accessibility', '3+ years'],
    responsibilities: ['Build Jira board UX', 'Improve performance', 'Design system work', 'A11y audits'],
    eligibility: 'CGPA 7.5+, CS or related', skills: ['React', 'TypeScript', 'CSS', 'Accessibility'],
    match: 94, postedDays: 1, deadline: '12 days left',
    description: "Shape the experience of the world's most popular project tracker.",
  },
  {
    id: 'j6', companyId: 'c6', company: 'Stripe', logo: 'https://logo.clearbit.com/stripe.com',
    role: 'Backend Engineer — Payments', package: '$165K', location: 'Remote (US)', type: 'Full-time',
    remote: true,
    requirements: ['Distributed systems', 'API design', 'Strong testing', '5+ years'],
    responsibilities: ['Build payment APIs', 'Handle money safely', 'Improve uptime', 'Code reviews'],
    eligibility: 'CGPA 8.0+, CS or related', skills: ['Go', 'PostgreSQL', 'APIs', 'Distributed Systems'],
    match: 81, postedDays: 4, deadline: '16 days left',
    description: 'Move trillions of dollars reliably across the global Stripe network.',
  },
];

export const applications: Application[] = [
  { id: 'a1', jobId: 'j1', role: 'SWE Intern — Search', company: 'Google', logo: 'https://logo.clearbit.com/google.com', stage: 'technical', appliedDate: 'Jul 2', updatedDate: '2 days ago', salary: '$8,500/mo' },
  { id: 'a2', jobId: 'j3', role: 'SDE I — Retail', company: 'Amazon', logo: 'https://logo.clearbit.com/amazon.com', stage: 'assessment', appliedDate: 'Jul 8', updatedDate: '5 days ago', salary: '₹24L' },
  { id: 'a3', jobId: 'j5', role: 'Frontend Engineer — Jira', company: 'Atlassian', logo: 'https://logo.clearbit.com/atlassian.com', stage: 'screening', appliedDate: 'Jul 12', updatedDate: '1 day ago', salary: '$120K' },
  { id: 'a4', jobId: 'j4', role: 'Member Technical Staff', company: 'Zoho', logo: 'https://logo.clearbit.com/zoho.com', stage: 'offer', appliedDate: 'Jun 20', updatedDate: '1 week ago', salary: '₹9L' },
  { id: 'a5', jobId: 'j2', role: 'Software Engineer II', company: 'Microsoft', logo: 'https://logo.clearbit.com/microsoft.com', stage: 'hr', appliedDate: 'Jul 5', updatedDate: '3 days ago', salary: '₹28L' },
];

export const interviews: Interview[] = [
  {
    id: 'i1', role: 'SWE Intern', company: 'Google', logo: 'https://logo.clearbit.com/google.com',
    date: 'Jul 20', time: '10:00 AM', type: 'Technical', round: 'Round 2 — DSA',
    mode: 'online', meetingLink: 'https://meet.google.com/abc-defg-hij', daysLeft: 3,
    prep: [
      { label: 'Revise graphs & DP', done: true },
      { label: 'Solve 5 medium problems', done: true },
      { label: 'Review past projects', done: false },
      { label: 'Mock interview practice', done: false },
      { label: 'Prepare questions to ask', done: false },
    ],
  },
  {
    id: 'i2', role: 'SDE I', company: 'Amazon', logo: 'https://logo.clearbit.com/amazon.com',
    date: 'Jul 23', time: '2:00 PM', type: 'Assessment', round: 'Online Test',
    mode: 'online', meetingLink: 'https://amazon-test.com/session/xyz', daysLeft: 6,
    prep: [
      { label: 'Practice debugging problems', done: false },
      { label: 'Revise Java collections', done: true },
      { label: 'Time management drills', done: false },
    ],
  },
  {
    id: 'i3', role: 'Frontend Engineer', company: 'Atlassian', logo: 'https://logo.clearbit.com/atlassian.com',
    date: 'Jul 25', time: '11:30 AM', type: 'Screening', round: 'Recruiter Call',
    mode: 'online', meetingLink: 'https://zoom.us/j/1234567890', daysLeft: 8,
    prep: [
      { label: 'Review Atlassian values', done: false },
      { label: 'Prepare behavioral stories', done: false },
      { label: 'Research Jira product', done: true },
    ],
  },
];

export const notifications: NotificationItem[] = [
  { id: 'n1', type: 'interview', title: 'Interview Scheduled', body: 'Google technical round on Jul 20, 10:00 AM', time: '2h ago', read: false },
  { id: 'n2', type: 'approval', title: 'Application Shortlisted', body: 'Atlassian moved you to screening stage', time: '5h ago', read: false },
  { id: 'n3', type: 'deadline', title: 'Deadline Approaching', body: 'Amazon SDE I application closes in 9 days', time: '1d ago', read: false },
  { id: 'n4', type: 'announcement', title: 'New Company Onboarded', body: 'Stripe is now hiring on campus — 7 open roles', time: '2d ago', read: true },
  { id: 'n5', type: 'application', title: 'Offer Received', body: 'Congratulations! Zoho sent you an offer', time: '1w ago', read: true },
];

export const activities: ActivityItem[] = [
  { id: 'act1', action: 'Applied to', detail: 'Frontend Engineer — Atlassian', time: '1h ago', icon: 'apply' },
  { id: 'act2', action: 'Interview scheduled with', detail: 'Google — Technical Round 2', time: '3h ago', icon: 'interview' },
  { id: 'act3', action: 'ATS score improved', detail: '78% → 86% on latest resume', time: '1d ago', icon: 'score' },
  { id: 'act4', action: 'Saved company', detail: 'Stripe added to your watchlist', time: '2d ago', icon: 'save' },
  { id: 'act5', action: 'New skill added', detail: 'TypeScript — Intermediate', time: '3d ago', icon: 'skill' },
];

export const skillsProgress: SkillProgress[] = [
  { name: 'React', level: 85, category: 'Frontend' },
  { name: 'TypeScript', level: 72, category: 'Frontend' },
  { name: 'DSA', level: 68, category: 'Core' },
  { name: 'System Design', level: 54, category: 'Core' },
  { name: 'Python', level: 80, category: 'Backend' },
  { name: 'SQL', level: 64, category: 'Backend' },
];

export const demoUser: User = {
  id: 'u1', name: 'Student User', email: 'student@campus.edu',
  role: 'student',
  avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
  headline: 'Final Year • Computer Science',
  department: 'Computer Science & Engineering',
  cgpa: 8.5, graduationYear: 2026,
};

export const adminStats = {
  totalStudents: 4280,
  placedStudents: 3120,
  applications: 18650,
  companies: 142,
  placementRate: 73,
  avgPackage: 12.4,
  studentGrowth: [1800, 2400, 3100, 3700, 4280],
  monthlyApps: [820, 1100, 1450, 1280, 1620, 1850, 2100, 1980, 2200, 2400, 2680, 2820],
  departmentData: [
    { dept: 'CSE', placed: 920, total: 1100 },
    { dept: 'IT', placed: 780, total: 950 },
    { dept: 'ECE', placed: 610, total: 850 },
    { dept: 'EEE', placed: 420, total: 700 },
    { dept: 'MECH', placed: 230, total: 480 },
    { dept: 'CIVIL', placed: 160, total: 400 },
  ],
  topRecruiters: [
    { name: 'Amazon', hires: 480, logo: 'https://logo.clearbit.com/amazon.com' },
    { name: 'Google', hires: 320, logo: 'https://logo.clearbit.com/google.com' },
    { name: 'Microsoft', hires: 290, logo: 'https://logo.clearbit.com/microsoft.com' },
    { name: 'Zoho', hires: 250, logo: 'https://logo.clearbit.com/zoho.com' },
    { name: 'Atlassian', hires: 180, logo: 'https://logo.clearbit.com/atlassian.com' },
  ],
  heatmap: Array.from({ length: 7 * 18 }, (_, i) => ({
    day: Math.floor(i / 18), hour: i % 18,
    value: Math.floor(Math.random() * 5),
  })),
  recentActivity: [
    { user: 'Priya N.', action: 'received offer from', target: 'Google', time: '5m ago' },
    { user: 'Rahul K.', action: 'applied to', target: 'Amazon SDE I', time: '12m ago' },
    { user: 'Sneha R.', action: 'completed assessment for', target: 'Microsoft', time: '1h ago' },
    { user: 'Arjun M.', action: 'joined', target: 'Zoho', time: '2h ago' },
    { user: 'Divya S.', action: 'interview scheduled with', target: 'Stripe', time: '3h ago' },
  ],
};

export const testimonials = [
  { name: 'Priya Nair', role: 'SWE at Google', avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150', quote: 'The AI interview coach felt like having a senior engineer mentor me. I cracked Google on my first attempt.', rating: 5 },
  { name: 'Rahul Krishna', role: 'SDE at Amazon', avatar: 'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=150', quote: 'CampusConnect matched me with roles I actually fit. The ATS analyzer fixed my resume in minutes.', rating: 5 },
  { name: 'Sneha Reddy', role: 'Intern at Microsoft', avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150', quote: 'The application tracker kept me sane through 23 applications. I always knew exactly where I stood.', rating: 5 },
  { name: 'Arjun Menon', role: 'MTS at Zoho', avatar: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150', quote: 'Skill gap analysis told me exactly what to learn. No more guessing what recruiters want.', rating: 4 },
  { name: 'Divya Sharma', role: 'Frontend at Atlassian', avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150', quote: 'From a 62% resume to a 94% ATS score. This platform is genuinely the reason I got placed.', rating: 5 },
  { name: 'Karthik V.', role: 'Backend at Stripe', avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150', quote: 'The career advisor mapped out a 6-month plan that took me from average to Stripe-ready. Unreal.', rating: 5 },
];

export const faqs = [
  { q: 'How does the AI career advisor work?', a: 'It analyzes your profile, skills, target roles, and market demand to create a personalized roadmap with weekly milestones, recommended resources, and practice schedules.' },
  { q: 'Is my data secure?', a: 'Yes. We use end-to-end encryption for personal data and never share your information with recruiters without explicit consent. You control your privacy at every step.' },
  { q: 'Can placement officers track student progress?', a: 'Absolutely. Officers get a real-time analytics dashboard with placement rates, department-wise breakdowns, and individual student pipelines — all in one place.' },
  { q: 'How accurate is the ATS resume score?', a: 'Our analyzer is trained on real ATS parsing rules from 40+ enterprise systems. It checks keyword density, formatting, section structure, and role-specific signal matching.' },
  { q: 'Do recruiters get AI tools too?', a: 'Yes. Recruiters get AI-powered candidate ranking, skill matching, and bulk shortlisting to find the best-fit students in seconds instead of hours.' },
  { q: 'Is there a free tier for students?', a: 'Core features — profile, job search, application tracking, and basic AI analysis — are free for all students. Premium AI tools are available on the Pro plan.' },
];

export const trustedCompanies = [
  'Google', 'Microsoft', 'Amazon', 'Zoho', 'Atlassian', 'Stripe', 'Vercel', 'Supabase', 'Framer', 'Linear',
];
