export type UserRole = 'ADMIN' | 'FACULTY' | 'HOD' | 'STUDENT';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' | 'EXCUSED';
export type HolidayType = 'NATIONAL' | 'REGIONAL_MAHARASHTRA' | 'COLLEGE_EVENT';
export type DefaulterCategory = 'CRITICAL' | 'WARNING' | 'SAFE';

export interface User {
  id: string;
  employee_id: string | null;
  email: string;
  full_name: string;
  role: UserRole;
  department_id: string | null;
  department_name?: string;
  student_id?: string | null;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  board: string;
}

export interface ClassDivision {
  id: string;
  department_id: string;
  academic_year: string;
  year_level: string;
  division: string;
  semester: number;
  department_name?: string;
  department_code?: string;
  student_count?: number;
  subject_count?: number;
}

export interface Subject {
  id: string;
  division_id: string;
  code: string;
  name: string;
  credits: number;
  division_name?: string;
  faculty_names?: string;
  primary_faculty_id?: string;
}

export interface Student {
  id: string;
  division_id: string;
  roll_no: string;
  prn: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  guardian_phone: string | null;
  photo_url: string | null;
  is_active: number;
  deleted_at?: string | null;
  deleted_by?: string | null;
  division_name?: string;
  year?: string;
  year_level?: string;
  department_name?: string;
  total_sessions?: number;
  attended_sessions?: number;
}

export interface HolidayCalendarEvent {
  id: string;
  event_date: string;
  title: string;
  type: HolidayType;
  is_instructional_day: number;
  description: string | null;
}

export interface AttendanceSession {
  id: string;
  subject_id: string;
  division_id: string;
  faculty_user_id: string;
  session_date: string;
  lecture_slot: string;
  room_no: string;
  status: 'SUBMITTED' | 'LOCKED';
  source: 'MANUAL' | 'FACE_RECOGNITION' | 'OFFLINE_SYNC';
  created_at: string;
  locked_at: string | null;
  subject_name?: string;
  subject_code?: string;
  faculty_name?: string;
  division_name?: string;
  total_students?: number;
  present_count?: number;
  absent_count?: number;
  late_count?: number;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  marked_by_user_id: string;
  marked_at: string;
  roll_no?: string;
  prn?: string;
  student_name?: string;
  photo_url?: string;
}

export interface AttendanceAuditLog {
  id: string;
  record_id: string;
  session_id: string;
  student_id: string;
  previous_status: AttendanceStatus;
  new_status: AttendanceStatus;
  changed_by_user_id: string;
  changed_by_name?: string;
  changed_by_role?: string;
  reason: string;
  changed_at: string;
  student_name?: string;
  student_roll?: string;
  subject_name?: string;
}

export interface SystemSettings {
  id: string;
  critical_threshold: number;
  warning_threshold: number;
  edit_window_hours: number;
  allow_faculty_late_marking: number;
  college_name: string;
  department_name: string;
  board_name: string;
  face_match_threshold?: number;
  min_face_quality?: number;
  max_image_size_mb?: number;
  duplicate_protection?: number;
  require_confirmation?: number;
}

export interface FaceEnrollment {
  student_id: string;
  roll_no: string;
  prn?: string;
  full_name: string;
  photo_url?: string;
  year_level: string;
  division: string;
  class_name: string;
  department_name: string;
  enrollment_id?: string;
  face_quality?: number;
  enrolled_at?: string;
  updated_at?: string;
  face_status: 'ENROLLED' | 'PENDING' | 'REVOKED';
  has_embedding: boolean | number;
}

export interface BiometricAuditLog {
  id: string;
  action: 'ENROLL' | 'REPLACE' | 'DELETE' | 'ATTENDANCE_SCAN' | 'SETTINGS_UPDATE';
  student_id: string | null;
  user_id: string;
  details: string;
  ip_address: string | null;
  timestamp: string;
  user_name?: string;
  user_role?: string;
  student_name?: string;
  student_roll?: string;
}

export interface DetectedFaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface FaceMatchItem {
  box: DetectedFaceBox;
  student_id: string | null;
  student_name: string;
  roll_no: string;
  match_confidence: number;
  match_percentage: number;
  is_recognized: boolean;
  status: 'PRESENT' | 'ABSENT';
}

