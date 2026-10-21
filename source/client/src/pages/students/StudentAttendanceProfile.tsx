import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Camera,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Edit3,
  Filter,
  Search,
  Check,
  X,
  User,
  Phone,
  Mail,
  Building2,
  BookOpen,
  Sparkles,
  Info,
  CalendarCheck,
  FileSpreadsheet,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  StudentAttendanceProfileData,
  StudentAttendanceLectureRecord,
  StudentAttendanceDay,
} from '../../types';

interface StudentAttendanceProfileProps {
  studentId: string;
  onBack: () => void;
  onNavigateDashboard?: () => void;
}

export const StudentAttendanceProfile: React.FC<StudentAttendanceProfileProps> = ({
  studentId,
  onBack,
  onNavigateDashboard,
}) => {
  const { role, user } = useAuth();
  const canEdit = role !== 'STUDENT';

  const [profileData, setProfileData] = useState<StudentAttendanceProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit'}).format(new Date()).slice(0,7)); // Default to academic semester month
  const [selectedDate, setSelectedDate] = useState<string>(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())); // Default selected date

  // Edit Modal State
  const [editRecord, setEditRecord] = useState<StudentAttendanceLectureRecord | null>(null);
  const [editStatus, setEditStatus] = useState<string>('PRESENT');
  const [editReason, setEditReason] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);

  // History Filter States
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historySubject, setHistorySubject] = useState<string>('ALL');
  const [historyStatus, setHistoryStatus] = useState<string>('ALL');
  const [historyMethod, setHistoryMethod] = useState<string>('ALL');
  const [historyStartDate, setHistoryStartDate] = useState<string>('');
  const [historyEndDate, setHistoryEndDate] = useState<string>('');

  const fetchProfile = async (monthToFetch = selectedMonth) => {
    setLoading(true);
    try {
      const data = await api.getStudentAttendanceProfile(studentId, monthToFetch);
      setProfileData(data);
      // If selected date is not in the month, default to first day of month or a day with sessions
      if (!selectedDate.startsWith(monthToFetch)) {
        const firstDayWithSessions = data.calendar?.days?.find((d) => d.total_sessions > 0);
        if (firstDayWithSessions) {
          setSelectedDate(firstDayWithSessions.date);
        } else {
          setSelectedDate(`${monthToFetch}-01`);
        }
      }
    } catch (err) {
      console.error('Failed to load student attendance profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile(selectedMonth);
  }, [studentId, selectedMonth]);

  // Month navigation
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m - 2, 1);
    const nextMonthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(nextMonthStr);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m, 1);
    const nextMonthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(nextMonthStr);
  };

  // Format month title
  const monthTitle = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  // Daily records for currently selected date
  const dailyRecords = useMemo(() => {
    if (!profileData?.records) return [];
    return profileData.records.filter((r) => r.date === selectedDate);
  }, [profileData, selectedDate]);

  // Selected date info
  const selectedDayInfo = useMemo(() => {
    if (!profileData?.calendar?.days) return null;
    return profileData.calendar.days.find((d) => d.date === selectedDate);
  }, [profileData, selectedDate]);

  // History records with filters
  const filteredHistoryRecords = useMemo(() => {
    if (!profileData?.records) return [];
    let list = [...profileData.records];

    if (historySearch.trim()) {
      const q = historySearch.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.subject?.toLowerCase().includes(q) ||
          r.subject_code?.toLowerCase().includes(q) ||
          r.date?.includes(q) ||
          r.lecture_slot?.toLowerCase().includes(q)
      );
    }

    if (historySubject !== 'ALL') {
      list = list.filter((r) => r.subject === historySubject || r.subject_name === historySubject);
    }

    if (historyStatus !== 'ALL') {
      list = list.filter((r) => r.status.toUpperCase() === historyStatus);
    }

    if (historyMethod !== 'ALL') {
      if (historyMethod === 'FACE_RECOGNITION') {
        list = list.filter((r) => r.attendance_method === 'FACE_RECOGNITION' || r.method === 'Face Recognition');
      } else if (historyMethod === 'MANUAL_EDIT') {
        list = list.filter((r) => r.attendance_method === 'Manual Edit' || r.modified_by !== null);
      } else if (historyMethod === 'MANUAL') {
        list = list.filter((r) => r.attendance_method === 'MANUAL' && !r.modified_by);
      }
    }

    if (historyStartDate) {
      list = list.filter((r) => r.date >= historyStartDate);
    }

    if (historyEndDate) {
      list = list.filter((r) => r.date <= historyEndDate);
    }

    return list;
  }, [profileData, historySearch, historySubject, historyStatus, historyMethod, historyStartDate, historyEndDate]);

  // Unique subjects list for filter dropdown
  const availableSubjects = useMemo(() => {
    if (!profileData?.records) return [];
    const set = new Set<string>();
    profileData.records.forEach((r) => {
      if (r.subject) set.add(r.subject);
    });
    return Array.from(set).sort();
  }, [profileData]);

  // Open Edit Modal
  const handleOpenEdit = (record: StudentAttendanceLectureRecord) => {
    setEditRecord(record);
    setEditStatus(record.status.toUpperCase());
    setEditReason('');
    setEditSuccessMsg(null);
    setEditErrorMsg(null);
  };

  // Submit Edit Attendance
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRecord) return;

    if (!editReason.trim()) {
      setEditErrorMsg('Please enter a valid reason for modifying the attendance record (required for audit trail).');
      return;
    }

    setSavingEdit(true);
    setEditErrorMsg(null);

    try {
      const res = await api.updateRecord(editRecord.id, editStatus, editReason.trim());
      setEditSuccessMsg(res.message || 'Attendance status successfully updated.');
      
      // Refresh profile immediately to update calendar, percentages, and counters
      await fetchProfile(selectedMonth);

      setTimeout(() => {
        setEditRecord(null);
        setEditSuccessMsg(null);
      }, 900);
    } catch (err: any) {
      setEditErrorMsg(err.message || 'Failed to update attendance record.');
    } finally {
      setSavingEdit(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'PRESENT') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
          <Check className="h-3 w-3 text-emerald-600" />
          Present
        </span>
      );
    }
    if (s === 'ABSENT') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
          <X className="h-3 w-3 text-rose-600" />
          Absent
        </span>
      );
    }
    if (s === 'LEAVE') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200">
          <Info className="h-3 w-3 text-indigo-600" />
          Leave
        </span>
      );
    }
    if (s === 'EXCUSED') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
          <AlertTriangle className="h-3 w-3 text-amber-600" />
          Excused
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
        {status}
      </span>
    );
  };

  if (loading && !profileData) {
    return (
      <div className="p-16 text-center text-slate-400">
        <RotateCcw className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-600" />
        <p className="text-sm font-semibold text-slate-700">Loading Student Attendance Profile...</p>
        <p className="text-xs text-slate-400 mt-1">Retrieving lecture calendar, biometric logs, and audit trail</p>
      </div>
    );
  }

  const student = profileData?.student;
  const summary = profileData?.summary;
  const calendarDays = profileData?.calendar?.days || [];

  // Compute day of week offsets for calendar grid (Mon=0 ... Sun=6)
  const firstDayOfMonth = calendarDays.length > 0 ? (calendarDays[0].dayOfWeek === 0 ? 6 : calendarDays[0].dayOfWeek - 1) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* 1. Breadcrumbs & Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
        <nav className="flex items-center space-x-2 text-xs font-medium text-slate-500">
          <button
            onClick={() => onNavigateDashboard?.() || onBack()}
            className="hover:text-blue-600 transition"
          >
            Dashboard
          </button>
          <span>/</span>
          <button onClick={onBack} className="hover:text-blue-600 transition">
            Student List
          </button>
          <span>/</span>
          <span className="text-slate-800 font-semibold">{student?.full_name || 'Student Profile'}</span>
          <span>/</span>
          <span className="text-blue-600 font-bold">Attendance</span>
        </nav>

        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Student List</span>
        </button>
      </div>

      {/* 2. Student Info Header Card */}
      <div className="card-panel bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center space-x-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 flex items-center justify-center text-white font-black text-xl shrink-0 shadow-md shadow-blue-900/20">
            {student?.full_name
              ?.split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {student?.full_name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono font-bold text-xs">
                ID: {student?.student_id || student?.roll_no}
              </span>
              {student?.prn && (
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-mono text-xs">
                  PRN: {student.prn}
                </span>
              )}
            </div>

            <p className="text-xs font-semibold text-slate-700 flex flex-wrap items-center gap-3 pt-0.5">
              <span className="flex items-center gap-1 text-slate-800">
                <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                {student?.class || student?.class_name} • Division {student?.division}
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 text-slate-600">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                {student?.department_name || 'Department of Electronics & Telecommunication'}
              </span>
            </p>

            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
              {student?.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3 text-slate-400" />
                  {student.email}
                </span>
              )}
              {student?.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-slate-400" />
                  {student.phone}
                </span>
              )}
              {student?.guardian_phone && (
                <span className="flex items-center gap-1 text-slate-500">
                  <User className="h-3 w-3 text-slate-400" />
                  Guardian: {student.guardian_phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Big Overall Percentage Meter */}
        <div className="flex items-center md:border-l md:border-slate-100 md:pl-6 space-x-4 shrink-0">
          <div className="text-right">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Overall Attendance
            </span>
            <div className="flex items-baseline justify-end space-x-1 mt-0.5">
              <span
                className={`text-3xl font-black ${
                  (summary?.attendance_percentage ?? 0) >= 75
                    ? 'text-emerald-600'
                    : (summary?.attendance_percentage ?? 0) >= 60
                    ? 'text-amber-600'
                    : 'text-rose-600'
                }`}
              >
                {summary?.attendance_percentage}%
              </span>
            </div>
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase mt-1 ${
                summary?.status === 'Safe'
                  ? 'bg-emerald-100 text-emerald-800'
                  : summary?.status === 'Warning'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {summary?.status || 'Active'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Four KPI Summary Cards (Per Requirement 2) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Card 1: Total Lectures */}
        <div className="card-panel bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Lectures</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <CalendarIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900">{summary?.total_lectures || 0}</span>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Conducted (Holidays Excluded)</p>
          </div>
        </div>

        {/* Card 2: Present Lectures */}
        <div className="card-panel bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-sm flex flex-col justify-between bg-gradient-to-br from-white to-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Present</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-emerald-600">{summary?.present_lectures || 0}</span>
            <p className="text-[11px] text-emerald-600/80 mt-1 font-medium">Lectures Attended</p>
          </div>
        </div>

        {/* Card 3: Absent Lectures */}
        <div className="card-panel bg-white p-4 sm:p-5 rounded-2xl border border-rose-200 shadow-sm flex flex-col justify-between bg-gradient-to-br from-white to-rose-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Absent</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-rose-600">{summary?.absent_lectures || 0}</span>
            <p className="text-[11px] text-rose-600/80 mt-1 font-medium">Lectures Missed</p>
          </div>
        </div>

        {/* Card 4: Attendance % */}
        <div className="card-panel bg-white p-4 sm:p-5 rounded-2xl border border-blue-200 shadow-sm flex flex-col justify-between bg-gradient-to-br from-white to-blue-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Attendance %</span>
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-blue-700">{summary?.attendance_percentage || 0}%</span>
            <p className="text-[11px] text-blue-600/80 mt-1 font-medium">Threshold Status: {summary?.status}</p>
          </div>
        </div>
      </div>

      {/* 4. Calendar-Based Attendance & Daily Details Section (Side-by-side or stacked) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Monthly Calendar View (Requirement 3) */}
        <div className="lg:col-span-7 card-panel bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 sm:p-5 space-y-4">
          {/* Calendar Header with Month Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-blue-600 shrink-0" />
                <span>Calendar-Based Attendance</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Academic calendar view • Click any date to view lecture details
              </p>
            </div>

            <div className="flex items-center justify-between sm:justify-end space-x-1.5 w-full sm:w-auto">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-600 transition"
                title="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2.5 py-1 font-bold text-xs text-slate-800 bg-slate-100 rounded-lg min-w-[110px] text-center">
                {monthTitle}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-600 transition"
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Weekday Header */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-[10px] sm:text-[11px] font-bold uppercase text-slate-400 pb-1">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {/* Empty slots for offset before the 1st */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-12 sm:h-16 rounded-lg sm:rounded-xl bg-slate-50/50 border border-dashed border-slate-100" />
            ))}

            {/* Days in Month */}
            {calendarDays.map((day) => {
              const isSelected = day.date === selectedDate;
              let bgClass = 'bg-slate-50 text-slate-400 border-slate-200'; // NO_LECTURE
              let badgeColor = 'text-slate-400';
              let badgeText = '—';

              if (day.status === 'HOLIDAY') {
                bgClass = 'bg-slate-100/90 text-slate-600 border-slate-300';
                badgeColor = 'text-slate-500 font-bold';
                badgeText = 'H';
              } else if (day.status === 'PRESENT') {
                bgClass = 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border-emerald-300';
                badgeColor = 'text-emerald-700 font-black';
                badgeText = 'P';
              } else if (day.status === 'ABSENT') {
                bgClass = 'bg-rose-50 hover:bg-rose-100/80 text-rose-900 border-rose-300';
                badgeColor = 'text-rose-700 font-black';
                badgeText = 'A';
              } else if (day.status === 'PARTIAL') {
                bgClass = 'bg-amber-50 hover:bg-amber-100/80 text-amber-900 border-amber-300';
                badgeColor = 'text-amber-700 font-black';
                badgeText = `${day.present_sessions}/${day.total_sessions}`;
              }

              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDate(day.date)}
                  className={`h-12 sm:h-16 p-1 sm:p-1.5 rounded-lg sm:rounded-xl border flex flex-col justify-between transition-all relative group text-left ${bgClass} ${
                    isSelected
                      ? 'ring-2 ring-blue-600 ring-offset-1 shadow-md'
                      : 'hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] sm:text-xs font-extrabold">{day.day}</span>

                    {/* Blue indicator for edited/manually modified records (Requirement 3) */}
                    {day.is_modified && (
                      <span
                        className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-blue-600 ring-1 sm:ring-2 ring-white animate-pulse"
                        title="Attendance records were manually edited on this date"
                      />
                    )}
                  </div>

                  <div className="flex items-end justify-between w-full">
                    <span className={`text-[10px] sm:text-xs ${badgeColor}`}>{badgeText}</span>
                    {day.total_sessions > 0 && day.status !== 'HOLIDAY' && (
                      <span className="hidden xs:inline text-[8px] sm:text-[9px] text-slate-400 font-medium">
                        {day.total_sessions} lec
                      </span>
                    )}
                    {day.is_holiday && (
                      <span className="hidden xs:inline text-[8px] sm:text-[9px] text-slate-500 font-semibold truncate max-w-[36px] sm:max-w-[42px]" title={day.holiday_name}>
                        {day.holiday_name?.slice(0, 6)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Visual Legend (Requirement 3) */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 pt-3 border-t border-slate-100 text-[10px] sm:text-[11px] font-medium text-slate-600">
            <div className="flex items-center space-x-1.5">
              <span className="h-3 w-3 rounded-md bg-emerald-500 shrink-0" />
              <span>Present (P)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-3 w-3 rounded-md bg-rose-500 shrink-0" />
              <span>Absent (A)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-3 w-3 rounded-md bg-slate-300 shrink-0" />
              <span>Holiday (H)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-3 w-3 rounded-md bg-slate-100 border border-slate-300 shrink-0" />
              <span>No Lecture</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-blue-200 shrink-0" />
              <span className="text-blue-700 font-semibold">Edited</span>
            </div>
          </div>
        </div>

        {/* Daily Attendance Details Section (Requirement 4) */}
        <div className="lg:col-span-5 card-panel bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Daily Breakdown
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-1">
                Date: {selectedDate}
              </h2>
            </div>
            {selectedDayInfo?.is_holiday && (
              <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200">
                {selectedDayInfo.holiday_name || 'Holiday'}
              </span>
            )}
          </div>

          {/* Daily Lecture Cards / Table */}
          {dailyRecords.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Clock className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">
                {selectedDayInfo?.is_holiday
                  ? `Academic Holiday: ${selectedDayInfo.holiday_name || 'No classes conducted'}`
                  : 'No lectures scheduled or recorded on this date.'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Select another date on the calendar to view its session records.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {dailyRecords.map((rec, index) => {
                const isFaceRec = rec.attendance_method === 'FACE_RECOGNITION' || rec.method === 'Face Recognition';
                const isEdited = rec.attendance_method === 'Manual Edit' || rec.modified_by !== null;

                return (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50 transition space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-extrabold text-slate-900">{rec.subject}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>Lecture {index + 1} ({rec.lecture_slot})</span>
                          {rec.room_no && <span>• {rec.room_no}</span>}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {getStatusBadge(rec.status)}
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(rec)}
                            className="p-1.5 rounded-lg bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 shadow-sm transition"
                            title="Edit Attendance Record"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Method & Confidence Info (Requirement 8) */}
                    <div className="pt-2 border-t border-slate-100/80 text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Attendance Method:</span>
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          {isFaceRec && <Camera className="h-3 w-3 text-blue-600" />}
                          {rec.attendance_method === 'FACE_RECOGNITION' ? 'Face Recognition' : rec.attendance_method}
                        </span>
                      </div>

                      {/* Face recognition confidence */}
                      {rec.recognition_confidence && (
                        <div className="flex items-center justify-between text-blue-700">
                          <span>Recognition Confidence:</span>
                          <span className="font-bold">{Math.round(rec.recognition_confidence * 100)}%</span>
                        </div>
                      )}

                      {/* Manual Edit Traceability (Requirement 8) */}
                      {isEdited && (
                        <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-100 text-[10px] space-y-0.5 text-blue-900 mt-1.5">
                          <div className="font-bold flex items-center gap-1 text-blue-800">
                            <Info className="h-3 w-3 text-blue-600" />
                            <span>Manual Edit Traceability Info:</span>
                          </div>
                          {rec.original_method && (
                            <div>
                              <span className="text-slate-500">Original Method: </span>
                              <strong className="text-slate-800">{rec.original_method}</strong>
                              {rec.original_confidence && ` (${rec.original_confidence})`}
                            </div>
                          )}
                          {rec.original_status && (
                            <div>
                              <span className="text-slate-500">Original Status: </span>
                              <strong className="text-slate-800">{rec.original_status}</strong>
                            </div>
                          )}
                          {rec.modified_by && (
                            <div>
                              <span className="text-slate-500">Modified By: </span>
                              <strong className="text-slate-800">{rec.modified_by}</strong>
                              {rec.modified_at && ` at ${rec.modified_at}`}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 5. Full Attendance History Table (Requirement 6) */}
      <div className="card-panel bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-blue-600" />
              Attendance History & Lecture Logs
            </h2>
            <p className="text-xs text-slate-400">
              Complete historical record of every lecture session conducted for this student
            </p>
          </div>

          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
            {filteredHistoryRecords.length} Lectures Found
          </span>
        </div>

        {/* History Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-slate-50/60 p-3 rounded-xl border border-slate-100">
          <div className="sm:col-span-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Search Subject..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={historySubject}
              onChange={(e) => setHistorySubject(e.target.value)}
              className="w-full py-1.5 px-2.5 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">All Subjects</option>
              {availableSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={historyStatus}
              onChange={(e) => setHistoryStatus(e.target.value)}
              className="w-full py-1.5 px-2.5 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="LEAVE">Leave</option>
              <option value="EXCUSED">Excused</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={historyMethod}
              onChange={(e) => setHistoryMethod(e.target.value)}
              className="w-full py-1.5 px-2.5 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">All Methods</option>
              <option value="FACE_RECOGNITION">Face Recognition</option>
              <option value="MANUAL_EDIT">Manual Edit</option>
              <option value="MANUAL">Manual</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex items-center space-x-1.5">
            <input
              type="date"
              value={historyStartDate}
              onChange={(e) => setHistoryStartDate(e.target.value)}
              className="w-full py-1.5 px-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-700"
              title="Start Date"
            />
          </div>
        </div>

        {/* History Table - Desktop View */}
        <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3">Lecture Slot</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3">Method & Confidence</th>
                <th className="py-2.5 px-3">Modified / Audit Info</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredHistoryRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No lecture records match the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredHistoryRecords.map((r) => {
                  const isFace = r.attendance_method === 'FACE_RECOGNITION';
                  const isMod = r.attendance_method === 'Manual Edit' || r.modified_by;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        {r.date}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">{r.subject}</span>
                        <span className="text-[10px] text-slate-400">{r.subject_code}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium">
                        {r.lecture_slot}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {getStatusBadge(r.status)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          {isFace && <Camera className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                          <span className="font-semibold text-slate-800">
                            {r.attendance_method === 'FACE_RECOGNITION' ? 'Face Recognition' : r.attendance_method}
                          </span>
                        </div>
                        {r.recognition_confidence && (
                          <span className="text-[10px] text-blue-600 font-bold block">
                            {Math.round(r.recognition_confidence * 100)}% Confidence
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500">
                        {isMod ? (
                          <div>
                            <span className="font-semibold text-blue-800 block">Edited by {r.modified_by}</span>
                            {r.original_method && (
                              <span className="text-[10px] text-slate-400">
                                Original: {r.original_method} {r.original_confidence ? `(${r.original_confidence})` : ''}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-xs transition"
                          >
                            <Edit3 className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* History Cards - Mobile View */}
        <div className="sm:hidden space-y-3">
          {filteredHistoryRecords.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-200">
              No lecture records match the filter criteria.
            </div>
          ) : (
            filteredHistoryRecords.map((r) => {
              const isFace = r.attendance_method === 'FACE_RECOGNITION';
              const isMod = r.attendance_method === 'Manual Edit' || r.modified_by;

              return (
                <div key={r.id} className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{r.date}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{r.lecture_slot}</div>
                    </div>
                    <div>{getStatusBadge(r.status)}</div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">{r.subject}</div>
                      <div className="text-[10px] text-slate-400">{r.subject_code}</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 justify-end">
                        {isFace && <Camera className="h-3 w-3 text-blue-600 shrink-0" />}
                        <span className="text-[11px] font-semibold text-slate-700">
                          {isFace ? 'Face Recog' : r.attendance_method}
                        </span>
                      </div>
                      {r.recognition_confidence && (
                        <span className="text-[10px] text-blue-600 font-bold block">
                          {Math.round(r.recognition_confidence * 100)}% match
                        </span>
                      )}
                    </div>
                  </div>

                  {isMod && (
                    <div className="text-[10px] bg-amber-50 text-amber-800 p-2 rounded-lg border border-amber-200">
                      <span className="font-semibold block">Edited by {r.modified_by}</span>
                      {r.original_method && (
                        <span className="text-amber-600">
                          Original: {r.original_method} {r.original_confidence ? `(${r.original_confidence})` : ''}
                        </span>
                      )}
                    </div>
                  )}

                  {canEdit && (
                    <button
                      onClick={() => handleOpenEdit(r)}
                      className="w-full min-h-[44px] flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-blue-50 active:bg-blue-600 text-blue-700 active:text-white font-bold text-xs transition"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Edit Attendance Record</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 6. Edit Attendance Modal (Requirement 5) */}
      {editRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0F172A] to-slate-900 p-5 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                  Admin Action Override
                </span>
                <h3 className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-blue-400" />
                  Edit Attendance Record
                </h3>
              </div>
              <button
                onClick={() => setEditRecord(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              {/* Target Details */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Student:</span>
                  <strong className="text-slate-900">{student?.full_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Date:</span>
                  <strong className="text-slate-900">{editRecord.date}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Subject:</span>
                  <strong className="text-slate-900">{editRecord.subject}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Current Status:</span>
                  <div>{getStatusBadge(editRecord.status)}</div>
                </div>
              </div>

              {/* Status Radio / Buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Change Status To:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['PRESENT', 'ABSENT', 'LEAVE', 'EXCUSED'].map((statusKey) => (
                    <button
                      type="button"
                      key={statusKey}
                      onClick={() => setEditStatus(statusKey)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                        editStatus === statusKey
                          ? statusKey === 'PRESENT'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-900/20'
                            : statusKey === 'ABSENT'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-900/20'
                            : statusKey === 'LEAVE'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                            : 'bg-amber-600 text-white border-amber-600 shadow-md'
                          : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{statusKey.charAt(0) + statusKey.slice(1).toLowerCase()}</span>
                      {editStatus === statusKey && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason Input (Requirement 5) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reason for Modification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  required
                  placeholder="e.g., Medical certificate submitted / False positive verified by HOD / Student in campus event"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  This note will be permanently logged in the audit trail with your username and timestamp.
                </p>
              </div>

              {/* Alert Feedback */}
              {editSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{editSuccessMsg}</span>
                </div>
              )}

              {editErrorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{editErrorMsg}</span>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditRecord(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-900/20 disabled:opacity-50 transition flex items-center gap-1.5"
                >
                  {savingEdit && <RotateCcw className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
