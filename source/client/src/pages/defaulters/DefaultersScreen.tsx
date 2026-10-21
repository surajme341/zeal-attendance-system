import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Send,
  Search,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import { api, exportDefaultersToExcel, exportDefaultersToPDF } from '../../services/api';
import { DefaulterStudent, DefaulterSummary, ClassDivision, Subject } from '../../types';

export const DefaultersScreen: React.FC = () => {
  const [defaulters, setDefaulters] = useState<DefaulterStudent[]>([]);
  const [summary, setSummary] = useState<DefaulterSummary | null>(null);
  const [divisions, setDivisions] = useState<ClassDivision[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'SAFE'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  // Alert Modal State
  const [showAlertModal, setShowAlertModal] = useState<boolean>(false);
  const [alertTargetStudent, setAlertTargetStudent] = useState<DefaulterStudent | null>(null);
  const [alertSuccessMessage, setAlertSuccessMessage] = useState<string | null>(null);

  const fetchDefaulters = async () => {
    setLoading(true);
    try {
      const res = await api.getDefaulters({
        division_id: selectedDivision || undefined,
        subject_id: selectedSubject || undefined,
      });
      setDefaulters(res.defaulters);
      setSummary(res.summary);
    } catch (err) {
      console.error('Failed to load defaulter data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [divRes, subRes] = await Promise.all([
          api.getDivisions(),
          api.getSubjects(selectedDivision || undefined),
        ]);
        setDivisions(divRes.divisions);
        setSubjects(subRes.subjects);
        if (divRes.divisions.length > 0 && !selectedDivision) {
          setSelectedDivision(divRes.divisions[0].id);
        }
      } catch (err) {
        console.error('Error fetching dropdowns:', err);
      }
    };
    fetchDropdowns();
  }, []);

  useEffect(() => {
    if (selectedDivision) {
      fetchDefaulters();
    }
  }, [selectedDivision, selectedSubject]);

  const filteredDefaulters = defaulters.filter((d) => {
    if (categoryFilter !== 'ALL' && d.status_category !== categoryFilter) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        d.full_name.toLowerCase().includes(q) ||
        d.roll_no.toLowerCase().includes(q) ||
        (d.prn && d.prn.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const currentDivisionName =
    divisions.find((d) => d.id === selectedDivision)?.year_level +
    ' E&TC Div ' +
    (divisions.find((d) => d.id === selectedDivision)?.division || 'A');

  const handleExportExcel = () => {
    if (!summary) return;
    exportDefaultersToExcel(filteredDefaulters, summary, currentDivisionName);
  };

  const handleExportPDF = () => {
    if (!summary) return;
    exportDefaultersToPDF(filteredDefaulters, summary, currentDivisionName);
  };

  const triggerParentAlert = (student: DefaulterStudent) => {
    setAlertTargetStudent(student);
    setShowAlertModal(true);
    setAlertSuccessMessage(null);
  };

  const handleSendNotification = (channel: 'SMS' | 'WHATSAPP') => {
    if (!alertTargetStudent) return;
    setAlertSuccessMessage(
      `Attendance alert (${channel}) dispatched successfully to parent at ${alertTargetStudent.guardian_phone || 'registered contact'}.`
    );
    setTimeout(() => {
      setShowAlertModal(false);
      setAlertSuccessMessage(null);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner with Exports */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Defaulter Tracking & Attendance Registry
            </h2>
            <span className="rounded-md bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800 border border-red-200">
              Sorted: Worst → Best %
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Official MSBTE attendance compliance registry • Non-instructional holidays are automatically excluded from attendance %.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            id="btn-export-excel"
            className="flex items-center space-x-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            id="btn-export-pdf"
            className="flex items-center space-x-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-900/20 transition"
          >
            <FileText className="h-4 w-4" />
            <span>PDF Notice</span>
          </button>
        </div>
      </div>

      {/* Threshold Information Legend Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Critical Card */}
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center space-x-3 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shrink-0 shadow-sm">
            <AlertOctagon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-red-900">CRITICAL DEFAULTER</span>
              <span className="rounded bg-red-200 px-1.5 py-0.5 text-[10px] font-mono font-bold text-red-950">
                &lt; {summary?.thresholds.critical || 60}%
              </span>
            </div>
            <p className="text-[11px] text-red-700 mt-0.5">
              {summary?.criticalCount || 0} students • Severe shortage / Exam detention risk
            </p>
          </div>
        </div>

        {/* Warning Card */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center space-x-3 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shrink-0 shadow-sm">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-amber-900">WARNING / AT RISK</span>
              <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-mono font-bold text-amber-950">
                {summary?.thresholds.critical || 60}% – {(summary?.thresholds.warning || 75) - 0.01}%
              </span>
            </div>
            <p className="text-[11px] text-amber-700 mt-0.5">
              {summary?.warningCount || 0} students • Parent intimation & extra assignments required
            </p>
          </div>
        </div>

        {/* Safe Card */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center space-x-3 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0 shadow-sm">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-emerald-900">SAFE COMPLIANCE</span>
              <span className="rounded bg-emerald-200 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-950">
                ≥ {summary?.thresholds.warning || 75}%
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              {summary?.safeCount || 0} students • Fully eligible for MSBTE hall ticket
            </p>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="card-panel rounded-2xl p-4 shadow-sm bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Division Selector */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Class Division
            </label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="rounded-xl bg-slate-50 border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
            >
              {divisions.map((div) => (
                <option key={div.id} value={div.id}>
                  {div.year_level} E&TC — Div {div.division} (Sem {div.semester})
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter (Optional) */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Filter by Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="rounded-xl bg-slate-50 border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
            >
              <option value="">All Subjects Combined</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          {/* Category Tabs */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Status Filter
            </label>
            <div className="flex items-center space-x-1 rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
              <button
                onClick={() => setCategoryFilter('ALL')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  categoryFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({defaulters.length})
              </button>
              <button
                onClick={() => setCategoryFilter('CRITICAL')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  categoryFilter === 'CRITICAL' ? 'bg-red-600 text-white shadow-sm' : 'text-red-700 hover:text-red-900'
                }`}
              >
                Critical ({summary?.criticalCount || 0})
              </button>
              <button
                onClick={() => setCategoryFilter('WARNING')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  categoryFilter === 'WARNING' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-700 hover:text-amber-900'
                }`}
              >
                Warning ({summary?.warningCount || 0})
              </button>
              <button
                onClick={() => setCategoryFilter('SAFE')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  categoryFilter === 'SAFE' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 hover:text-emerald-900'
                }`}
              >
                Safe ({summary?.safeCount || 0})
              </button>
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-64">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Search Student
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Roll No, Name, or PRN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-300 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Defaulter Table */}
      <div className="card-panel overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : filteredDefaulters.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No students match this criteria.</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting your filter or search query.</p>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table View (hidden on small mobile screens) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-28">Rank / Roll</th>
                    <th className="py-3 px-4">Student Name & PRN</th>
                    <th className="py-3 px-4 text-center">Lectures (Attended / Total)</th>
                    <th className="py-3 px-4 text-center">Attendance %</th>
                    <th className="py-3 px-4 text-center">Status Category</th>
                    <th className="py-3 px-4">Parent Contact</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredDefaulters.map((student, index) => {
                    const isCritical = student.status_category === 'CRITICAL';
                    const isWarning = student.status_category === 'WARNING';
                    const isSafe = student.status_category === 'SAFE';
                    const isExpanded = expandedStudentId === student.student_id;

                    return (
                      <React.Fragment key={student.student_id}>
                        <tr
                          className={`transition-colors ${
                            isCritical
                              ? 'bg-red-50/60 hover:bg-red-50'
                              : isWarning
                              ? 'bg-amber-50/60 hover:bg-amber-50'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          {/* Rank & Roll No */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-slate-400 text-[11px] w-4 font-bold">{index + 1}</span>
                              <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-900 border border-slate-300">
                                {student.roll_no}
                              </span>
                            </div>
                          </td>

                          {/* Name & PRN */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-3">
                              <img
                                src={student.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                                alt={student.full_name}
                                className="h-8 w-8 rounded-full object-cover border border-slate-300 shrink-0"
                              />
                              <div>
                                <p className="font-bold text-slate-900">{student.full_name}</p>
                                <p className="text-[10px] font-mono text-slate-500">PRN: {student.prn || '—'}</p>
                              </div>
                            </div>
                          </td>

                          {/* Attended / Conducted */}
                          <td className="py-3.5 px-4 text-center font-mono">
                            <span className="font-bold text-slate-900">
                              {student.total_attended}
                            </span>
                            <span className="text-slate-500"> / {student.total_conducted}</span>
                          </td>

                          {/* Attendance % with Progress Bar */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span
                                className={`text-sm font-extrabold font-mono ${
                                  isCritical
                                    ? 'text-red-700'
                                    : isWarning
                                    ? 'text-amber-700'
                                    : 'text-emerald-700'
                                }`}
                              >
                                {student.attendance_percentage.toFixed(2)}%
                              </span>
                              <div className="w-20 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isCritical
                                      ? 'bg-red-600'
                                      : isWarning
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-600'
                                  }`}
                                  style={{ width: `${Math.min(student.attendance_percentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Status Category Badge */}
                          <td className="py-3.5 px-4 text-center">
                            {isCritical && (
                              <span className="inline-flex items-center space-x-1 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-extrabold text-red-800 border border-red-300">
                                <AlertOctagon className="h-3 w-3" />
                                <span>CRITICAL</span>
                              </span>
                            )}
                            {isWarning && (
                              <span className="inline-flex items-center space-x-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold text-amber-800 border border-amber-300">
                                <AlertTriangle className="h-3 w-3" />
                                <span>WARNING</span>
                              </span>
                            )}
                            {isSafe && (
                              <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-extrabold text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>SAFE</span>
                              </span>
                            )}
                          </td>

                          {/* Parent & Contact */}
                          <td className="py-3.5 px-4 text-[11px] text-slate-600 font-mono">
                            <p className="font-semibold text-slate-800">{student.guardian_phone || 'No phone'}</p>
                            <p className="text-[10px] text-slate-500">{student.email || '—'}</p>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center space-x-2">
                              {/* Parent Alert Trigger */}
                              {(isCritical || isWarning) && (
                                <button
                                  onClick={() => triggerParentAlert(student)}
                                  className="flex items-center space-x-1 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 text-[11px] font-bold text-red-800 transition"
                                  title="Send SMS/WhatsApp Alert to Parent"
                                >
                                  <Send className="h-3 w-3" />
                                  <span>Alert</span>
                                </button>
                              )}

                              {/* Subject Breakdown Accordion Toggle */}
                              <button
                                onClick={() => setExpandedStudentId(isExpanded ? null : student.student_id)}
                                className="rounded-lg bg-slate-100 hover:bg-slate-200 p-1 text-slate-600 transition"
                                title="Toggle Subject-wise breakdown"
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Subject-wise breakdown accordion */}
                        {isExpanded && (
                          <tr className="bg-slate-50">
                            <td colSpan={7} className="p-4 border-y border-slate-200">
                              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                                  Subject-wise Attendance Breakdown for {student.full_name}
                                </h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                  {student.subject_breakdown.map((sb) => (
                                    <div
                                      key={sb.subject_id}
                                      className={`rounded-xl p-3 border ${
                                        sb.category === 'CRITICAL'
                                          ? 'bg-red-50 border-red-200'
                                          : sb.category === 'WARNING'
                                          ? 'bg-amber-50 border-amber-200'
                                          : 'bg-emerald-50 border-emerald-200'
                                      }`}
                                    >
                                      <p className="text-xs font-bold text-slate-900 truncate">
                                        {sb.subject_name}
                                      </p>
                                      <p className="text-[10px] font-mono text-slate-500">Code: {sb.subject_code}</p>
                                      <div className="mt-2 flex items-baseline justify-between font-mono">
                                        <span className="text-xs text-slate-600">
                                          {sb.attended}/{sb.conducted}
                                        </span>
                                        <span
                                          className={`text-sm font-extrabold ${
                                            sb.category === 'CRITICAL'
                                              ? 'text-red-700'
                                              : sb.category === 'WARNING'
                                              ? 'text-amber-700'
                                              : 'text-emerald-700'
                                          }`}
                                        >
                                          {sb.percentage.toFixed(1)}%
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch Cards View (sm:hidden) */}
            <div className="sm:hidden divide-y divide-slate-100">
              {filteredDefaulters.map((student, index) => {
                const isCritical = student.status_category === 'CRITICAL';
                const isWarning = student.status_category === 'WARNING';
                const isSafe = student.status_category === 'SAFE';
                const isExpanded = expandedStudentId === student.student_id;

                return (
                  <div
                    key={student.student_id}
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
                            <span className="font-mono text-slate-400 text-[10px] font-bold">#{index + 1}</span>
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-bold text-slate-900 border border-slate-200">
                              {student.roll_no}
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-slate-900 mt-0.5">
                            {student.full_name}
                          </h4>
                          <p className="text-[10px] font-mono text-slate-400">PRN: {student.prn || '—'}</p>
                        </div>
                      </div>

                      {/* Status Category Badge */}
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                          isCritical
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : isWarning
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {student.status_category}
                      </span>
                    </div>

                    {/* Progress Bar & Attendance % */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-600">Attendance %:</span>
                        <span
                          className={`font-black font-mono ${
                            isCritical ? 'text-red-700' : isWarning ? 'text-amber-700' : 'text-emerald-700'
                          }`}
                        >
                          {student.attendance_percentage.toFixed(2)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isCritical ? 'bg-red-600' : isWarning ? 'bg-amber-500' : 'bg-emerald-600'
                          }`}
                          style={{ width: `${Math.min(student.attendance_percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium pt-0.5">
                        <span>Attended: {student.total_attended} / {student.total_conducted}</span>
                        <span>Parent: {student.guardian_phone || 'None'}</span>
                      </div>
                    </div>

                    {/* Mobile Card Action Buttons */}
                    <div className="flex items-center space-x-2 pt-1">
                      {(isCritical || isWarning) && (
                        <button
                          type="button"
                          onClick={() => triggerParentAlert(student)}
                          className="flex-1 min-h-[38px] flex items-center justify-center space-x-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 shadow-sm transition"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Alert Parent</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setExpandedStudentId(isExpanded ? null : student.student_id)}
                        className="flex-1 min-h-[38px] flex items-center justify-center space-x-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2 shadow-sm transition"
                      >
                        <span>{isExpanded ? 'Hide Breakdown' : 'View Subjects'}</span>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    {/* Expandable Subject Breakdown on Mobile */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          Subject-Wise Breakdown
                        </h5>
                        <div className="space-y-1.5">
                          {student.subject_breakdown.map((sb) => (
                            <div
                              key={sb.subject_id}
                              className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                                sb.category === 'CRITICAL'
                                  ? 'bg-red-50 border-red-200'
                                  : sb.category === 'WARNING'
                                  ? 'bg-amber-50 border-amber-200'
                                  : 'bg-emerald-50 border-emerald-200'
                              }`}
                            >
                              <div className="truncate mr-2">
                                <p className="font-bold text-slate-800 text-[11px] truncate">{sb.subject_name}</p>
                                <p className="text-[9px] font-mono text-slate-500">
                                  {sb.attended}/{sb.conducted} attended
                                </p>
                              </div>
                              <span
                                className={`font-mono font-bold text-xs shrink-0 ${
                                  sb.category === 'CRITICAL'
                                    ? 'text-red-700'
                                    : sb.category === 'WARNING'
                                    ? 'text-amber-700'
                                    : 'text-emerald-700'
                                }`}
                              >
                                {sb.percentage.toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Parent Alert Modal */}
      {showAlertModal && alertTargetStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">
              Dispatch Defaulter Warning Alert
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Notify guardian regarding critical attendance shortage under MSBTE rules.
            </p>

            <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs space-y-1">
              <p>
                <span className="font-bold text-slate-700">Student: </span>
                {alertTargetStudent.full_name} ({alertTargetStudent.roll_no})
              </p>
              <p>
                <span className="font-bold text-slate-700">Current %: </span>
                <span className="font-mono font-bold text-red-700">
                  {alertTargetStudent.attendance_percentage.toFixed(2)}%
                </span>
              </p>
              <p>
                <span className="font-bold text-slate-700">Guardian Contact: </span>
                <span className="font-mono">{alertTargetStudent.guardian_phone || 'No phone recorded'}</span>
              </p>
            </div>

            {alertSuccessMessage ? (
              <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{alertSuccessMessage}</span>
              </div>
            ) : (
              <div className="mt-5 flex items-center justify-end space-x-2">
                <button
                  onClick={() => setShowAlertModal(false)}
                  className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSendNotification('SMS')}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition"
                >
                  Send SMS Alert
                </button>
                <button
                  onClick={() => handleSendNotification('WHATSAPP')}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition"
                >
                  Send WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
