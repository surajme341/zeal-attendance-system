import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  BookOpen,
  Building,
  CheckSquare,
  Clock,
  Camera,
} from 'lucide-react';
import { api } from '../../services/api';
import { DefaulterSummary, AttendanceSession, ClassDivision } from '../../types';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [summary, setSummary] = useState<DefaulterSummary | null>(null);
  const [divisions, setDivisions] = useState<ClassDivision[]>([]);
  const [recentSessions, setRecentSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [defRes, divRes, sessRes] = await Promise.all([
          api.getDefaulters(),
          api.getDivisions(),
          api.getSessions(),
        ]);
        setSummary(defRes.summary);
        setDivisions(divRes.divisions);
        setRecentSessions(sessRes.sessions.slice(0, 5));
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0B0F19] p-6 text-white border border-slate-800 shadow-md">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Building className="h-4 w-4" />
            <span>Zeal College of Engineering & Research • MSBTE E&TC Dept</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Attendance Command Center
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-300">
            Real-time classroom attendance tracking, automated MSBTE holiday deductions, and proactive defaulter threshold monitoring for E&TC students.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('mark-attendance')}
              id="btn-dash-mark"
              className="rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-950/40 transition flex items-center space-x-1.5"
            >
              <CheckSquare className="h-4 w-4" />
              <span>Mark Today's Attendance</span>
            </button>
            <button
              onClick={() => onNavigate('defaulters')}
              id="btn-dash-defaulters"
              className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-bold text-slate-200 border border-slate-700 transition flex items-center space-x-1.5"
            >
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span>View Defaulter Registry</span>
            </button>
            <button
              onClick={() => onNavigate('smart-attendance')}
              id="btn-dash-smart"
              className="rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 px-4 py-2 text-xs font-bold text-white border border-blue-400/30 transition flex items-center space-x-1.5"
            >
              <Camera className="h-4 w-4 text-blue-200" />
              <span>Smart Face Attendance (Phase 2)</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Students */}
        <div className="card-panel rounded-2xl p-4 shadow-sm bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Enrolled
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {summary?.totalStudents || 0}
            </span>
            <span className="text-xs text-slate-500 ml-1.5">Students in TY E&TC</span>
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            {summary?.totalConducted || 0} Total Lecture Sessions Conducted
          </p>
        </div>

        {/* Average Attendance % */}
        <div className="card-panel rounded-2xl p-4 shadow-sm bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Average Attendance
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {summary?.averageAttendance.toFixed(1)}%
            </span>
            <span className="text-xs text-emerald-700 font-semibold ml-1.5">Department Level</span>
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            Target benchmark: &ge; 75% MSBTE criterion
          </p>
        </div>

        {/* Critical Defaulters */}
        <div
          onClick={() => onNavigate('defaulters')}
          className="card-panel rounded-2xl p-4 shadow-sm bg-white border border-red-200 hover:border-red-400 cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">
              Critical Defaulters
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-700">
              <AlertOctagon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-red-700">
              {summary?.criticalCount || 0}
            </span>
            <span className="text-xs font-semibold text-red-600 ml-1.5">Below 60% threshold</span>
          </div>
          <p className="mt-1 text-[10px] text-red-600 flex items-center">
            <span>Severe detention risk</span>
            <ArrowUpRight className="h-3 w-3 ml-0.5" />
          </p>
        </div>

        {/* Warning / At Risk */}
        <div
          onClick={() => onNavigate('defaulters')}
          className="card-panel rounded-2xl p-4 shadow-sm bg-white border border-amber-200 hover:border-amber-400 cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Warning / At Risk
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-amber-700">
              {summary?.warningCount || 0}
            </span>
            <span className="text-xs font-semibold text-amber-600 ml-1.5">60% – 74.99%</span>
          </div>
          <p className="mt-1 text-[10px] text-amber-600 flex items-center">
            <span>Requires parental warning</span>
            <ArrowUpRight className="h-3 w-3 ml-0.5" />
          </p>
        </div>
      </div>

      {/* Two-Column Grid: Recent Sessions & Quick MSBTE Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sessions */}
        <div className="lg:col-span-2 card-panel rounded-2xl p-5 shadow-sm bg-white border border-slate-200">
          <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Recent Attendance Sessions</h3>
            </div>
            <button
              onClick={() => onNavigate('mark-attendance')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Mark New Lecture →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentSessions.map((sess) => (
              <div key={sess.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{sess.subject_name}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600">
                      {sess.subject_code}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {sess.session_date} • {sess.lecture_slot} • {sess.division_name}
                  </p>
                </div>
                <div className="flex items-center space-x-2 font-mono">
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {sess.present_count} P
                  </span>
                  <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    {sess.absent_count} A
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MSBTE Calendar & Department Snapshot */}
        <div className="card-panel rounded-2xl p-5 shadow-sm bg-white border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Calendar className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Academic Term Status</h3>
            </div>
            <p className="text-xs text-slate-600">
              MSBTE Academic Year 2025–2026. Non-instructional public holidays are automatically subtracted from attendance penalty calculations.
            </p>

            <div className="mt-4 space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between">
                <span className="font-medium text-slate-700">Excluded Holidays Count:</span>
                <span className="font-bold text-blue-600 font-mono">
                  {summary?.excludedHolidaysCount || 16} days
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between">
                <span className="font-medium text-slate-700">Configured Safe Threshold:</span>
                <span className="font-bold text-emerald-700 font-mono">
                  &ge; {summary?.thresholds.warning || 75}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between">
                <span className="font-medium text-slate-700">Configured Critical Threshold:</span>
                <span className="font-bold text-red-700 font-mono">
                  &lt; {summary?.thresholds.critical || 60}%
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('calendar')}
            className="mt-4 w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 border border-slate-300 transition"
          >
            Open Academic Calendar →
          </button>
        </div>
      </div>
    </div>
  );
};
