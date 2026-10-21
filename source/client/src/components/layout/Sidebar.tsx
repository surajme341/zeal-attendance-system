import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  AlertTriangle,
  Calendar,
  Users,
  FileSpreadsheet,
  Settings,
  History,
  GraduationCap,
  Camera,
  ScanFace,
  Sliders,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openSettings: () => void;
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openSettings,
  isMobileOpen = false,
  onClose,
}) => {
  const { role } = useAuth();

  // 1. Student Items (Student role only)
  const studentItems = [
    {
      id: 'dashboard',
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'my-attendance',
      path: '/my-attendance',
      label: 'My Attendance',
      icon: UserCheck,
      badge: 'Live',
    },
    {
      id: 'calendar',
      path: '/calendar',
      label: 'Academic Calendar',
      icon: Calendar,
      badge: 'MSBTE',
    },
    {
      id: 'student-portal',
      path: '/student-portal',
      label: 'Student Portal',
      icon: GraduationCap,
    },
  ];

  // 2. Smart Attendance (Admin & Faculty only)
  const smartAttendanceItems = [
    {
      id: 'smart-attendance',
      path: '/attendance/smart',
      label: 'Smart Face Attendance',
      icon: Camera,
      badge: 'AI ML',
    },
  ];

  // 3. Admin-only Biometrics & Management
  const adminItems = [
    {
      id: 'students',
      path: '/students',
      label: 'Manage Students',
      icon: Users,
    },
    {
      id: 'student-list',
      path: '/students/list',
      label: 'Student List',
      icon: UserCheck,
    },
    {
      id: 'enroll',
      path: '/students/enroll',
      label: 'Face Enrollment',
      icon: ScanFace,
      badge: 'Biometric',
    },
    {
      id: 'enrolled-faces',
      path: '/students/enrolled-faces',
      label: 'Enrolled Faces',
      icon: Users,
      badge: 'Database',
    },
    {
      id: 'face-settings',
      path: '#',
      label: 'Face Settings',
      icon: Sliders,
      action: openSettings,
    },
    {
      id: 'audit',
      path: '/attendance/audit',
      label: 'Audit Trail',
      icon: History,
    },
  ];

  // 4. Faculty items
  const facultyItems = [
    {
      id: 'dashboard',
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'student-list',
      path: '/students/list',
      label: 'Student List',
      icon: UserCheck,
    },
    {
      id: 'mark-attendance',
      path: '/attendance/mark',
      label: 'Manual Attendance',
      icon: CheckSquare,
    },
    {
      id: 'defaulters',
      path: '/defaulters',
      label: 'Defaulter List',
      icon: AlertTriangle,
      badge: 'Threshold',
    },
    {
      id: 'calendar',
      path: '/calendar',
      label: 'Academic Calendar',
      icon: Calendar,
      badge: 'MSBTE',
    },
  ];

  // 5. Admin General items
  const adminGeneralItems = [
    {
      id: 'dashboard',
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'mark-attendance',
      path: '/attendance/mark',
      label: 'Manual Attendance',
      icon: CheckSquare,
    },
    {
      id: 'defaulters',
      path: '/defaulters',
      label: 'Defaulter List',
      icon: AlertTriangle,
      badge: 'Threshold',
    },
    {
      id: 'calendar',
      path: '/calendar',
      label: 'Academic Calendar',
      icon: Calendar,
      badge: 'MSBTE',
    },
    {
      id: 'student-portal',
      path: '/student-portal',
      label: 'Student Portal',
      icon: GraduationCap,
    },
  ];

  const handleItemSelect = (id: string, action?: () => void) => {
    if (action) {
      action();
    } else {
      setActiveTab(id);
    }
    if (onClose) {
      onClose();
    }
  };

  const renderNavContent = () => (
    <>
      <div className="space-y-5 overflow-y-auto pr-1">
        {/* STUDENT ROLE: Only Student-Authorized Options */}
        {role === 'STUDENT' && (
          <div>
            <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">
              Student Portal
            </p>
            <nav className="space-y-1">
              {studentItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemSelect(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* ADMIN & FACULTY: Smart Attendance Section */}
        {role !== 'STUDENT' && (
          <div>
            <p className="px-3 text-[10px] font-bold tracking-wider text-blue-400 uppercase mb-2 flex items-center space-x-1.5">
              <Sparkles className="h-3 w-3" />
              <span>Smart Attendance</span>
            </p>
            <nav className="space-y-1">
              {smartAttendanceItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemSelect(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/40'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-blue-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* ADMIN ONLY: Admin Biometrics & Management Section */}
        {role === 'ADMIN' && (
          <div>
            <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">
              Admin Biometrics & Mgmt
            </p>
            <nav className="space-y-1">
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemSelect(item.id, item.action)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* ADMIN & FACULTY: Academic & Records Section */}
        {role !== 'STUDENT' && (
          <div>
            <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">
              Academic & Records
            </p>
            <nav className="space-y-1">
              {(role !== 'ADMIN' ? facultyItems : adminGeneralItems).map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemSelect(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                          item.id === 'defaulters'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        <nav className="space-y-1" aria-label="Requests and reports">{[{id:'leave',label:'Leave Requests'},{id:'complaints',label:'Complaint Box'},{id:'reports',label:'Attendance Reports'},...(role==='STUDENT'?[]:[{id:'discipline',label:'Student Identification'}])].map(item=><button key={item.id} onClick={()=>handleItemSelect(item.id)} className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold ${activeTab===item.id?'bg-blue-600 text-white':'text-slate-300 hover:bg-slate-800'}`}>{item.label}</button>)}</nav>
        {/* MSBTE Term Info */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 text-xs text-slate-400">
          <p className="font-bold text-slate-200">MSBTE Academic Term</p>
          <p className="mt-1 text-slate-400 text-[11px]">Odd Semester 2025–26</p>
          <div className="mt-3 flex items-center justify-between text-[11px] border-t border-slate-800 pt-2 text-slate-400">
            <span>Branch: E&TC</span>
            <span className="font-mono text-blue-400 font-semibold">MSBTE #0143</span>
          </div>
        </div>
      </div>

      {/* Admin Settings Button */}
      {role === 'ADMIN' && (
        <button
          onClick={() => {
            openSettings();
            if (onClose) onClose();
          }}
          className="flex items-center space-x-3 w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition mt-3"
        >
          <Settings className="h-4 w-4 text-slate-400" />
          <span>System Settings</span>
        </button>
      )}
    </>
  );

  return (
    <>
      {/* 1. Desktop Static Sidebar (Preserved unchanged for >= md) */}
      <aside className="hidden md:flex w-64 border-r border-slate-800 bg-[#0F172A] p-4 flex-col justify-between shrink-0 text-slate-300">
        {renderNavContent()}
      </aside>

      {/* 2. Mobile Slide-in Drawer (< md) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={onClose}
          />

          {/* Off-canvas Drawer */}
          <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#0F172A] border-r border-slate-800 p-4 flex flex-col justify-between shadow-2xl text-slate-300 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-md shadow-blue-900/40 text-sm">
                  Z
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white">Zeal College E&TC</h2>
                  <p className="text-[10px] text-slate-400">Attendance Portal</p>
                </div>
              </div>
              <button
                onClick={onClose}
                type="button"
                aria-label="Close menu"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Menu Items */}
            {renderNavContent()}
          </aside>
        </div>
      )}
    </>
  );
};
