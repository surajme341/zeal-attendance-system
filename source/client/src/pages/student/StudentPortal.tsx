import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  BookOpen,
  Calendar,
  Sparkles,
  Award,
} from 'lucide-react';
import { api } from '../../services/api';
import { DefaulterStudent, HolidayCalendarEvent } from '../../types';

export const StudentPortal: React.FC = () => {
  const [studentData, setStudentData] = useState<DefaulterStudent | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<HolidayCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      setLoading(true);
      try {
        const [myStatusRes, calRes] = await Promise.all([
          api.getMyDefaulterStatus().catch(() => null),
          api.getCalendarEvents().catch(() => ({ events: [] })),
        ]);

        if (myStatusRes?.student) {
          setStudentData(myStatusRes.student);
        }
        if (calRes?.events) {
          setUpcomingEvents(calRes.events.slice(0, 4));
        }
      } catch (err) {
        console.error('Error fetching student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!studentData) {
    return <div className="text-center py-12 text-slate-500">Student record not found.</div>;
  }

  const isCritical = studentData.status_category === 'CRITICAL';
  const isWarning = studentData.status_category === 'WARNING';
  const isSafe = studentData.status_category === 'SAFE';

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0B0F19] text-white p-4 sm:p-6 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3 sm:space-x-4">
            <img
              src={studentData.photo_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
              alt={studentData.full_name}
              className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl object-cover border-2 border-blue-500 shadow-lg shrink-0"
            />
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="rounded bg-blue-600 px-2 py-0.5 text-xs font-mono font-bold text-white shadow-sm">
                  {studentData.roll_no}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-400 font-mono">PRN: {studentData.prn || 'Pending'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                {studentData.full_name}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-300">
                {studentData.division_name} • Electronics & Telecommunication • MSBTE
              </p>
            </div>
          </div>

          {/* Attendance Gauge Card */}
          <div className="flex items-center justify-between sm:justify-start space-x-3 rounded-2xl bg-slate-900 p-3 sm:p-4 border border-slate-800 shadow-inner w-full md:w-auto">
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Percentage</span>
              <span
                className={`text-2xl font-black font-mono ${
                  isCritical
                    ? 'text-red-400'
                    : isWarning
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {studentData.attendance_percentage.toFixed(2)}%
              </span>
            </div>
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl font-bold shrink-0 ${
                isCritical
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : isWarning
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {isCritical ? (
                <AlertOctagon className="h-6 w-6" />
              ) : isWarning ? (
                <AlertTriangle className="h-6 w-6" />
              ) : (
                <CheckCircle2 className="h-6 w-6" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Advisory Warning Banner if below threshold */}
      {isCritical && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start space-x-3 shadow-sm">
          <AlertOctagon className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div className="text-xs text-red-900">
            <p className="font-bold text-red-950">Critical Attendance Shortage Notice (Below 60%):</p>
            <p className="mt-0.5 text-red-800">
              Your cumulative attendance is below the mandatory MSBTE 60% threshold. You are at risk of exam detention. Please contact Prof. S. R. Sharma (HOD / Mentor) immediately.
            </p>
          </div>
        </div>
      )}

      {/* Subject-Wise Attendance Breakdown */}
      <div className="card-panel rounded-2xl p-5 shadow-sm bg-white border border-slate-200">
        <h3 className="text-sm font-bold text-slate-900 mb-3">
          Subject-Wise Attendance Breakdown (MSBTE E&TC Semester V)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {studentData.subject_breakdown.map((sub) => {
            const subCrit = sub.category === 'CRITICAL';
            const subWarn = sub.category === 'WARNING';

            return (
              <div
                key={sub.subject_id}
                className={`rounded-2xl p-4 border transition ${
                  subCrit
                    ? 'border-red-200 bg-red-50/50'
                    : subWarn
                    ? 'border-amber-200 bg-amber-50/50'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{sub.subject_name}</h4>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">Code: {sub.subject_code}</p>
                  </div>
                  <span
                    className={`text-xs font-black font-mono px-2 py-0.5 rounded ${
                      subCrit
                        ? 'bg-red-100 text-red-800'
                        : subWarn
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {sub.percentage.toFixed(1)}%
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-600">
                  <span>Attended: {sub.attended} / {sub.conducted}</span>
                  <span className="text-[10px] font-sans font-bold">
                    {subCrit ? '🔴 Detention Risk' : subWarn ? '🟡 Warning' : '🟢 Safe'}
                  </span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      subCrit
                        ? 'bg-red-600'
                        : subWarn
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Holidays & Events */}
      <div className="card-panel rounded-2xl p-5 shadow-sm bg-white border border-slate-200">
        <div className="flex items-center space-x-2 mb-3">
          <Calendar className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Upcoming Academic Calendar Events</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {upcomingEvents.map((ev) => (
            <div key={ev.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="font-mono text-[10px] text-blue-600 font-bold block">{ev.event_date}</span>
              <p className="font-bold text-slate-900 mt-0.5">{ev.title}</p>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {ev.is_instructional_day === 0 ? 'Holiday (Zero penalty)' : 'Instructional Event'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
