import {WorkflowPage} from './pages/workflows/WorkflowPage';
import React, { useState, useEffect } from 'react';
import { LoginPage } from './pages/auth/LoginPage';
import { AccountsPage } from './pages/auth/AccountsPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OfflineProvider } from './context/OfflineContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/admin/Dashboard';
import { MarkAttendance } from './pages/faculty/MarkAttendance';
import { DefaultersScreen } from './pages/defaulters/DefaultersScreen';
import { AcademicCalendar } from './pages/calendar/AcademicCalendar';
import { StudentsManagement } from './pages/students/StudentsManagement';
import { AuditTrail } from './pages/attendance/AuditTrail';
import { StudentPortal } from './pages/student/StudentPortal';
import { FaceEnrollment } from './pages/students/FaceEnrollment';
import { EnrolledFaces } from './pages/students/EnrolledFaces';
import { SmartAttendance } from './pages/attendance/SmartAttendance';
import { StudentListPage } from './pages/students/StudentListPage';
import { StudentAttendanceProfile } from './pages/students/StudentAttendanceProfile';
import { SettingsModal } from './components/admin/SettingsModal';
import { Smartphone, RotateCcw } from 'lucide-react';

const pathToTab: Record<string, string> = {
 '/leave':'leave', '/complaints':'complaints', '/reports':'reports', '/discipline':'discipline',
  '/accounts': 'accounts',
  '/dashboard': 'dashboard',
  '/admin': 'dashboard',
  '/students': 'students',
  '/students/list': 'student-list',
  '/student-list': 'student-list',
  '/students/enroll': 'enroll',
  '/face-enrollment': 'enroll',
  '/students/enrolled-faces': 'enrolled-faces',
  '/enrolled-faces': 'enrolled-faces',
  '/face-settings': 'face-settings',
  '/attendance': 'mark-attendance',
  '/attendance/mark': 'mark-attendance',
  '/manual-attendance': 'mark-attendance',
  '/attendance/smart': 'smart-attendance',
  '/smart-attendance': 'smart-attendance',
  '/attendance/audit': 'audit',
  '/audit-trail': 'audit',
  '/defaulters': 'defaulters',
  '/defaulter-list': 'defaulters',
  '/calendar': 'calendar',
  '/academic-calendar': 'calendar',
  '/student-portal': 'student-portal',
  '/my-attendance': 'my-attendance',
  '/my-profile': 'student-portal',
};

const tabToPath: Record<string, string> = {
 'leave':'/leave', 'complaints':'/complaints', 'reports':'/reports', 'discipline':'/discipline',
  'accounts': '/accounts',
  'dashboard': '/dashboard',
  'students': '/students',
  'student-list': '/students/list',
  'enroll': '/students/enroll',
  'enrolled-faces': '/students/enrolled-faces',
  'mark-attendance': '/attendance/mark',
  'smart-attendance': '/attendance/smart',
  'audit': '/attendance/audit',
  'defaulters': '/defaulters',
  'calendar': '/calendar',
  'student-portal': '/student-portal',
  'my-attendance': '/my-attendance',
};

export const isTabAllowedForRole = (tab: string, userRole: string): boolean => {
  if (userRole === 'ADMIN') {
    return true; // Admin has full access
  }
  if ((userRole === 'FACULTY' || userRole === 'HOD')) {
    const adminOnlyTabs = ['accounts', 'students', 'enroll', 'enrolled-faces', 'face-settings', 'audit'];
    return !adminOnlyTabs.includes(tab);
  }
  if (userRole === 'STUDENT') {
    const studentAllowedTabs = ['student-portal', 'dashboard', 'my-attendance', 'calendar', 'student-profile','leave','complaints','reports'];
    return studentAllowedTabs.includes(tab);
  }
  return false;
};

const resolveTabAndParams = (pathname: string, userRole: string, userStudentId?: string) => {
  const match = pathname.match(/^\/students\/([^/]+)\/attendance$/);
  let resolvedTab: string;
  let studentId: string | null = null;

  if (match) {
    resolvedTab = 'student-profile';
    studentId = match[1];
  } else {
    resolvedTab = pathToTab[pathname] || (userRole === 'STUDENT' ? 'student-portal' : 'dashboard');
  }

  // Security check: If student enters an admin/faculty path, deny access & redirect to student dashboard
  if (userRole === 'STUDENT') {
    if (!isTabAllowedForRole(resolvedTab, 'STUDENT')) {
      return { tab: 'student-portal', studentId: userStudentId || 'stud-23etc01', redirected: true };
    }
    // Prevent student from accessing another student's attendance records
    if (resolvedTab === 'student-profile' && userStudentId && studentId !== userStudentId) {
      return { tab: 'my-attendance', studentId: userStudentId, redirected: true };
    }
  } else if ((userRole === 'FACULTY' || userRole === 'HOD')) {
    if (!isTabAllowedForRole(resolvedTab, 'FACULTY')) {
      return { tab: 'dashboard', studentId: null, redirected: true };
    }
  }

  return { tab: resolvedTab, studentId, redirected: false };
};

