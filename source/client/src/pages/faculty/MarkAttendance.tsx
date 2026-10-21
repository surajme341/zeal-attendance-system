import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare,
  XSquare,
  Clock,
  Save,
  CheckCircle2,
  Calendar,
  Layers,
  History,
  AlertCircle,
  Sparkles,
  WifiOff,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  UserCheck,
  UserX,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { ClassDivision, Subject, Student, AttendanceStatus, AttendanceSession, DefaulterStudent } from '../../types';

export const MarkAttendance: React.FC = () => {
  const { user, role } = useAuth();
  const { isOnline, queueSession } = useOffline();

  const [divisions, setDivisions] = useState<ClassDivision[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [defaulterMap, setDefaulterMap] = useState<Record<string, DefaulterStudent>>({});
  const [recentSessions, setRecentSessions] = useState<AttendanceSession[]>([]);

  // Selection form
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [lectureSlot, setLectureSlot] = useState<string>('09:15 - 10:15');
  const [roomNo, setRoomNo] = useState<string>('Classroom 204');

  // Search & Sorting for spreadsheet table
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<'roll_no' | 'full_name'>('roll_no');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Attendance state per student: studentId -> AttendanceStatus
  const [attendanceState, setAttendanceState] = useState<Record<string, AttendanceStatus>>({});

  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Past Session Modal
  const [viewingPastSession, setViewingPastSession] = useState<any | null>(null);
  const [editReason, setEditReason] = useState<string>('');
  const [editTargetRecord, setEditTargetRecord] = useState<any | null>(null);

  const lectureSlots = [
    '09:15 - 10:15',
    '10:15 - 11:15',
    '11:30 - 12:30',
    '12:30 - 01:30',
    '02:15 - 03:15',
    '03:15 - 04:15',
    '04:15 - 05:15',
  ];

  // 1. Load Divisions & Subjects
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [divRes, subRes] = await Promise.all([api.getDivisions(), api.getSubjects()]);
        setDivisions(divRes.divisions);
        setSubjects(subRes.subjects);

        if (divRes.divisions.length > 0) {
          setSelectedDivision(divRes.divisions[0].id);
        }
      } catch (err) {
        console.error('Error loading metadata:', err);
      }
    };
    fetchInitial();
  }, []);

  const filteredSubjects = subjects.filter(
    (s) => !selectedDivision || s.division_id === selectedDivision
  );

  useEffect(() => {
    if (filteredSubjects.length > 0 && (!selectedSubject || !filteredSubjects.some(s => s.id === selectedSubject))) {
      setSelectedSubject(filteredSubjects[0].id);
    }
  }, [selectedDivision, filteredSubjects]);

  // 2. Load Students and Defaulter Stats for Division (for inline risk indicators)
  const loadStudentsAndDefaulters = async () => {
    if (!selectedDivision) return;
    setLoadingStudents(true);
    try {
      const [studRes, defRes] = await Promise.all([
        api.getStudents(selectedDivision),
        api.getDefaulters({ division_id: selectedDivision }),
      ]);
      setStudents(studRes.students);

      // Build map of studentId -> defaulter data for inline badges
      const dMap: Record<string, DefaulterStudent> = {};
      defRes.defaulters.forEach((d) => {
        dMap[d.student_id] = d;
      });
      setDefaulterMap(dMap);

      // Default all students to PRESENT initially for speed (one-click flips absentees)
      const initialMap: Record<string, AttendanceStatus> = {};
      studRes.students.forEach((s) => {
        initialMap[s.id] = 'PRESENT';
      });
      setAttendanceState(initialMap);
    } catch (err) {
      console.error('Failed to load students for division:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    loadStudentsAndDefaulters();
  }, [selectedDivision]);

  // 3. Load Recent Sessions for Past History & Edit Window
  const fetchRecent = async () => {
    try {
      const res = await api.getSessions({ division_id: selectedDivision || undefined });
      setRecentSessions(res.sessions);
    } catch (err) {
      console.error('Failed to fetch recent sessions:', err);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, [selectedDivision]);

  // 4. Status Toggle Helper
  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceState((prev) => ({ ...prev, [studentId]: status }));
  };

  const cycleStatus = (studentId: string) => {
    setAttendanceState((prev) => {
      const current = prev[studentId] || 'PRESENT';
      let next: AttendanceStatus = 'ABSENT';
      if (current === 'PRESENT') next = 'ABSENT';
      else if (current === 'ABSENT') next = 'LATE';
      else next = 'PRESENT';
      return { ...prev, [studentId]: next };
    });
  };

  // "Mark All Present" One-Click Shortcut
  const markAll = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceState(updated);
  };

  // Live Counter Calculations
  const totalCount = students.length;
  const presentCount = Object.values(attendanceState).filter((s) => s === 'PRESENT').length;
  const absentCount = Object.values(attendanceState).filter((s) => s === 'ABSENT').length;
  const lateCount = Object.values(attendanceState).filter((s) => s === 'LATE').length;

  // Filter and Sort Students for Spreadsheet Table
  const sortedAndFilteredStudents = useMemo(() => {
    let result = [...students];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.roll_no.toLowerCase().includes(q) ||
          s.full_name.toLowerCase().includes(q) ||
          (s.prn && s.prn.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'roll_no') {
        comparison = a.roll_no.localeCompare(b.roll_no, undefined, { numeric: true });
      } else {
        comparison = a.full_name.localeCompare(b.full_name);
      }
      return sortAsc ? comparison : -comparison;
    });

    return result;
  }, [students, searchQuery, sortField, sortAsc]);

  const toggleSort = (field: 'roll_no' | 'full_name') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // 5. Submit Attendance
  const handleSubmitAttendance = async () => {
    if (!selectedSubject || !selectedDivision || students.length === 0) {
      setFeedbackMessage({ type: 'error', text: 'Please select a Subject and Division.' });
      return;
    }

    setSubmitting(true);
    setFeedbackMessage(null);

    const records = Object.entries(attendanceState).map(([studentId, status]) => ({
      student_id: studentId,
      status,
    }));

    try {
      if (!isOnline) {
        queueSession({
          subject_id: selectedSubject,
          division_id: selectedDivision,
          session_date: selectedDate,
          lecture_slot: lectureSlot,
          room_no: roomNo,
          records,
        });

        setFeedbackMessage({
          type: 'success',
          text: `Offline Mode: Recorded ${records.length} students locally. Will auto-sync when network returns.`,
        });
      } else {
        await api.markAttendance({
          subject_id: selectedSubject,
          division_id: selectedDivision,
          session_date: selectedDate,
          lecture_slot: lectureSlot,
          room_no: roomNo,
          records,
          source: 'MANUAL',
        });

        setFeedbackMessage({
          type: 'success',
          text: `Attendance saved successfully! (${presentCount} Present, ${absentCount} Absent, ${lateCount} Late).`,
        });
        fetchRecent();
        loadStudentsAndDefaulters();
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to submit attendance.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Past Session Detail & Audit Edit
  const openSessionDetail = async (sessionId: string) => {
    try {
      const details = await api.getSessionDetails(sessionId);
      setViewingPastSession(details);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdatePastRecord = async (newStatus: AttendanceStatus) => {
    if (!editTargetRecord || !editReason.trim()) {
      alert('Please specify an audit reason for modifying this attendance record.');
      return;
    }

    try {
      await api.updateRecord(editTargetRecord.id, newStatus, editReason.trim());
      alert(`Updated ${editTargetRecord.student_name} to ${newStatus} (Audit Logged).`);
      setEditTargetRecord(null);
      setEditReason('');
      if (viewingPastSession) {
        openSessionDetail(viewingPastSession.session.id);
      }
      fetchRecent();
      loadStudentsAndDefaulters();
    } catch (err: any) {
      alert(err.message || 'Failed to update record');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Daily Attendance Marking Sheet</span>
            <span className="rounded-md bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 border border-blue-200">
              Interactive Sheet
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Zeal College Faculty Portal • Mark attendance, view inline defaulter risk alerts, and review audit history.
          </p>
        </div>

        {!isOnline && (
          <div className="flex items-center space-x-2 rounded-xl bg-amber-100 px-3 py-1.5 text-xs text-amber-800 border border-amber-300">
            <WifiOff className="h-4 w-4 text-amber-600" />
            <span className="font-medium">Offline Mode: Attendance will be queued locally</span>
          </div>
        )}
      </div>

      {/* Configuration Controls Bar (Division, Subject, Date, Slot, Room) */}
      <div className="card-panel rounded-2xl p-5 shadow-sm bg-white">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Division Selector */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Class Division
            </label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-600 focus:bg-white focus:outline-none"
            >
              {divisions.map((div) => (
                <option key={div.id} value={div.id}>
                  {div.year_level} E&TC — Div {div.division} (Sem {div.semester})
                </option>
              ))}
            </select>
          </div>

          {/* Subject Selector */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-600 focus:bg-white focus:outline-none"
            >
              {filteredSubjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          {/* Date Selector */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Lecture Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Lecture Slot */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Time Slot
            </label>
            <select
              value={lectureSlot}
              onChange={(e) => setLectureSlot(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-600 focus:bg-white focus:outline-none"
            >
              {lectureSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          {/* Classroom / Lab */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Classroom / Lab
            </label>
            <input
              type="text"
              value={roomNo}
              onChange={(e) => setRoomNo(e.target.value)}
              placeholder="e.g. Lab 204"
              className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Sticky Action Toolbar & Live Counter Strip */}
      <div className="card-panel rounded-2xl p-4 shadow-sm bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Live Counters as mandated by Section 5.2 */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-800 border border-slate-200">
            <span>Total: {totalCount}</span>
          </div>
          <div className="flex items-center space-x-1.5 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-300">
            <CheckSquare className="h-4 w-4 text-emerald-600" />
            <span>Present: {presentCount}</span>
          </div>
          <div className="flex items-center space-x-1.5 rounded-xl bg-red-100 px-3 py-1.5 text-xs font-bold text-red-800 border border-red-300">
            <XSquare className="h-4 w-4 text-red-600" />
            <span>Absent: {absentCount}</span>
          </div>
          {lateCount > 0 && (
            <div className="flex items-center space-x-1.5 rounded-xl bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800 border border-amber-300">
              <Clock className="h-4 w-4 text-amber-600" />
              <span>Late: {lateCount}</span>
            </div>
          )}
        </div>

        {/* Search Box & Shortcuts & Primary Save Action */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search roll no or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white w-48 sm:w-56"
            />
          </div>

          {/* "Mark all Present" Shortcut (Section 5.2 requirement) */}
          <button
            onClick={() => markAll('PRESENT')}
            id="btn-mark-all-present"
            className="flex items-center space-x-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition"
            title="Mark all students Present (flip only absentees)"
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Mark All Present</span>
          </button>

          <button
            onClick={() => markAll('ABSENT')}
            className="flex items-center space-x-1 rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-300 transition"
          >
            <UserX className="h-3.5 w-3.5 text-slate-500" />
            <span>Mark All Absent</span>
          </button>

          {/* Primary Save Button (Royal Blue) */}
          <button
            onClick={handleSubmitAttendance}
            disabled={submitting || students.length === 0}
            id="btn-submit-attendance"
            className="flex items-center space-x-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-900/30 transition disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{submitting ? 'Saving...' : 'Submit Attendance'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Message */}
      {feedbackMessage && (
        <div
          className={`rounded-xl p-3.5 text-xs font-semibold border flex items-center space-x-2 shadow-sm ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-red-50 text-red-900 border-red-300'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* SPREADSHEET-STYLE ATTENDANCE TABLE (Section 5.2 requirement) */}
      <div className="card-panel rounded-2xl shadow-sm bg-white overflow-hidden border border-slate-200">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Student Attendance Sheet ({sortedAndFilteredStudents.length} of {students.length} students)
            </span>
            <span className="text-[11px] text-slate-500">
              • Tap any row or status toggle to update
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Critical Defaulter (&lt;60%)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>At Risk (60–74.99%)</span>
            </span>
          </div>
        </div>

        {loadingStudents ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : sortedAndFilteredStudents.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p className="text-sm font-semibold">No students match your filter.</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-xs font-medium text-blue-600 hover:underline"
            >
              Clear search filter
            </button>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table View (hidden on small mobile screens) */}
            <div className="hidden sm:block overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                {/* Sticky Table Header */}
                <thead className="sticky top-0 z-20 bg-slate-100 text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200 shadow-sm">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th
                      onClick={() => toggleSort('roll_no')}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-200 transition select-none w-32"
                    >
                      <div className="flex items-center space-x-1 font-bold">
                        <span>Roll No</span>
                        {sortField === 'roll_no' ? (
                          sortAsc ? <ArrowUp className="h-3.5 w-3.5 text-blue-600" /> : <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-3 w-14 text-center">Photo</th>
                    <th
                      onClick={() => toggleSort('full_name')}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-200 transition select-none"
                    >
                      <div className="flex items-center space-x-1 font-bold">
                        <span>Student Full Name</span>
                        {sortField === 'full_name' ? (
                          sortAsc ? <ArrowUp className="h-3.5 w-3.5 text-blue-600" /> : <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-4 w-44 font-bold">PRN & Contact</th>
                    {/* Inline Defaulter Risk Header */}
                    <th className="py-3 px-4 w-52 font-bold">
                      Cumulative Attendance (Risk)
                    </th>
                    <th className="py-3 px-4 w-60 text-center font-bold">
                      Today's Attendance Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {sortedAndFilteredStudents.map((student, idx) => {
                    const status = attendanceState[student.id] || 'PRESENT';
                    const isPresent = status === 'PRESENT';
                    const isAbsent = status === 'ABSENT';
                    const isLate = status === 'LATE';

                    // Defaulter info for inline highlighting
                    const defInfo = defaulterMap[student.id];
                    const isCritical = defInfo?.status_category === 'CRITICAL';
                    const isWarning = defInfo?.status_category === 'WARNING';
                    const currentPct = defInfo ? defInfo.attendance_percentage : null;

                    return (
                      <tr
                        key={student.id}
                        className={`transition-colors select-none ${
                          isCritical
                            ? 'bg-red-50/50 hover:bg-red-50 border-l-4 border-l-red-500'
                            : isWarning
                            ? 'bg-amber-50/50 hover:bg-amber-50 border-l-4 border-l-amber-500'
                            : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                        }`}
                      >
                        {/* Serial Number */}
                        <td className="py-3 px-4 text-center font-mono text-slate-400 text-[11px]">
                          {idx + 1}
                        </td>

                        {/* Roll Number */}
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                          <span className="rounded bg-slate-100 px-2 py-0.5 border border-slate-300">
                            {student.roll_no}
                          </span>
                        </td>

                        {/* Photo Thumbnail */}
                        <td className="py-3 px-3 text-center">
                          <img
                            src={student.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                            alt={student.full_name}
                            className="h-8 w-8 rounded-full object-cover border border-slate-300 inline-block shadow-sm"
                          />
                        </td>

                        {/* Student Full Name */}
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">{student.full_name}</p>
                          {student.email && (
                            <p className="text-[10px] text-slate-500">{student.email}</p>
                          )}
                        </td>

                        {/* PRN & Contact */}
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          <p className="font-medium text-slate-700">PRN: {student.prn || '—'}</p>
                          <p className="text-[10px] text-slate-500">{student.phone || '—'}</p>
                        </td>

                        {/* Inline Defaulter Risk Badge */}
                        <td className="py-3 px-4">
                          {defInfo ? (
                            <div className="flex flex-col">
                              <div className="flex items-center space-x-1.5">
                                <span
                                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    isCritical
                                      ? 'bg-red-100 text-red-800 border border-red-300'
                                      : isWarning
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  }`}
                                >
                                  {isCritical ? '🔴 Critical' : isWarning ? '🟡 Warning' : '🟢 Safe'}{' '}
                                  {currentPct?.toFixed(1)}%
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 mt-0.5">
                                {defInfo.total_attended} / {defInfo.total_conducted} attended
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">Calculating...</span>
                          )}
                        </td>

                        {/* Status Action Buttons (One-Tap Fast Marking) */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
                            {/* Present Button */}
                            <button
                              type="button"
                              onClick={() => setStatus(student.id, 'PRESENT')}
                              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                                isPresent
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              P
                            </button>

                            {/* Absent Button */}
                            <button
                              type="button"
                              onClick={() => setStatus(student.id, 'ABSENT')}
                              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                                isAbsent
                                  ? 'bg-red-600 text-white shadow-sm'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              A
                            </button>

                            {/* Late Button */}
                            <button
                              type="button"
                              onClick={() => setStatus(student.id, 'LATE')}
                              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                                isLate
                                  ? 'bg-amber-500 text-white shadow-sm'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              L
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch-Friendly Card View (sm:hidden) */}
            <div className="sm:hidden divide-y divide-slate-100">
              {sortedAndFilteredStudents.map((student, idx) => {
                const status = attendanceState[student.id] || 'PRESENT';
                const isPresent = status === 'PRESENT';
                const isAbsent = status === 'ABSENT';
                const isLate = status === 'LATE';

                const defInfo = defaulterMap[student.id];
                const isCritical = defInfo?.status_category === 'CRITICAL';
                const isWarning = defInfo?.status_category === 'WARNING';
                const currentPct = defInfo ? defInfo.attendance_percentage : null;

                return (
                  <div
                    key={student.id}
                    className={`p-3.5 space-y-3 transition-colors ${
                      isCritical
                        ? 'bg-red-50/40 border-l-4 border-l-red-500'
                        : isWarning
                        ? 'bg-amber-50/40 border-l-4 border-l-amber-500'
                        : 'border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={student.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                          alt={student.full_name}
                          className="h-10 w-10 rounded-full object-cover border border-slate-300 shadow-sm shrink-0"
                        />
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {student.roll_no}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              PRN: {student.prn || '—'}
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-slate-900 mt-0.5">
                            {student.full_name}
                          </h4>
                        </div>
                      </div>

                      {defInfo && (
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                            isCritical
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : isWarning
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {currentPct?.toFixed(0)}%
                        </span>
                      )}
                    </div>

                    {/* Touch-Friendly Segmented Status Buttons (>= 44px touch target) */}
                    <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setStatus(student.id, 'PRESENT')}
                        className={`min-h-[42px] flex items-center justify-center space-x-1 rounded-lg text-xs font-bold transition-all ${
                          isPresent
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-white/60 text-slate-600 hover:bg-white hover:text-slate-900'
                        }`}
                      >
                        <span>✓ Present</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStatus(student.id, 'ABSENT')}
                        className={`min-h-[42px] flex items-center justify-center space-x-1 rounded-lg text-xs font-bold transition-all ${
                          isAbsent
                            ? 'bg-red-600 text-white shadow-md'
                            : 'bg-white/60 text-slate-600 hover:bg-white hover:text-slate-900'
                        }`}
                      >
                        <span>✗ Absent</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStatus(student.id, 'LATE')}
                        className={`min-h-[42px] flex items-center justify-center space-x-1 rounded-lg text-xs font-bold transition-all ${
                          isLate
                            ? 'bg-amber-500 text-white shadow-md'
                            : 'bg-white/60 text-slate-600 hover:bg-white hover:text-slate-900'
                        }`}
                      >
                        <span>⏱ Late</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Lecture History & 24h Edit Window Section */}
      <div className="card-panel rounded-2xl p-5 shadow-sm bg-white border border-slate-200">
        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <History className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Conducted Lecture History & 24-Hour Edit Window
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Recent sessions • Modifications require an audit justification
          </span>
        </div>

        {recentSessions.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No past attendance sessions recorded.</p>
        ) : (
          <div className="divide-y divide-slate-200">
            {recentSessions.map((sess) => (
              <div key={sess.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{sess.subject_name}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600">
                      {sess.subject_code}
                    </span>
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                      {sess.division_name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Date: {sess.session_date} • Slot: {sess.lecture_slot} • Room: {sess.room_no} • Faculty: {sess.faculty_name}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-emerald-700 font-semibold">{sess.present_count} Present</span>
                  <span className="text-red-700 font-semibold">{sess.absent_count} Absent</span>
                  {sess.late_count ? (
                    <span className="text-amber-700 font-semibold">{sess.late_count} Late</span>
                  ) : null}
                  <button
                    onClick={() => openSessionDetail(sess.id)}
                    className="rounded-lg bg-slate-100 hover:bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-300 transition"
                  >
                    View / Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Session Detail & Audit Edit Modal */}
      {viewingPastSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {viewingPastSession.session.subject_name}
                </h3>
                <p className="text-xs text-slate-500">
                  {viewingPastSession.session.session_date} • {viewingPastSession.session.lecture_slot} • Faculty: {viewingPastSession.session.faculty_name}
                </p>
              </div>
              <button
                onClick={() => {
                  setViewingPastSession(null);
                  setEditTargetRecord(null);
                  setEditReason('');
                }}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            {/* Edit Lock Notice */}
            {!viewingPastSession.isEditable && (
              <div className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 border border-amber-300 flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Edit Window Locked</p>
                  <p className="text-[11px] text-amber-800">
                    {viewingPastSession.editRestrictionReason || 'The 24-hour edit window has expired. Super Admin override is required.'}
                  </p>
                </div>
              </div>
            )}

            {/* Target Edit Form if selected */}
            {editTargetRecord && (
              <div className="mb-4 rounded-xl bg-blue-50 border border-blue-200 p-4">
                <h4 className="text-xs font-bold text-blue-900 mb-2">
                  Modify Record for {editTargetRecord.student_name} ({editTargetRecord.roll_no})
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-blue-950 block mb-1">
                      Mandatory Audit Reason (Compliance Trail)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Medical certificate approved by HOD / late entry verified"
                      value={editReason}
                      onChange={(e) => setEditReason(e.target.value)}
                      className="w-full rounded-lg bg-white border border-blue-300 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleUpdatePastRecord('PRESENT')}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1 text-xs font-bold text-white shadow-sm"
                    >
                      Set Present
                    </button>
                    <button
                      onClick={() => handleUpdatePastRecord('ABSENT')}
                      className="rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1 text-xs font-bold text-white shadow-sm"
                    >
                      Set Absent
                    </button>
                    <button
                      onClick={() => handleUpdatePastRecord('LATE')}
                      className="rounded-lg bg-amber-500 hover:bg-amber-600 px-3 py-1 text-xs font-bold text-white shadow-sm"
                    >
                      Set Late
                    </button>
                    <button
                      onClick={() => setEditTargetRecord(null)}
                      className="rounded-lg bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* List of records in past session */}
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {viewingPastSession.records.map((rec: any) => (
                <div key={rec.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-slate-900 w-16">{rec.roll_no}</span>
                    <span className="font-medium text-slate-800">{rec.student_name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        rec.status === 'PRESENT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rec.status === 'ABSENT'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rec.status}
                    </span>
                    {viewingPastSession.isEditable && (
                      <button
                        onClick={() => {
                          setEditTargetRecord(rec);
                          setEditReason('');
                        }}
                        className="text-xs text-blue-600 font-semibold hover:underline"
                      >
                        Change
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
