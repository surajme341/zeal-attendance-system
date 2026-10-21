import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Eye,
  RefreshCw,
  Sparkles,
  CalendarCheck,
  ArrowRight,
  X,
  Trash2,
} from 'lucide-react';
import { api } from '../../services/api';
import { StudentAttendanceListItem } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface StudentListPageProps {
  onSelectStudent: (studentId: string) => void;
}

export const StudentListPage: React.FC<StudentListPageProps> = ({ onSelectStudent }) => {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

  const [students, setStudents] = useState<StudentAttendanceListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [activeFilter, setActiveFilter] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ACTIVE');
  const [sortBy, setSortBy] = useState<'roll' | 'name' | 'attendance'>('roll');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Delete student confirmation state
  const [studentToDelete, setStudentToDelete] = useState<StudentAttendanceListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.getStudentAttendanceList({
        active_status: activeFilter,
      });
      setStudents(res.students || []);
    } catch (err) {
      console.error('Failed to load student attendance list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [activeFilter]);

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteStudent(studentToDelete.id || studentToDelete.db_id);
      setStudentToDelete(null);
      fetchStudents();
    } catch (err: any) {
      alert(err.message || 'Failed to delete student.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Compute available filter options dynamically from students
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.class) set.add(s.class);
      else if (s.class_name) set.add(s.class_name);
    });
    return Array.from(set).sort();
  }, [students]);

  const availableDivisions = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.division) set.add(s.division);
    });
    return Array.from(set).sort();
  }, [students]);

  // KPIs
  const totalStudents = students.length;
  const safeCount = students.filter((s) => s.status_category === 'SAFE' || s.status === 'Safe').length;
  const warningCount = students.filter((s) => s.status_category === 'WARNING' || s.status === 'Warning').length;
  const criticalCount = students.filter((s) => s.status_category === 'CRITICAL' || s.status === 'Critical').length;
  const avgAttendance = totalStudents > 0
    ? Math.round((students.reduce((acc, s) => acc + s.attendance_percentage, 0) / totalStudents) * 10) / 10
    : 0;

  // Filtered & Sorted students
  const filteredStudents = useMemo(() => {
    let list = [...students];

    // Search query: Student Name or Student ID / Roll No or PRN
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.full_name?.toLowerCase().includes(q) ||
          s.name?.toLowerCase().includes(q) ||
          s.roll_no?.toLowerCase().includes(q) ||
          s.student_id?.toLowerCase().includes(q) ||
          (s.prn && s.prn.toLowerCase().includes(q))
      );
    }

    // Year filter (FY, SY, TY)
    if (selectedYear !== 'ALL') {
      list = list.filter((s) => {
        const yr = (s.year || s.year_level || '').toUpperCase();
        if (yr === selectedYear.toUpperCase()) return true;
        const cls = (s.class || s.class_name || '').toUpperCase();
        if (selectedYear === 'FY' && (cls.includes('FY') || cls.includes('FIRST YEAR'))) return true;
        if (selectedYear === 'SY' && (cls.includes('SY') || cls.includes('SECOND YEAR'))) return true;
        if (selectedYear === 'TY' && (cls.includes('TY') || cls.includes('THIRD YEAR'))) return true;
        return false;
      });
    }

    // Division filter (Division A, B, C, D)
    if (selectedDivision !== 'ALL') {
      const targetDiv = selectedDivision.replace(/Division\s*/i, '').trim().toUpperCase();
      list = list.filter((s) => {
        const div = (s.division || '').replace(/Division\s*/i, '').trim().toUpperCase();
        return div === targetDiv;
      });
    }

    // Status filter
    if (selectedStatus !== 'ALL') {
      list = list.filter((s) => s.status_category === selectedStatus || s.status.toUpperCase() === selectedStatus);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'name') {
        const comp = a.full_name.localeCompare(b.full_name);
        return sortOrder === 'asc' ? comp : -comp;
      }
      if (sortBy === 'attendance') {
        const comp = a.attendance_percentage - b.attendance_percentage;
        return sortOrder === 'asc' ? comp : -comp;
      }
      // default: roll_no / student_id
      const rollA = a.roll_no || a.student_id || '';
      const rollB = b.roll_no || b.student_id || '';
      const comp = rollA.localeCompare(rollB, undefined, { numeric: true, sensitivity: 'base' });
      return sortOrder === 'asc' ? comp : -comp;
    });

    return list;
  }, [students, searchQuery, selectedYear, selectedDivision, selectedStatus, sortBy, sortOrder]);

  // Pagination calculation
  const totalFiltered = filteredStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / itemsPerPage));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedYear('ALL');
    setSelectedDivision('ALL');
    setSelectedStatus('ALL');
    setSortBy('roll');
    setSortOrder('asc');
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string, category: string) => {
    const cat = category || status.toUpperCase();
    if (cat === 'SAFE' || status === 'Safe') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
          <ShieldCheck className="h-3 w-3 text-emerald-600" />
          Safe
        </span>
      );
    }
    if (cat === 'WARNING' || status === 'Warning') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
          <AlertTriangle className="h-3 w-3 text-amber-600" />
          Warning
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
        <AlertOctagon className="h-3 w-3 text-rose-600" />
        Critical
      </span>
    );
  };

  const getPercentageColor = (pct: number) => {
    if (pct >= 75) return 'text-emerald-600';
    if (pct >= 60) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getProgressBarColor = (pct: number) => {
    if (pct >= 75) return 'bg-emerald-500';
    if (pct >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-100 text-blue-800 border border-blue-200">
              Admin Attendance Directory
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-700 border border-slate-200">
              MSBTE Academic Rules
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Student List & Attendance Directory
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Zeal College of Engineering & Research • Department of Electronics & Telecommunication (E&TC) • Click any student name to inspect individual calendar & lecture logs.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchStudents}
            disabled={loading}
            className="flex items-center space-x-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 border border-slate-300 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-600'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Statistic Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="card-panel bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Students</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{totalStudents}</span>
            <span className="text-xs text-slate-400 font-medium">Enrolled</span>
          </div>
        </div>

        <div className="card-panel bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm flex flex-col justify-between bg-gradient-to-br from-white to-emerald-50/30">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Safe (&ge;75%)
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600">{safeCount}</span>
            <span className="text-xs text-emerald-600 font-bold">
              {totalStudents > 0 ? `${Math.round((safeCount / totalStudents) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

        <div className="card-panel bg-white p-4 rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-between bg-gradient-to-br from-white to-amber-50/30">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Warning (60-74%)
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600">{warningCount}</span>
            <span className="text-xs text-amber-600 font-bold">
              {totalStudents > 0 ? `${Math.round((warningCount / totalStudents) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

        <div className="card-panel bg-white p-4 rounded-2xl border border-rose-200 shadow-sm flex flex-col justify-between bg-gradient-to-br from-white to-rose-50/30">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
            <AlertOctagon className="h-3.5 w-3.5 text-rose-600" /> Critical (&lt;60%)
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-600">{criticalCount}</span>
            <span className="text-xs text-rose-600 font-bold">
              {totalStudents > 0 ? `${Math.round((criticalCount / totalStudents) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

        <div className="card-panel bg-white p-4 rounded-2xl border border-blue-200 shadow-sm flex flex-col justify-between bg-gradient-to-br from-white to-blue-50/30 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" /> Avg Attendance
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-700">{avgAttendance}%</span>
            <span className="text-xs text-blue-600 font-medium">Batch</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-panel rounded-2xl p-4 border border-slate-200 bg-white shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search Student */}
          <div className="sm:col-span-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search Student Name, Roll No, PRN..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Select Year */}
          <div className="sm:col-span-3">
            <select
              aria-label="Select Year"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition shadow-sm"
            >
              <option value="ALL">All Years</option>
              <option value="FY">FY (First Year)</option>
              <option value="SY">SY (Second Year)</option>
              <option value="TY">TY (Third Year)</option>
            </select>
          </div>

          {/* Select Division */}
          <div className="sm:col-span-3">
            <select
              aria-label="Select Division"
              value={selectedDivision}
              onChange={(e) => {
                setSelectedDivision(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition shadow-sm"
            >
              <option value="ALL">All Divisions</option>
              <option value="A">Division A</option>
              <option value="B">Division B</option>
              <option value="C">Division C</option>
              <option value="D">Division D</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="sm:col-span-2">
            <button
              onClick={handleResetFilters}
              className="w-full inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition shadow-sm"
            >
              <X className="h-3.5 w-3.5 text-slate-500" />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>

        {/* Secondary controls for Active filter, Status, and Sort */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <select
                value={activeFilter}
                onChange={(e) => {
                  setActiveFilter(e.target.value as 'ACTIVE' | 'INACTIVE' | 'ALL');
                  setCurrentPage(1);
                }}
                className="py-1.5 px-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 focus:bg-white focus:border-blue-600 focus:outline-none"
              >
                <option value="ACTIVE">Active Students</option>
                <option value="INACTIVE">Inactive Students</option>
                <option value="ALL">All Lifecycle Status</option>
              </select>
            )}

            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="py-1.5 px-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 focus:bg-white focus:border-blue-600 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SAFE">Safe (&ge;75%)</option>
              <option value="WARNING">Warning (60-74%)</option>
              <option value="CRITICAL">Critical (&lt;60%)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-') as ['roll' | 'name' | 'attendance', 'asc' | 'desc'];
                setSortBy(sb);
                setSortOrder(so);
                setCurrentPage(1);
              }}
              className="py-1.5 px-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 focus:bg-white focus:border-blue-600 focus:outline-none"
            >
              <option value="roll-asc">Sort: Roll No (Asc)</option>
              <option value="roll-desc">Sort: Roll No (Desc)</option>
              <option value="name-asc">Sort: Name (A-Z)</option>
              <option value="name-desc">Sort: Name (Z-A)</option>
              <option value="attendance-desc">Sort: Attd % (High-Low)</option>
              <option value="attendance-asc">Sort: Attd % (Low-High)</option>
            </select>
          </div>
        </div>

        {/* Results summary line */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-800">{filteredStudents.length}</strong> of{' '}
            <strong className="text-slate-800">{students.length}</strong> total registered students
          </span>
          <span className="text-[11px] text-slate-400">
            Click student name or 'View Profile' to view attendance calendar
          </span>
        </div>
      </div>

      {/* Main Students Table */}
      <div className="card-panel bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-600" />
            <p className="text-sm font-semibold text-slate-700">Loading Student Attendance Directory...</p>
            <p className="text-xs text-slate-400 mt-1">Calculating lecture percentages based on MSBTE instructional days</p>
          </div>
        ) : paginatedStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="text-base font-bold text-slate-800">No students found for the selected filters.</p>
            <p className="text-xs text-slate-400 mt-1">Try selecting different year/division filters or clear your active filters.</p>
            <button
              onClick={handleResetFilters}
              className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-sm"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear Filters</span>
            </button>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table View (hidden on small mobile screens) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Student ID</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4 text-center">Division</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Attendance %</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedStudents.map((student) => {
                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                        onClick={() => onSelectStudent(student.id)}
                      >
                        {/* Student ID */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                            {student.student_id || student.roll_no}
                          </span>
                        </td>

                        {/* Student Name (CLICKABLE) */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                              {student.full_name
                                ?.split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()}
                            </div>
                            <div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectStudent(student.id);
                                }}
                                className="font-bold text-slate-900 group-hover:text-blue-600 text-left transition flex items-center gap-1 hover:underline"
                              >
                                <span>{student.full_name}</span>
                                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 text-blue-600 transition" />
                              </button>
                              <p className="text-[10px] text-slate-400">
                                PRN: {student.prn || 'N/A'} • Attended: {student.present_lectures}/{student.total_lectures} lectures
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Class */}
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {student.class || student.class_name}
                        </td>

                        {/* Division */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-lg bg-slate-100 font-bold text-slate-800 text-[11px] border border-slate-200">
                            {student.division}
                          </span>
                        </td>

                        {/* Department */}
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {student.department || 'E&TC'}
                        </td>

                        {/* Attendance % */}
                        <td className="py-3.5 px-4 min-w-[140px]">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-extrabold text-xs ${getPercentageColor(student.attendance_percentage)}`}>
                              {student.attendance}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {student.present_lectures} / {student.total_lectures}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-300 ${getProgressBarColor(student.attendance_percentage)}`}
                              style={{ width: `${Math.min(100, Math.max(0, student.attendance_percentage))}%` }}
                            />
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          {getStatusBadge(student.status, student.status_category)}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectStudent(student.id);
                            }}
                            className="inline-flex items-center space-x-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white px-3 py-1.5 text-xs font-bold transition duration-150 shadow-sm group-hover:bg-blue-600 group-hover:text-white"
                          >
                            <CalendarCheck className="h-3.5 w-3.5" />
                            <span>Attendance</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (sm:hidden) */}
            <div className="sm:hidden divide-y divide-slate-100">
              {paginatedStudents.map((student) => (
                <div
                  key={student.id}
                  onClick={() => onSelectStudent(student.id)}
                  className="p-3.5 space-y-3 active:bg-blue-50/50 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                        {student.full_name
                          ?.split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {student.student_id || student.roll_no}
                          </span>
                          <span className="text-[11px] font-bold text-slate-600">
                            {student.class || student.class_name} • Div {student.division}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 mt-0.5 leading-snug">
                          {student.full_name}
                        </h4>
                      </div>
                    </div>
                    {getStatusBadge(student.status, student.status_category)}
                  </div>

                  {/* Attendance progress & stats */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600">Attendance:</span>
                      <span className={`font-black font-mono ${getPercentageColor(student.attendance_percentage)}`}>
                        {student.attendance}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${getProgressBarColor(student.attendance_percentage)}`}
                        style={{ width: `${Math.min(100, Math.max(0, student.attendance_percentage))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium pt-0.5">
                      <span>Attended: {student.present_lectures} / {student.total_lectures} lec</span>
                      <span>PRN: {student.prn || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Mobile Action Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectStudent(student.id);
                    }}
                    className="w-full min-h-[40px] flex items-center justify-center space-x-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs py-2 shadow-sm active:bg-blue-700 transition"
                  >
                    <CalendarCheck className="h-4 w-4" />
                    <span>View Attendance Calendar</span>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination Footer */}
        {!loading && filteredStudents.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-200 gap-3 bg-slate-50/50">
            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(currentPage * itemsPerPage, filteredStudents.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-800">{filteredStudents.length}</span> students
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Previous</span>
              </button>

              <div className="flex items-center space-x-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && p - prev > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="px-1 text-slate-400 text-xs">...</span>}
                        <button
                          onClick={() => setCurrentPage(p)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                            currentPage === p
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