export interface ClassroomScanResponse {
  success: boolean;
  total_faces: number;
  recognized_faces: number;
  unknown_faces: number;
  attendance_marked: number;
  faces: FaceMatchItem[];
  students_table: {
    student_id: string;
    student_name: string;
    roll_no: string;
    face_match: string;
    attendance: 'Present' | 'Absent';
    is_recognized: boolean;
  }[];
  threshold: number;
  enrolled_in_division: number;
  faces_enrolled_count: number;
}


export interface DefaulterStudent {
  student_id: string;
  roll_no: string;
  prn: string;
  full_name: string;
  division_id: string;
  division_name: string;
  total_conducted: number;
  total_attended: number;
  attendance_percentage: number;
  status_category: DefaulterCategory;
  guardian_phone: string | null;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  subject_breakdown: {
    subject_id: string;
    subject_name: string;
    subject_code: string;
    conducted: number;
    attended: number;
    percentage: number;
    category: DefaulterCategory;
  }[];
}

export interface DefaulterSummary {
  totalStudents: number;
  totalConducted: number;
  criticalCount: number;
  warningCount: number;
  safeCount: number;
  averageAttendance: number;
  thresholds: {
    critical: number;
    warning: number;
  };
  excludedHolidaysCount: number;
}

export interface StudentAttendanceListItem {
  id: string;
  student_id: string;
  db_id: string;
  roll_no: string;
  prn?: string;
  full_name: string;
  name: string;
  photo_url?: string | null;
  is_active?: number;
  deleted_at?: string | null;
  deleted_by?: string | null;
  year?: string;
  year_level?: string;
  class: string;
  class_name: string;
  division: string;
  division_id: string;
  department: string;
  department_name: string;
  total_lectures: number;
  present_lectures: number;
  absent_lectures: number;
  attendance: string;
  attendance_percentage: number;
  status: 'Safe' | 'Warning' | 'Critical';
  status_category: 'SAFE' | 'WARNING' | 'CRITICAL';
}

export interface StudentAuditLog {
  id: string;
  action: string;
  student_id: string | null;
  student_name: string;
  student_roll: string;
  user_id: string;
  user_name: string;
  role: string;
  details: string;
  timestamp: string;
}

export interface StudentAttendanceDay {
  date: string;
  day: number;
  dayOfWeek: number;
  status: 'PRESENT' | 'ABSENT' | 'HOLIDAY' | 'NO_LECTURE' | 'PARTIAL';
  is_holiday: boolean;
  holiday_name?: string;
  is_modified: boolean;
  total_sessions: number;
  present_sessions: number;
}

export interface StudentAttendanceLectureRecord {
  id: string;
  session_id: string;
  date: string;
  lecture_slot: string;
  lecture_number: string;
  subject: string;
  subject_name: string;
  subject_code: string;
  status: string;
  method: string;
  attendance_method: string;
  recognition_confidence: number | null;
  confidence_display: string | null;
  modified_by: string | null;
  modified_at: string | null;
  original_status: string | null;
  original_method: string | null;
  original_confidence: string | null;
  marked_by_name?: string;
  room_no?: string;
}

export interface StudentAttendanceProfileData {
  student: {
    id: string;
    roll_no: string;
    prn?: string;
    full_name: string;
    name: string;
    student_id: string;
    class: string;
    class_name: string;
    division: string;
    division_id: string;
    department: string;
    department_name: string;
    email?: string;
    phone?: string;
    guardian_phone?: string;
    photo_url?: string;
  };
  summary: {
    total_lectures: number;
    present: number;
    present_lectures: number;
    absent: number;
    absent_lectures: number;
    attendance_percentage: number;
    percentage: number;
    status: 'Safe' | 'Warning' | 'Critical';
    status_category: 'SAFE' | 'WARNING' | 'CRITICAL';
  };
  calendar: {
    month: string;
    year: number;
    month_num: number;
    days: StudentAttendanceDay[];
  };
  records: StudentAttendanceLectureRecord[];
  thresholds: {
    critical: number;
    warning: number;
  };
}

