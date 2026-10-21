import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  User,
  Department,
  ClassDivision,
  Subject,
  Student,
  AttendanceSession,
  AttendanceRecord,
  AttendanceAuditLog,
  HolidayCalendarEvent,
  SystemSettings,
  DefaulterStudent,
  DefaulterSummary,
  FaceEnrollment,
  BiometricAuditLog,
  ClassroomScanResponse,
  StudentAttendanceListItem,
  StudentAttendanceProfileData,
  StudentAuditLog,
} from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('zcoer_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = { ...getAuthHeaders(), ...(options.headers || {}) };
  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  getUsers: () => request<{users: any[]}>('/users'),
  createUser: (data: any) => request<{success: boolean; id: string}>('/users', {method: 'POST', body: JSON.stringify(data)}),
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  demoLogin: (role: 'ADMIN' | 'FACULTY' | 'STUDENT') =>
    request<{ token: string; user: User }>('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  getMe: () => request<{ user: User }>('/auth/me'),

  // Departments & Classes
  getDepartments: () => request<{ departments: Department[] }>('/departments'),
  getDivisions: () => request<{ divisions: ClassDivision[] }>('/departments/divisions'),
  getSubjects: (divisionId?: string) =>
    request<{ subjects: Subject[] }>(`/departments/subjects${divisionId ? `?division_id=${divisionId}` : ''}`),
  getFacultyList: () => request<{ faculty: User[] }>('/departments/faculty-list'),

  createDivision: (data: any) =>
    request<{ message: string; id: string }>('/departments/divisions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createSubject: (data: any) =>
    request<{ message: string; id: string }>('/departments/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Students
  getStudents: (divisionId?: string, search?: string, activeStatus?: 'ACTIVE' | 'INACTIVE' | 'ALL') => {
    const params = new URLSearchParams();
    if (divisionId) params.append('division_id', divisionId);
    if (search) params.append('search', search);
    if (activeStatus) params.append('active_status', activeStatus);
    return request<{ students: Student[] }>(`/students?${params.toString()}`);
  },

  getStudent: (id: string) => request<{ student: Student }>(`/students/${id}`),

  createStudent: (data: any) =>
    request<{ message: string; id: string; photo_url?: string }>('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStudent: (id: string, data: any) =>
    request<{ message: string; photo_url?: string }>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteStudent: (id: string) =>
    request<{ success: boolean; message: string; student: any }>(`/students/${id}`, {
      method: 'DELETE',
    }),

  getStudentAuditLogs: () =>
    request<{ logs: StudentAuditLog[] }>('/students/audit-logs'),

  bulkImportStudents: (students: any[], divisionId?: string) =>
    request<{ success: boolean; importedCount: number; errors?: string[] }>('/students/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ students, division_id: divisionId }),
    }),

  getStudentAttendanceList: (params?: {
    division_id?: string;
    class_name?: string;
    status?: string;
    search?: string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    limit?: number;
    active_status?: 'ACTIVE' | 'INACTIVE' | 'ALL';
    year?: string;
    division?: string;
  }) => {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          cleanParams[k] = String(v);
        }
      });
    }
    const qs = new URLSearchParams(cleanParams).toString();
    return request<{
      students: StudentAttendanceListItem[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      thresholds: { critical: number; warning: number };
    }>(`/students/attendance-list?${qs}`);
  },

  getStudentAttendanceProfile: (id: string, month?: string) => {
    const qs = month ? `?month=${month}` : '';
    return request<StudentAttendanceProfileData>(`/students/${id}/attendance-profile${qs}`);
  },

  // Attendance
  getSessions: (params?: { division_id?: string; subject_id?: string; date?: string; faculty_id?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<{ sessions: AttendanceSession[] }>(`/attendance/sessions?${qs}`);
  },

  getSessionDetails: (id: string) =>
    request<{
      session: AttendanceSession;
      records: AttendanceRecord[];
      isEditable: boolean;
      editRestrictionReason?: string;
    }>(`/attendance/session/${id}`),

  markAttendance: (data: {
    subject_id: string;
    division_id: string;
    session_date: string;
    lecture_slot: string;
    room_no?: string;
    records: { student_id: string; status: string }[];
    source?: string;
  }) =>
    request<{ success: boolean; message: string; sessionId: string; totalMarked: number }>('/attendance/mark', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRecord: (recordId: string, newStatus: string, reason: string) =>
    request<{ success: boolean; message: string; previousStatus: string; newStatus: string; record?: any }>(
      `/attendance/record/${recordId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ new_status: newStatus, reason }),
      }
    ),

  deleteRecord: (recordId: string) =>
    request<{ success: boolean; message: string }>(`/attendance/record/${recordId}`, {
      method: 'DELETE',
    }),

  getAuditLogs: (params?: { session_id?: string; student_id?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<{ logs: AttendanceAuditLog[] }>(`/attendance/audit-logs?${qs}`);
  },

  syncOfflineAttendance: (sessions: any[]) =>
    request<{ success: boolean; message: string; syncedCount: number }>('/attendance/sync', {
      method: 'POST',
      body: JSON.stringify({ sessions }),
    }),

  // Defaulters Engine
  getDefaulters: (params?: { division_id?: string; subject_id?: string; start_date?: string; end_date?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<{ summary: DefaulterSummary; defaulters: DefaulterStudent[] }>(`/defaulters?${qs}`);
  },

  getMyDefaulterStatus: () =>
    request<{ student: DefaulterStudent; thresholds: { critical: number; warning: number } }>('/defaulters/my-status'),

  // Calendar
  getCalendarEvents: (year?: string, month?: string) => {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (month) params.append('month', month);
    return request<{ events: HolidayCalendarEvent[] }>(`/calendar?${params.toString()}`);
  },

  createCalendarEvent: (event: Omit<HolidayCalendarEvent, 'id'>) =>
    request<{ message: string; id: string }>('/calendar', {
      method: 'POST',
      body: JSON.stringify(event),
    }),

  deleteCalendarEvent: (id: string) =>
    request<{ message: string }>(`/calendar/${id}`, {
      method: 'DELETE',
    }),

  // Settings
  getSettings: () => request<{ settings: SystemSettings }>('/settings'),
  updateSettings: (data: Partial<SystemSettings>) =>
    request<{ success: boolean; message: string; settings: SystemSettings }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Face Recognition & Biometrics (Phase 2)
  getFaceStatus: () => request<{ status: string; engine: any; timestamp: string }>('/face/status'),

  validatePhoto: (imageData: string) =>
    request<{
      valid: boolean;
      message?: string;
      error?: string;
      error_code?: string;
      box?: any;
      quality_score?: number;
      warning?: string;
      metrics?: any;
    }>('/face/validate-photo', {
      method: 'POST',
      body: JSON.stringify({ image_data: imageData }),
    }),

  removeStudentPhoto: (studentId: string) =>
    request<{ success: boolean; message: string }>(`/face/remove-photo/${studentId}`, {
      method: 'POST',
    }),

  enrollFace: (studentId: string, imageData: string, consentGranted = true) =>
    request<{
      success: boolean;
      message: string;
      student: any;
      box: any;
    }>('/face/enroll', {
      method: 'POST',
      body: JSON.stringify({
        student_id: studentId,
        image_data: imageData,
        consent_granted: consentGranted,
      }),
    }),

  getEnrolledStudents: (params?: { division_id?: string; class_name?: string; search?: string; status?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<{
      total: number;
      enrolledCount: number;
      pendingCount: number;
      students: FaceEnrollment[];
    }>(`/face/enrolled-students?${qs}`);
  },

  deleteFaceEnrollment: (studentId: string) =>
    request<{ success: boolean; message: string }>(`/face/enrollment/${studentId}`, {
      method: 'DELETE',
    }),

  scanClassroom: (data: {
    division_id: string;
    subject_id?: string;
    session_date?: string;
    lecture_slot?: string;
    image_data: string;
  }) =>
    request<ClassroomScanResponse>('/face/scan-classroom', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  confirmFaceAttendance: (data: {
    division_id: string;
    subject_id: string;
    session_date: string;
    lecture_slot: string;
    room_no?: string;
    records: { student_id: string; status: string; recognition_confidence?: number }[];
    total_faces: number;
    recognized_faces: number;
    unknown_faces: number;
    image_reference?: string;
  }) =>
    request<{ success: boolean; message: string; sessionId: string; totalMarked: number }>('/face/confirm-attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getFaceHistory: (params?: { division_id?: string; subject_id?: string; date?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<{ sessions: AttendanceSession[] }>(`/face/history?${qs}`);
  },

  getFaceSettings: () =>
    request<{
      settings: {
        face_match_threshold: number;
        min_face_quality: number;
        max_image_size_mb: number;
        duplicate_protection: number;
        require_confirmation: number;
      };
    }>('/face/settings'),

  updateFaceSettings: (data: {
    face_match_threshold?: number;
    min_face_quality?: number;
    max_image_size_mb?: number;
    duplicate_protection?: number;
    require_confirmation?: number;
  }) =>
    request<{ success: boolean; message: string; settings: any }>('/face/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getBiometricAuditLogs: (params?: { action?: string; student_id?: string; limit?: number }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<{ logs: BiometricAuditLog[] }>(`/face/audit-logs?${qs}`);
  },
};


// Excel Export Utility
export function exportDefaultersToExcel(
  defaulters: DefaulterStudent[],
  summary: DefaulterSummary,
  divisionLabel: string
) {
  const worksheetData = defaulters.map((d, index) => {
    const row: any = {
      'Sr. No.': index + 1,
      'Roll No': d.roll_no,
      'PRN': d.prn,
      'Student Full Name': d.full_name,
      'Division': d.division_name,
      'Conducted Lectures': d.total_conducted,
      'Attended Lectures': d.total_attended,
      'Attendance %': `${d.attendance_percentage}%`,
      'Status Category':
        d.status_category === 'CRITICAL'
          ? 'CRITICAL DEFAULTER (<60%)'
          : d.status_category === 'WARNING'
          ? 'WARNING (60-74.99%)'
          : 'SAFE (>=75%)',
      'Parent Contact': d.guardian_phone || 'N/A',
      'Student Contact': d.phone || 'N/A',
    };

    // Add subject-wise columns
    d.subject_breakdown.forEach((sub) => {
      row[`${sub.subject_code} %`] = `${sub.percentage}% (${sub.attended}/${sub.conducted})`;
    });

    return row;
  });

  const ws = XLSX.utils.json_to_sheet(worksheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Defaulter Report');

  const filename = `ZCOER_Defaulter_List_${divisionLabel.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// PDF Export Utility (Official College Notice Format)
export function exportDefaultersToPDF(
  defaulters: DefaulterStudent[],
  summary: DefaulterSummary,
  divisionLabel: string,
  collegeName = 'Zeal College of Engineering and Research, Pune',
  deptName = 'Department of Electronics & Telecommunication (E&TC)'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Header Banner
  doc.setFillColor(11, 25, 44); // Zeal Navy
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(collegeName.toUpperCase(), 105, 10, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Affiliated to MSBTE Mumbai & SPPU Pune | Approved by AICTE New Delhi', 105, 16, { align: 'center' });
  doc.text(deptName, 105, 22, { align: 'center' });

  // Notice Title
  doc.setTextColor(230, 57, 70); // Zeal Red
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL ATTENDANCE DEFAULTER NOTICE', 105, 34, { align: 'center' });

  // Metadata block
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.text(`Class/Division: ${divisionLabel}`, 14, 42);
  doc.text(`Date of Issue: ${todayStr}`, 150, 42);
  doc.text(`Total Lectures Conducted: ${summary.totalConducted}`, 14, 47);
  doc.text(`Critical Defaulters (<${summary.thresholds.critical}%): ${summary.criticalCount}`, 150, 47);

  // Table Data
  const tableRows = defaulters.map((d, index) => [
    (index + 1).toString(),
    d.roll_no,
    d.full_name,
    `${d.total_attended} / ${d.total_conducted}`,
    `${d.attendance_percentage}%`,
    d.status_category === 'CRITICAL'
      ? 'CRITICAL (<60%)'
      : d.status_category === 'WARNING'
      ? 'WARNING (60-75%)'
      : 'SAFE (>=75%)',
    d.guardian_phone || '-',
  ]);

  autoTable(doc, {
    startY: 52,
    head: [['#', 'Roll No', 'Student Name', 'Attended', 'Attendance %', 'Status', 'Guardian Phone']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [11, 25, 44],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 20 },
      2: { cellWidth: 55 },
      3: { halign: 'center', cellWidth: 24 },
      4: { halign: 'center', cellWidth: 26 },
      5: { halign: 'center', cellWidth: 32 },
      6: { halign: 'center', cellWidth: 25 },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const rowData = defaulters[data.row.index];
        if (rowData?.status_category === 'CRITICAL') {
          data.cell.styles.textColor = [220, 38, 38]; // Red text
          if (data.column.index === 5) {
            data.cell.styles.fillColor = [254, 226, 226]; // Soft red badge
            data.cell.styles.fontStyle = 'bold';
          }
        } else if (rowData?.status_category === 'WARNING') {
          if (data.column.index === 5) {
            data.cell.styles.fillColor = [254, 243, 199]; // Soft amber badge
            data.cell.styles.textColor = [180, 83, 9];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    },
  });

  // Footer / Signatures
  const finalY = (doc as any).lastAutoTable?.finalY || 240;
  const signY = Math.min(finalY + 25, 275);

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text('_________________________', 20, signY);
  doc.text('Class Teacher / In-charge', 20, signY + 5);

  doc.text('_________________________', 105, signY, { align: 'center' });
  doc.text('HOD (E&TC Department)', 105, signY + 5, { align: 'center' });

  doc.text('_________________________', 185, signY, { align: 'right' });
  doc.text('Principal (ZCOER)', 185, signY + 5, { align: 'right' });

  const filename = `ZCOER_Defaulters_${divisionLabel.replace(/\s+/g, '_')}_Notice.pdf`;
  doc.save(filename);
}