const MainLayout: React.FC = () => {
  const { role, user, isLoading } = useAuth();
  
  const currentStudentId = user?.student_id || 'stud-23etc01';
  const initial = resolveTabAndParams(window.location.pathname, role, currentStudentId);

  const [activeTab, setActiveTab] = useState<string>(initial.tab);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    initial.studentId || currentStudentId
  );
  const [isMobileSimulated, setIsMobileSimulated] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Sync state with browser URL history and enforce role permissions
  const navigateTo = (tab: string, customPath?: string, studentIdParam?: string) => {
    setIsMobileMenuOpen(false);
    // If not allowed for current role, deny access and redirect
    if (!isTabAllowedForRole(tab, role)) {
      if (role === 'STUDENT') {
        setActiveTab('student-portal');
        window.history.replaceState(null, '', '/student-portal');
        return;
      }
      setActiveTab('dashboard');
      window.history.replaceState(null, '', '/dashboard');
      return;
    }

    if (tab === 'face-settings') {
      if (role === 'ADMIN') {
        setIsSettingsOpen(true);
      }
      return;
    }

    setActiveTab(tab);
    if (studentIdParam) {
      setSelectedStudentId(studentIdParam);
    }
    const targetPath =
      customPath ||
      (tab === 'student-profile' && (studentIdParam || selectedStudentId)
        ? `/students/${studentIdParam || selectedStudentId}/attendance`
        : tabToPath[tab] || (role === 'STUDENT' ? '/student-portal' : '/dashboard'));

    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  // Listen to browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const { tab, studentId, redirected } = resolveTabAndParams(
        window.location.pathname,
        role,
        currentStudentId
      );
      if (redirected) {
        window.history.replaceState(null, '', tabToPath[tab] || '/student-portal');
      }
      setActiveTab(tab);
      if (studentId) {
        setSelectedStudentId(studentId);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [role, currentStudentId]);

  // When role changes, switch view gracefully and enforce permissions
  useEffect(() => {
    if (isLoading) return;
    const { tab, studentId, redirected } = resolveTabAndParams(
      window.location.pathname,
      role,
      currentStudentId
    );
    if (!isTabAllowedForRole(activeTab, role) || redirected) {
      const fallbackTab = role === 'STUDENT' ? 'student-portal' : 'dashboard';
      setActiveTab(fallbackTab);
      window.history.replaceState(null, '', tabToPath[fallbackTab]);
    } else {
      setActiveTab(tab);
      if (studentId) setSelectedStudentId(studentId);
    }
  }, [role, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center font-sans">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 font-bold text-white shadow-xl shadow-blue-950/50 animate-pulse text-xl">
          Z
        </div>
        <p className="mt-4 text-sm font-semibold text-white">Zeal College Attendance System</p>
        <p className="text-xs text-slate-400">Loading MSBTE E&TC Portal...</p>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const renderContent = () => {
    switch (activeTab) {
 case 'leave': case 'complaints': case 'reports': case 'discipline': return <WorkflowPage key={activeTab} kind={activeTab} />;
      case 'accounts': return <AccountsPage />;
      case 'dashboard':
        return role === 'STUDENT' ? <StudentPortal /> : <Dashboard onNavigate={navigateTo} />;
      case 'mark-attendance':
        return <MarkAttendance />;
      case 'smart-attendance':
        return <SmartAttendance />;
      case 'defaulters':
        return <DefaultersScreen />;
      case 'calendar':
        return <AcademicCalendar />;
      case 'students':
        return <StudentsManagement />;
      case 'student-list':
        return (
          <StudentListPage
            onSelectStudent={(sId) => {
              setSelectedStudentId(sId);
              navigateTo('student-profile', `/students/${sId}/attendance`, sId);
            }}
          />
        );
      case 'student-profile':
        return (
          <StudentAttendanceProfile
            studentId={selectedStudentId || currentStudentId}
            onBack={() => navigateTo(role === 'STUDENT' ? 'student-portal' : 'student-list', role === 'STUDENT' ? '/student-portal' : '/students/list')}
            onNavigateDashboard={() => navigateTo(role === 'STUDENT' ? 'student-portal' : 'dashboard')}
          />
        );
      case 'my-attendance':
        return (
          <StudentAttendanceProfile
            studentId={currentStudentId}
            onBack={() => navigateTo('student-portal', '/student-portal')}
            onNavigateDashboard={() => navigateTo('student-portal')}
          />
        );
      case 'enroll':
        return <FaceEnrollment />;
      case 'enrolled-faces':
        return <EnrolledFaces />;
      case 'audit':
        return <AuditTrail />;
      case 'student-portal':
        return <StudentPortal />;
      default:
        return role === 'STUDENT' ? <StudentPortal /> : <Dashboard onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans w-full max-w-full overflow-x-hidden">
      {/* Dark near-black Navbar */}
      <Navbar
        isMobileSimulated={isMobileSimulated}
        setIsMobileSimulated={setIsMobileSimulated}
        openSettings={() => setIsSettingsOpen(true)}
        onNavigate={navigateTo}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <div className="flex flex-1 overflow-hidden relative w-full max-w-full">
        {/* Dark near-black Sidebar on desktop view & mobile drawer on small screens */}
        {!isMobileSimulated && (
          <Sidebar
            activeTab={activeTab}
            setActiveTab={navigateTo}
            openSettings={() => setIsSettingsOpen(true)}
            isMobileOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content Area: Crisp light background, dark text */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 lg:p-8 flex justify-center bg-slate-50 w-full max-w-full">
          {isMobileSimulated ? (
            /* Mobile Device Chassis Simulator */
            <div className="w-full max-w-sm my-2 flex flex-col items-center">
              <div className="flex items-center space-x-2 text-xs text-blue-600 font-bold mb-2.5">
                <Smartphone className="h-4 w-4" />
                <span>Faculty On-The-Go Companion (Mobile Frame)</span>
              </div>
              <div className="w-[375px] h-[780px] bg-slate-900 border-[10px] border-slate-800 rounded-[48px] shadow-2xl overflow-hidden flex flex-col relative">
                {/* Speaker notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-800 rounded-full z-50" />

                {/* Mobile Header */}
                <div className="pt-8 pb-3 px-4 bg-[#0B0F19] border-b border-slate-800 flex items-center justify-between text-white">
                  <span className="text-xs font-bold">ZCOER Attendance</span>
                  <div className="flex items-center space-x-1">
                    {role === 'STUDENT' ? (
                      <>
                        <button
                          onClick={() => navigateTo('student-portal')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            activeTab === 'student-portal' || activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400'
                          }`}
                        >
                          Portal
                        </button>
                        <button
                          onClick={() => navigateTo('my-attendance')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            activeTab === 'my-attendance' ? 'bg-blue-600 text-white' : 'text-slate-400'
                          }`}
                        >
                          Attendance
                        </button>
                        <button
                          onClick={() => navigateTo('calendar')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            activeTab === 'calendar' ? 'bg-blue-600 text-white' : 'text-slate-400'
                          }`}
                        >
                          Calendar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => navigateTo('mark-attendance')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            activeTab === 'mark-attendance' ? 'bg-blue-600 text-white' : 'text-slate-400'
                          }`}
                        >
                          Mark
                        </button>
                        <button
                          onClick={() => navigateTo('defaulters')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            activeTab === 'defaulters' ? 'bg-blue-600 text-white' : 'text-slate-400'
                          }`}
                        >
                          Defaulters
                        </button>
                        <button
                          onClick={() => navigateTo('calendar')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            activeTab === 'calendar' ? 'bg-blue-600 text-white' : 'text-slate-400'
                          }`}
                        >
                          Calendar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Mobile Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-3 text-xs bg-slate-50">
                  {renderContent()}
                </div>

                {/* Mobile Bottom Home Bar */}
                <div className="h-5 bg-slate-900 flex items-center justify-center">
                  <div className="w-24 h-1 bg-slate-700 rounded-full" />
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-7xl">{renderContent()}</div>
          )}
        </main>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsSaved={() => {
          // Trigger refresh if needed
        }}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <OfflineProvider>
        <MainLayout />
      </OfflineProvider>
    </AuthProvider>
  );
}

export default App;
