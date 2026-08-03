import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import LandingPage from './pages/LandingPage';
import { LoginPage, SignupPage, ForgotPasswordPage } from './pages/AuthPages';
import { Loader2 } from 'lucide-react';
import type { Role } from './types';

// Lazy Loaded Heavy Page Modules
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ApplicationsPage = lazy(() => import('./pages/ApplicationsPage'));
const InterviewsPage = lazy(() => import('./pages/InterviewsPage'));
const ResumeBuilderPage = lazy(() => import('./pages/ResumeBuilderPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

const CompaniesPage = lazy(() => import('./pages/CompaniesPage').then((m) => ({ default: m.CompaniesPage })));
const CompanyDetailPage = lazy(() => import('./pages/CompaniesPage').then((m) => ({ default: m.CompanyDetailPage })));
const JobsPage = lazy(() => import('./pages/JobsPage').then((m) => ({ default: m.JobsPage })));
const JobDetailPage = lazy(() => import('./pages/JobsPage').then((m) => ({ default: m.JobDetailPage })));
const AIHubPage = lazy(() => import('./pages/AIPages').then((m) => ({ default: m.AIHubPage })));
const CareerAdvisorPage = lazy(() => import('./pages/AIPages').then((m) => ({ default: m.CareerAdvisorPage })));
const ResumeAnalyzerPage = lazy(() => import('./pages/AIPages').then((m) => ({ default: m.ResumeAnalyzerPage })));
const InterviewCoachPage = lazy(() => import('./pages/AIPages').then((m) => ({ default: m.InterviewCoachPage })));
const SkillGapPage = lazy(() => import('./pages/AIPages').then((m) => ({ default: m.SkillGapPage })));

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex items-center gap-3 rounded-2xl border border-base bg-card p-6 shadow-xl backdrop-blur-xl">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-sm font-semibold text-soft">Loading module...</span>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function RoleBasedDashboard() {
  const { user } = useAuth();
  if (user?.role === 'recruiter' || user?.role === 'officer') {
    return <AdminDashboard />;
  }
  return <StudentDashboard />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<RoleBasedDashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/companies/:id" element={<CompanyDetailPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/interviews" element={<InterviewsPage />} />
          <Route path="/ai" element={<AIHubPage />} />
          <Route path="/ai/career-advisor" element={<CareerAdvisorPage />} />
          <Route path="/ai/resume" element={<ResumeAnalyzerPage />} />
          <Route path="/resume-builder" element={<ResumeBuilderPage />} />
          <Route path="/ai/interview-coach" element={<InterviewCoachPage />} />
          <Route path="/ai/skill-gap" element={<SkillGapPage />} />
          <Route path="/admin" element={<ProtectedRoute roles={['officer', 'recruiter']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
