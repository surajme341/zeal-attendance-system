import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Smartphone,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Camera,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';
import { UserRole } from '../../types';

interface NavbarProps {
  isMobileSimulated: boolean;
  setIsMobileSimulated: (val: boolean) => void;
  openSettings: () => void;
  onNavigate: (tab: string) => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isMobileSimulated,
  setIsMobileSimulated,
  openSettings,
  onNavigate,
  isMobileMenuOpen,
  onToggleMobileMenu,
}) => {
  const { user, role, switchRole, logout } = useAuth();
  const { isOnline, queuedSessions, syncNow, isSyncing } = useOffline();

  const handleSync = async () => {
    const count = await syncNow();
    if (count > 0) {
      alert(`Synchronized ${count} offline attendance session(s) successfully!`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0B0F19] text-white">
      <div className="flex h-16 items-center justify-between px-2.5 sm:px-6 gap-2">
        {/* Left Side: Hamburger (Mobile) + Brand Identity & PINNED SMART ATTENDANCE BUTTON */}
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
          {/* Hamburger Menu Toggle (Mobile only) */}
          <button
            onClick={onToggleMobileMenu}
            type="button"
            aria-label="Toggle navigation menu"
            className="md:hidden flex items-center justify-center h-9 w-9 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition border border-slate-700/50 shrink-0"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Pinned Smart Attendance Button (Visible to Admin & Faculty only) */}
          {role !== 'STUDENT' && (
            <>
              <button
                onClick={() => onNavigate('smart-attendance')}
                id="btn-smart-attendance"
                title="Launch Face Recognition Automated Attendance"
                className="flex items-center space-x-1 sm:space-x-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-white shadow-lg shadow-blue-950/50 border border-blue-400/30 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
              >
                <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-100" />
                <span className="hidden sm:inline font-semibold">📷 Smart Attendance</span>
                <span className="sm:hidden font-bold text-[11px]">AI</span>
                <span className="hidden xs:inline rounded-full bg-blue-400/20 px-1 py-0.2 text-[9px] font-mono tracking-tighter uppercase text-blue-200 border border-blue-400/40">
                  ML
                </span>
              </button>

              <div className="h-6 w-px bg-slate-800 hidden sm:block" />
            </>
          )}

          {/* College Logo & Name */}
          <div
            onClick={() => onNavigate(role === 'STUDENT' ? 'student-portal' : 'dashboard')}
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group min-w-0"
          >
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-md shadow-blue-900/40 group-hover:bg-blue-500 transition shrink-0 text-sm sm:text-base">
              Z
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <h1 className="text-xs sm:text-sm md:text-base font-bold tracking-tight text-white group-hover:text-blue-300 transition truncate max-w-[110px] xs:max-w-[160px] sm:max-w-xs md:max-w-none">
                  <span className="hidden sm:inline">Zeal College of Engg</span>
                  <span className="sm:hidden">Zeal Engg</span>
                </h1>
                <span className="hidden md:inline-block rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-blue-300 border border-blue-500/30">
                  MSBTE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden lg:block">
                Dept. of Electronics & Telecommunication (E&TC) • Attendance System
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Network Status, Mobile Simulator & Role Switcher */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          {/* Offline / Online Status Indicator */}
          {isOnline ? (
            <div className="flex items-center space-x-1 sm:space-x-1.5 rounded-full bg-emerald-500/10 px-2 sm:px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
              <Wifi className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              <span className="hidden md:inline">Online</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 sm:space-x-1.5 rounded-full bg-amber-500/20 px-2 sm:px-2.5 py-1 text-xs font-medium text-amber-300 border border-amber-500/40">
              <WifiOff className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[11px] sm:text-xs">({queuedSessions.length})</span>
              {queuedSessions.length > 0 && (
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="ml-1 rounded bg-amber-600 px-1.5 py-0.5 text-[10px] text-white hover:bg-amber-500 font-semibold flex items-center"
                >
                  <RefreshCw className={`h-2.5 w-2.5 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sync
                </button>
              )}
            </div>
          )}

          {/* Device Simulator Toggle (Desktop only) */}
          <button
            onClick={() => setIsMobileSimulated(!isMobileSimulated)}
            title="Toggle Mobile Companion Simulator View"
            className={`hidden xl:flex items-center space-x-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              isMobileSimulated
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>{isMobileSimulated ? 'Exit Preview' : 'Mobile Preview'}</span>
          </button>

          {role === 'ADMIN' && <button onClick={() => onNavigate('accounts')} className="rounded-lg bg-slate-800 px-3 py-2 text-xs">Accounts</button>}
          <button onClick={logout} className="rounded-lg bg-slate-800 px-3 py-2 text-xs">Sign out</button>

          {/* User Name Chip */}
          <div className="hidden 2xl:flex flex-col text-right pl-2 border-l border-slate-800">
            <span className="text-xs font-semibold text-slate-200">{user?.full_name || 'User'}</span>
            <span className="text-[10px] text-blue-400 uppercase tracking-wider font-semibold">{role}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
