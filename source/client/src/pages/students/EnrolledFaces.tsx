import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  Eye,
  Camera,
  Upload,
  Sparkles,
  ShieldCheck,
  X,
} from 'lucide-react';
import { api } from '../../services/api';
import { FaceEnrollment, ClassDivision } from '../../types';
import { WebcamCaptureModal } from '../../components/face/WebcamCaptureModal';

export const EnrolledFaces: React.FC = () => {
  const [students, setStudents] = useState<FaceEnrollment[]>([]);
  const [divisions, setDivisions] = useState<ClassDivision[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // View modal state
  const [viewingStudent, setViewingStudent] = useState<FaceEnrollment | null>(null);

  // Replace modal state
  const [replacingStudent, setReplacingStudent] = useState<FaceEnrollment | null>(null);
  const [replacePhoto, setReplacePhoto] = useState<string | null>(null);
  const [isWebcamOpen, setIsWebcamOpen] = useState<boolean>(false);
  const [isSubmittingReplace, setIsSubmittingReplace] = useState<boolean>(false);
  const [replaceError, setReplaceError] = useState<string | null>(null);

  // Delete modal state
  const [deletingStudent, setDeletingStudent] = useState<FaceEnrollment | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchDivisions = async () => {
    try {
      const res = await api.getDivisions();
      setDivisions(res.divisions);
    } catch (err) {
      console.error('Failed to load divisions:', err);
    }
  };

  const fetchEnrolledStudents = async () => {
    setLoading(true);
    try {
      const res = await api.getEnrolledStudents({
        division_id: selectedDivision || undefined,
        class_name: selectedClass || undefined,
        search: searchQuery || undefined,
        status: selectedStatus || undefined,
      });
      setStudents(res.students);
    } catch (err) {
      console.error('Failed to fetch enrolled students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDivisions();
  }, []);

  useEffect(() => {
    fetchEnrolledStudents();
  }, [selectedDivision, selectedClass, selectedStatus, searchQuery]);

  const enrolledCount = students.filter((s) => s.face_status === 'ENROLLED' && s.has_embedding).length;
  const pendingCount = students.length - enrolledCount;

  // Handle Replace submit
  const handleConfirmReplace = async () => {
    if (!replacingStudent || !replacePhoto) return;
    setIsSubmittingReplace(true);
    setReplaceError(null);
    try {
      await api.enrollFace(replacingStudent.student_id, replacePhoto, true);
      alert(`Face photo successfully replaced for ${replacingStudent.full_name}.`);
      setReplacingStudent(null);
      setReplacePhoto(null);
      fetchEnrolledStudents();
    } catch (err: any) {
      setReplaceError(err.message || 'Failed to replace face enrollment.');
    } finally {
      setIsSubmittingReplace(false);
    }
  };

  // Handle Delete confirm
  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    setIsDeleting(true);
    try {
      await api.deleteFaceEnrollment(deletingStudent.student_id);
      alert(`Face enrollment removed for ${deletingStudent.full_name}.`);
      setDeletingStudent(null);
      fetchEnrolledStudents();
    } catch (err: any) {
      alert(`Failed to delete enrollment: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPEG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setReplacePhoto(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-md shadow-blue-900/30">
              <Users className="h-5 w-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Enrolled Faces Database
            </h2>
            <span className="rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 border border-blue-200">
              Admin Biometric Vault
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Zeal College of Engineering & Research • Department of E&TC • Biometric Student Directory
          </p>
        </div>

        {/* Status Counters */}
        <div className="mt-3 sm:mt-0 flex items-center space-x-3">
          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 shadow-sm flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-700">
              {enrolledCount} <span className="font-normal text-slate-500">Enrolled</span>
            </span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 shadow-sm flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-bold text-slate-700">
              {pendingCount} <span className="font-normal text-slate-500">Pending</span>
            </span>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="card-panel rounded-2xl bg-white p-4 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search student name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>

        {/* Division Filter */}
        <div>
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600"
          >
            <option value="">All Divisions</option>
            {divisions.map((div) => (
              <option key={div.id} value={div.id}>
                {div.year_level} Division {div.division} ({div.academic_year})
              </option>
            ))}
          </select>
        </div>

        {/* Class Filter */}
        <div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600"
          >
            <option value="">All Classes</option>
            <option value="TY">TY (Third Year)</option>
            <option value="SY">SY (Second Year)</option>
          </select>
        </div>

        {/* Enrollment Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600"
          >
            <option value="">All Statuses</option>
            <option value="ENROLLED">Enrolled Only</option>
            <option value="PENDING">Pending Only</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="card-panel rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Student ID</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Class</th>
                <th className="py-3.5 px-4">Face Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-blue-600 mb-2" />
                    <span>Loading student face records...</span>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No students match the current filter criteria.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const isEnrolled = student.face_status === 'ENROLLED' && student.has_embedding;

                  return (
                    <tr key={student.student_id} className="hover:bg-slate-50/80 transition group">
                      {/* Student ID / Roll */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {student.roll_no}
                      </td>

                      {/* Student Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={
                              student.photo_url ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'
                            }
                            alt={student.full_name}
                            className="h-8 w-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <span className="font-semibold text-slate-800 block">
                              {student.full_name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              PRN: {student.prn || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Class */}
                      <td className="py-3 px-4">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
                          {student.class_name} {student.department_name ? `• ${student.department_name}` : ''}
                        </span>
                      </td>

                      {/* Face Status */}
                      <td className="py-3 px-4">
                        {isEnrolled ? (
                          <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[11px] font-bold border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            <span>Enrolled</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-[11px] font-bold border border-amber-200">
                            <AlertCircle className="h-3 w-3 text-amber-600" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      {/* Actions: View / Replace / Delete */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center space-x-1">
                          {/* View */}
                          <button
                            onClick={() => setViewingStudent(student)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="View Photo & Embedding Metadata"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Replace */}
                          <button
                            onClick={() => {
                              setReplacingStudent(student);
                              setReplacePhoto(null);
                              setReplaceError(null);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title="Replace Face Photo"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>

                          {/* Delete */}
                          {isEnrolled && (
                            <button
                              onClick={() => setDeletingStudent(student)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Remove Face Enrollment"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW MODAL */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Student Biometric Record</h3>
              <button onClick={() => setViewingStudent(null)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center mb-5">
              <img
                src={
                  viewingStudent.photo_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'
                }
                alt={viewingStudent.full_name}
                className="h-32 w-32 rounded-2xl object-cover border-2 border-blue-500 shadow-md mb-3"
              />
              <h4 className="text-lg font-bold text-slate-900">{viewingStudent.full_name}</h4>
              <p className="font-mono text-xs font-semibold text-blue-600">{viewingStudent.roll_no}</p>
              <p className="text-xs text-slate-500 mt-0.5">{viewingStudent.class_name}</p>
            </div>

            <div className="space-y-2.5 rounded-xl bg-slate-50 p-3.5 text-xs text-slate-700 border border-slate-200 font-mono mb-5">
              <div className="flex justify-between">
                <span className="text-slate-500">Biometric Status:</span>
                <span className="font-bold text-emerald-600">{viewingStudent.face_status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Embedding Vector:</span>
                <span className="font-bold text-slate-800">128-d L2 (Stored Securely)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Enrolled At:</span>
                <span>{viewingStudent.enrolled_at || 'Recently'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Compliance:</span>
                <span className="text-blue-600 font-bold">DPDP Act 2023 Verified</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setViewingStudent(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPLACE MODAL */}
      {replacingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Replace Face Enrollment Photo
                </h3>
                <p className="text-xs text-slate-500">
                  {replacingStudent.full_name} ({replacingStudent.roll_no})
                </p>
              </div>
              <button onClick={() => setReplacingStudent(null)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            {replaceError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 mb-4 text-xs text-rose-700 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{replaceError}</span>
              </div>
            )}

            {/* Photo preview or upload area */}
            <div className="space-y-4">
              {replacePhoto ? (
                <div className="flex flex-col items-center">
                  <img
                    src={replacePhoto}
                    alt="Replacement Preview"
                    className="h-48 w-48 rounded-2xl object-cover border-2 border-blue-600 shadow-md mb-3"
                  />
                  <button
                    onClick={() => setReplacePhoto(null)}
                    className="text-xs text-rose-600 hover:underline font-semibold"
                  >
                    Change / Clear Photo
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-3">
                  <Camera className="mx-auto h-10 w-10 text-slate-400" />
                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      Upload or capture a new clear frontal portrait
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Exactly one face required • Avoid blur or shadows
                    </p>
                  </div>

                  <div className="flex items-center justify-center space-x-3 pt-2">
                    <label className="cursor-pointer rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition flex items-center space-x-1.5">
                      <Upload className="h-4 w-4" />
                      <span>Upload Photo</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsWebcamOpen(true)}
                      className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition flex items-center space-x-1.5"
                    >
                      <Camera className="h-4 w-4" />
                      <span>Use Camera</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setReplacingStudent(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!replacePhoto || isSubmittingReplace}
                onClick={handleConfirmReplace}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-5 py-2 text-xs font-bold text-white shadow-md transition"
              >
                {isSubmittingReplace ? 'Validating & Encoding...' : 'Save & Re-Enroll'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-800">
            <div className="flex items-center space-x-3 text-rose-600 mb-3">
              <div className="rounded-xl bg-rose-100 p-2.5">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Remove Face Enrollment</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Are you sure you want to delete the biometric face enrollment for{' '}
              <strong className="text-slate-900">{deletingStudent.full_name}</strong> (
              {deletingStudent.roll_no})? This will permanently delete the face embedding from the
              biometric vault and require re-enrollment.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-md transition"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webcam modal */}
      <WebcamCaptureModal
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onCapture={(data) => setReplacePhoto(data)}
        title="Capture Replacement Photo"
      />
    </div>
  );
};
