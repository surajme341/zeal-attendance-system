import React, { useState, useEffect } from 'react';
import {
  ScanFace,
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Search,
  Sparkles,
  Lock,
  X,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import { Student, ClassDivision } from '../../types';
import { WebcamCaptureModal } from '../../components/face/WebcamCaptureModal';

export const FaceEnrollment: React.FC = () => {
  const [divisions, setDivisions] = useState<ClassDivision[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchStudentId, setSearchStudentId] = useState<string>('');

  // Form fields
  const [studentName, setStudentName] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [className, setClassName] = useState<string>('TY');
  const [divisionName, setDivisionName] = useState<string>('A');
  const [departmentName, setDepartmentName] = useState<string>('E&TC');

  // Photo & Enrollment State
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [isWebcamOpen, setIsWebcamOpen] = useState<boolean>(false);
  const [consentAcknowledged, setConsentAcknowledged] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'SUCCESS' | 'ERROR' | 'WARNING' | null;
    message: string;
    details?: any;
  }>({ type: null, message: '' });

  // Load divisions
  useEffect(() => {
    const fetchDivs = async () => {
      try {
        const res = await api.getDivisions();
        setDivisions(res.divisions);
        if (res.divisions.length > 0) {
          setSelectedDivision(res.divisions[0].id);
        }
      } catch (err) {
        console.error('Failed to load divisions:', err);
      }
    };
    fetchDivs();
  }, []);

  // Load students for active division
  useEffect(() => {
    if (!selectedDivision) return;
    const fetchStudents = async () => {
      try {
        const res = await api.getStudents(selectedDivision);
        setStudents(res.students);
      } catch (err) {
        console.error('Failed to load students:', err);
      }
    };
    fetchStudents();
  }, [selectedDivision]);

  // When a student is selected or looked up
  const handleSelectStudent = (s: Student) => {
    setSelectedStudent(s);
    setStudentId(s.roll_no);
    setStudentName(s.full_name);
    if (s.photo_url) {
      setPhotoData(s.photo_url);
    }
    const currentDiv = divisions.find((d) => d.id === s.division_id);
    if (currentDiv) {
      setClassName(currentDiv.year_level);
      setDivisionName(currentDiv.division);
    }
    setStatusFeedback({ type: null, message: '' });
  };

  // Search by Roll Number or Name
  const handleSearchLookup = (val: string) => {
    setSearchStudentId(val);
    const found = students.find(
      (s) =>
        s.roll_no.toLowerCase() === val.toLowerCase().trim() ||
        s.full_name.toLowerCase().includes(val.toLowerCase().trim())
    );
    if (found) {
      handleSelectStudent(found);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusFeedback({
        type: 'ERROR',
        message: 'Invalid file type. Please upload a JPEG, PNG, or WebP photo.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoData(event.target?.result as string);
      setStatusFeedback({ type: null, message: '' });
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop support
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoData(event.target?.result as string);
      setStatusFeedback({ type: null, message: '' });
    };
    reader.readAsDataURL(file);
  };

  // Save Face Handler
  const handleSaveFace = async () => {
    if (!studentId.trim()) {
      setStatusFeedback({
        type: 'ERROR',
        message: 'Student ID / Roll Number is required. Please select or enter a student.',
      });
      return;
    }

    if (!photoData) {
      setStatusFeedback({
        type: 'ERROR',
        message: 'Please upload or capture a student face photo.',
      });
      return;
    }

    if (!consentAcknowledged) {
      setStatusFeedback({
        type: 'WARNING',
        message: 'Digital consent must be acknowledged in compliance with India DPDP Act 2023.',
      });
      return;
    }

    setIsSaving(true);
    setStatusFeedback({ type: null, message: '' });

    try {
      const res = await api.enrollFace(studentId.trim(), photoData, consentAcknowledged);

      setStatusFeedback({
        type: 'SUCCESS',
        message: `Face enrolled successfully for ${res.student?.full_name || studentName} (${studentId})!`,
        details: res.student,
      });

      // Update student photo_url if returned
      if (selectedStudent) {
        setSelectedStudent({
          ...selectedStudent,
          photo_url: photoData,
        });
      }
    } catch (err: any) {
      const errMsg = err.message || 'Face enrollment failed.';
      setStatusFeedback({
        type: 'ERROR',
        message: errMsg,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-md shadow-blue-900/30">
              <ScanFace className="h-5 w-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Student Face Enrollment
            </h2>
            <span className="rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 border border-blue-200">
              Admin Biometric Portal
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Zeal College of Engineering & Research • Department of E&TC • 128-d Face Vector Encoding
          </p>
        </div>

        {/* Security Badge */}
        <div className="mt-3 sm:mt-0 flex items-center space-x-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs text-emerald-800 font-semibold shadow-sm">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>DPDP Act 2023 Biometric Guard</span>
        </div>
      </div>

      {/* Main Grid: Student Selector (Left) & Face Registration Studio (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Quick Student Picker */}
        <div className="lg:col-span-4 card-panel rounded-2xl bg-white p-5 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Select Student from Class
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Pick a registered student to autofill enrollment data
            </p>
          </div>

          {/* Division Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Class / Division</label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600"
            >
              {divisions.map((div) => (
                <option key={div.id} value={div.id}>
                  {div.year_level} Division {div.division} ({div.academic_year})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by roll number or name..."
              value={searchStudentId}
              onChange={(e) => handleSearchLookup(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Student List */}
          <div className="max-h-[460px] overflow-y-auto divide-y divide-slate-100 pr-1">
            {students.map((s) => {
              const isSelected = selectedStudent?.id === s.id;
              const hasPhoto = Boolean(s.photo_url);

              return (
                <div
                  key={s.id}
                  onClick={() => handleSelectStudent(s)}
                  className={`p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50 border border-blue-300 shadow-sm'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <img
                      src={
                        s.photo_url ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'
                      }
                      alt={s.full_name}
                      className="h-8 w-8 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-900 block">
                        {s.roll_no}
                      </span>
                      <span className="text-xs text-slate-700 font-semibold truncate block max-w-[130px]">
                        {s.full_name}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      hasPhoto
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {hasPhoto ? 'Enrolled' : 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Face Enrollment Studio Form */}
        <div className="lg:col-span-8 card-panel rounded-2xl bg-white p-6 border border-slate-200 shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Student Biometric Face Registration
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Generates a 128-dimensional mathematical facial embedding vector stored securely in the local SQLite database.
            </p>
          </div>

          {/* Feedback Messages */}
          {statusFeedback.type && (
            <div
              className={`rounded-2xl p-4 text-xs border flex items-start space-x-3 animate-in fade-in ${
                statusFeedback.type === 'SUCCESS'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : statusFeedback.type === 'WARNING'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {statusFeedback.type === 'SUCCESS' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-bold text-sm">{statusFeedback.message}</p>
                {statusFeedback.details && (
                  <div className="mt-2 p-3 rounded-xl bg-white/80 border border-emerald-200 text-xs font-mono space-y-1">
                    <p>
                      <strong>Student:</strong> {statusFeedback.details.full_name}
                    </p>
                    <p>
                      <strong>ID:</strong> {statusFeedback.details.roll_no}
                    </p>
                    <p>
                      <strong>Class:</strong> {statusFeedback.details.class} • {departmentName}
                    </p>
                    <p>
                      <strong>Face Status:</strong>{' '}
                      <span className="text-emerald-700 font-bold">Enrolled ✅</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Student Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul Patil"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Student ID / Roll Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. ET123 or 23ETC01"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Class</label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
              >
                <option value="TY">TY (Third Year E&TC)</option>
                <option value="SY">SY (Second Year E&TC)</option>
                <option value="FY">FY (First Year E&TC)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Division</label>
                <input
                  type="text"
                  value={divisionName}
                  onChange={(e) => setDivisionName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 font-semibold uppercase"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Department</label>
                <input
                  type="text"
                  value={departmentName}
                  readOnly
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-100 border border-slate-200 text-slate-600 font-semibold cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Photo Capture & Upload Studio */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Face Photo & Preview
              </label>
              <span className="text-[11px] text-slate-500">Exactly 1 clear frontal face</span>
            </div>

            {photoData ? (
              /* Photo Preview Card */
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="relative group">
                  <img
                    src={photoData}
                    alt="Student Face Preview"
                    className="h-44 w-44 rounded-2xl object-cover border-2 border-blue-600 shadow-md"
                  />
                  <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500 pointer-events-none" />
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center space-x-2 text-emerald-700 font-bold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Photo Staged for Face Embedding</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    The backend AI engine will scan this portrait, verify a single clear human face, and extract a 128-d L2 vector.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer min-h-[40px] rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition flex items-center space-x-1.5">
                      <Camera className="h-3.5 w-3.5" />
                      <span>Take Photo</span>
                      <input type="file" accept="image/*" capture="user" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <label className="cursor-pointer min-h-[40px] rounded-xl bg-white border border-slate-300 hover:bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition flex items-center space-x-1.5">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Choose from Gallery</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsWebcamOpen(true)}
                      className="min-h-[40px] rounded-xl bg-white border border-slate-300 hover:bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hidden sm:flex items-center space-x-1.5"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>Webcam</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoData(null)}
                      className="min-h-[40px] px-3 py-2 text-xs text-rose-600 hover:underline font-semibold"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Drag and Drop / Upload / Camera Zone */
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 sm:p-8 text-center transition bg-slate-50/50 space-y-3"
              >
                <Camera className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-slate-400" />
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-800">
                    Take photo with camera, upload, or choose from gallery
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Supports JPEG, PNG, WebP (Max 10MB) • Ensure good frontal lighting
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  {/* Native Mobile Camera Button (Opens front camera) */}
                  <label className="cursor-pointer min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition flex items-center space-x-2">
                    <Camera className="h-4 w-4" />
                    <span>Take Selfie / Photo</span>
                    <input type="file" accept="image/*" capture="user" onChange={handleFileUpload} className="hidden" />
                  </label>

                  {/* Native Device Gallery / Files Picker */}
                  <label className="cursor-pointer min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition flex items-center space-x-2">
                    <Upload className="h-4 w-4 text-slate-500" />
                    <span>Choose from Gallery</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>

                  {/* Desktop Webcam Modal */}
                  <button
                    type="button"
                    onClick={() => setIsWebcamOpen(true)}
                    className="min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hidden sm:flex items-center space-x-2"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Live Webcam</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* DPDP Act 2023 Compliance & Consent Notice */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-start space-x-3">
            <input
              type="checkbox"
              id="dpdp-consent"
              checked={consentAcknowledged}
              onChange={(e) => setConsentAcknowledged(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5 h-4 w-4"
            />
            <label htmlFor="dpdp-consent" className="text-xs text-slate-700 cursor-pointer select-none">
              <span className="font-bold text-slate-900">
                Digital Biometric Consent Verified (India DPDP Act 2023):{' '}
              </span>
              The student has signed the biometric privacy agreement. Face embeddings will be stored securely
              in encrypted vector format strictly for classroom attendance authentication.
            </label>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setSelectedStudent(null);
                setStudentId('');
                setStudentName('');
                setPhotoData(null);
                setStatusFeedback({ type: null, message: '' });
              }}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Reset Form
            </button>

            <button
              type="button"
              disabled={isSaving || !studentId || !photoData}
              onClick={handleSaveFace}
              className="flex items-center space-x-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-900/30 transition"
            >
              <ScanFace className="h-4 w-4" />
              <span>{isSaving ? 'Validating & Encoding Face...' : 'Save Face'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Webcam modal */}
      <WebcamCaptureModal
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onCapture={(data) => setPhotoData(data)}
        title="Capture Student Face Photo"
      />
    </div>
  );
};
