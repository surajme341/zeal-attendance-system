import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Upload,
  Download,
  Search,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Camera,
  RefreshCw,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../../services/api';
import { Student, ClassDivision } from '../../types';

export const StudentsManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [divisions, setDivisions] = useState<ClassDivision[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Add / Edit Single Student Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    roll_no: '',
    prn: '',
    full_name: '',
    email: '',
    phone: '',
    guardian_phone: '',
    photo_url: '',
    division_id: '',
  });
  const [modalYear, setModalYear] = useState<string>('TY');
  const [modalDivision, setModalDivision] = useState<string>('A');

  // Direct Student Photo Upload & Face Validation State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [newPhotoData, setNewPhotoData] = useState<string | null>(null);
  const [isPhotoRemoved, setIsPhotoRemoved] = useState<boolean>(false);
  const [isValidatingPhoto, setIsValidatingPhoto] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message?: string;
    error?: string;
    warning?: string;
    metrics?: any;
  } | null>(null);

  // Bulk CSV Import Modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkRows, setBulkRows] = useState<any[]>([]);
  const [bulkImportStatus, setBulkImportStatus] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const fetchDivisions = async () => {
    try {
      const res = await api.getDivisions();
      setDivisions(res.divisions);
      if (res.divisions.length > 0 && !selectedDivision) {
        setSelectedDivision(res.divisions[0].id);
      }
    } catch (err) {
      console.error('Error fetching divisions:', err);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.getStudents(selectedDivision || undefined, searchQuery || undefined);
      setStudents(res.students);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDivisions();
  }, []);

  useEffect(() => {
    if (selectedDivision) {
      fetchStudents();
    }
  }, [selectedDivision, searchQuery]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate supported formats: JPG, JPEG, PNG, WEBP
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!validTypes.includes(file.type) && !hasValidExt) {
      alert('Supported photo formats are JPG, JPEG, PNG, and WEBP.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Photo file size exceeds 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target?.result as string;
      setPhotoPreview(dataUrl);
      setNewPhotoData(dataUrl);
      setIsPhotoRemoved(false);
      setIsValidatingPhoto(true);
      setValidationResult(null);

      try {
        const res = await api.validatePhoto(dataUrl);
        if (res.valid) {
          setValidationResult({
            valid: true,
            message: 'Face verified successfully (1 face detected)',
            metrics: res.metrics,
          });
        } else {
          setValidationResult({
            valid: false,
            error: res.error || 'No face detected. Please upload a clear student photo.',
            warning: res.warning,
            metrics: res.metrics,
          });
        }
      } catch (err: any) {
        setValidationResult({
          valid: false,
          error: err.message || 'Face detection validation failed.',
        });
      } finally {
        setIsValidatingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setNewPhotoData(null);
    setIsPhotoRemoved(true);
    setValidationResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validationResult && !validationResult.valid) {
      alert(validationResult.error || 'Please upload a photo containing only one clear student face.');
      return;
    }

    try {
      let finalPhotoUrl = formData.photo_url;
      if (newPhotoData) {
        finalPhotoUrl = newPhotoData;
      } else if (isPhotoRemoved) {
        finalPhotoUrl = '';
      }

      const targetDiv = divisions.find(
        (d) => d.year_level === modalYear && d.division === modalDivision
      );
      const targetDivisionId = targetDiv?.id || formData.division_id || selectedDivision;

      if (editingStudent) {
        await api.updateStudent(editingStudent.id, {
          ...formData,
          division_id: targetDivisionId,
          photo_url: finalPhotoUrl,
        });

        // If new photo was uploaded, enroll face immediately
        if (newPhotoData) {
          try {
            await api.enrollFace(editingStudent.id, newPhotoData, true);
          } catch (enrollErr: any) {
            console.warn('Auto face enrollment notice:', enrollErr);
          }
        } else if (isPhotoRemoved) {
          try {
            await api.removeStudentPhoto(editingStudent.id);
          } catch (remErr) {
            console.warn('Remove face enrollment notice:', remErr);
          }
        }

        alert('Student details updated.');
      } else {
        const createRes = await api.createStudent({
          ...formData,
          photo_url: finalPhotoUrl,
          division_id: targetDivisionId,
        });

        // If new photo was uploaded, enroll face for newly created student
        if (newPhotoData && createRes.id) {
          try {
            await api.enrollFace(createRes.id, newPhotoData, true);
          } catch (enrollErr: any) {
            console.warn('Auto face enrollment notice:', enrollErr);
          }
        }

        alert('Student enrolled successfully.');
      }

      setShowAddModal(false);
      setEditingStudent(null);
      setFormData({
        roll_no: '',
        prn: '',
        full_name: '',
        email: '',
        phone: '',
        guardian_phone: '',
        photo_url: '',
        division_id: selectedDivision,
      });
      setPhotoPreview(null);
      setNewPhotoData(null);
      setIsPhotoRemoved(false);
      setValidationResult(null);
      fetchStudents();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      roll_no: student.roll_no,
      prn: student.prn || '',
      full_name: student.full_name,
      email: student.email || '',
      phone: student.phone || '',
      guardian_phone: student.guardian_phone || '',
      photo_url: student.photo_url || '',
      division_id: student.division_id,
    });
    const divObj = divisions.find((d) => d.id === student.division_id);
    setModalYear(divObj?.year_level || 'TY');
    setModalDivision(divObj?.division || 'A');

    setPhotoPreview(student.photo_url || null);
    setNewPhotoData(null);
    setIsPhotoRemoved(false);
    setValidationResult(null);
    setShowAddModal(true);
  };

  // Bulk CSV file reader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setBulkRows(data);
      } catch (err) {
        alert('Failed to parse Excel/CSV file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadSampleCSV = () => {
    const sample = [
      {
        'Roll No': '23ETC21',
        'PRN': '20230105021',
        'Full Name': 'Manish K. Varma',
        'Email': 'manish.varma@zcoer.in',
        'Phone': '+91 98231 10021',
        'Guardian Phone': '+91 98231 90021',
        'Photo URL': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      },
      {
        'Roll No': '23ETC22',
        'PRN': '20230105022',
        'Full Name': 'Aarti N. Raut',
        'Email': 'aarti.raut@zcoer.in',
        'Phone': '+91 98231 10022',
        'Guardian Phone': '+91 98231 90022',
        'Photo URL': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'ZCOER_Student_Bulk_Template.csv');
  };

  const submitBulkImport = async () => {
    if (bulkRows.length === 0) return;
    setImporting(true);
    try {
      const res = await api.bulkImportStudents(bulkRows, selectedDivision);
      setBulkImportStatus(`Successfully imported ${res.importedCount} student records!`);
      setTimeout(() => {
        setShowBulkModal(false);
        setBulkRows([]);
        setBulkImportStatus(null);
        fetchStudents();
      }, 1800);
    } catch (err: any) {
      alert(err.message || 'Bulk import failed.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Student & Class Enrollment
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Zeal College E&TC Student Master Directory • Individual & Bulk CSV Enrollment with biometric photo fields.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex-1 sm:flex-initial min-h-[42px] inline-flex items-center justify-center space-x-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 px-3.5 py-2 text-xs font-bold text-slate-800 border border-slate-300 transition"
          >
            <Upload className="h-4 w-4 text-slate-600" />
            <span>Bulk CSV Import</span>
          </button>
          <button
            onClick={() => {
              setEditingStudent(null);
              setFormData({
                roll_no: '',
                prn: '',
                full_name: '',
                email: '',
                phone: '',
                guardian_phone: '',
                photo_url: '',
                division_id: selectedDivision,
              });
              setPhotoPreview(null);
              setNewPhotoData(null);
              setIsPhotoRemoved(false);
              setValidationResult(null);
              const divObj = divisions.find((d) => d.id === selectedDivision);
              setModalYear(divObj?.year_level || 'TY');
              setModalDivision(divObj?.division || 'A');
              setShowAddModal(true);
            }}
            className="flex-1 sm:flex-initial min-h-[42px] inline-flex items-center justify-center space-x-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-900/20 transition"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Division Select & Search */}
      <div className="card-panel rounded-2xl p-4 border border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 w-full sm:w-auto">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Select Division:
          </label>
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="w-full sm:w-auto rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
          >
            {divisions.map((div) => (
              <option key={div.id} value={div.id}>
                {div.year_level} E&TC — Division {div.division} (Semester {div.semester})
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Roll No, PRN, or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-slate-50 border border-slate-300 pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Students Table & Mobile Cards */}
      <div className="card-panel rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Users className="mx-auto h-12 w-12 text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No students enrolled in this division yet.</p>
            <p className="text-xs text-slate-400 mt-1">Use "Add Student" or "Bulk CSV Import" to enroll students.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-24">Roll No</th>
                    <th className="py-3 px-4">Student Profile</th>
                    <th className="py-3 px-4 font-mono">PRN Number</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4">Guardian Contact</th>
                    <th className="py-3 px-4 text-center">Photo Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                          {student.roll_no}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={student.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                            alt={student.full_name}
                            className="h-8 w-8 rounded-full object-cover border border-slate-300 shadow-sm"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{student.full_name}</p>
                            <p className="text-[10px] text-slate-500">{student.email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 font-medium">
                        {student.prn || 'Pending'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{student.phone || '—'}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 font-semibold">{student.guardian_phone || '—'}</td>
                      <td className="py-3.5 px-4 text-center">
                        {student.photo_url ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-700 text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            <span>Uploaded</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-slate-500 text-[10px] bg-slate-100 px-2 py-0.5 rounded">
                            <Camera className="h-3 w-3" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openEdit(student)}
                          className="rounded-lg bg-slate-100 hover:bg-slate-200 p-1.5 text-slate-700 transition"
                          title="Edit Student"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Stack */}
            <div className="sm:hidden divide-y divide-slate-100">
              {students.map((student) => (
                <div key={student.id} className="p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <img
                        src={student.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                        alt={student.full_name}
                        className="h-10 w-10 rounded-full object-cover border border-slate-300 shadow-sm shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[11px] text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {student.roll_no}
                          </span>
                          {student.photo_url ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-700 text-[9px] font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                              <span>Enrolled</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[9px] bg-slate-100 px-1.5 py-0.5 rounded">
                              No Photo
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-slate-900 text-xs mt-0.5">{student.full_name}</p>
                        <p className="text-[10px] text-slate-500">{student.email || '—'}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => openEdit(student)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-100 active:bg-blue-600 text-slate-700 active:text-white transition"
                      title="Edit Student"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[9px]">PRN NUMBER</span>
                      <span className="font-mono text-slate-700 font-semibold">{student.prn || 'Pending'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">STUDENT PHONE</span>
                      <span className="font-mono text-slate-600">{student.phone || '—'}</span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-200/50">
                      <span className="text-slate-400 block text-[9px]">GUARDIAN PHONE</span>
                      <span className="font-mono text-slate-700 font-semibold">{student.guardian_phone || '—'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingStudent ? 'Edit Student Record' : 'Enroll New Student'}
            </h3>
            <form onSubmit={handleSaveStudent} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Roll Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 23ETC13"
                    value={formData.roll_no}
                    onChange={(e) => setFormData({ ...formData, roll_no: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    MSBTE PRN (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 20230105013"
                    value={formData.prn}
                    onChange={(e) => setFormData({ ...formData, prn: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Year / Class & Division Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Year / Class *
                  </label>
                  <select
                    value={modalYear}
                    onChange={(e) => setModalYear(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-600"
                  >
                    <option value="FY">FY (First Year)</option>
                    <option value="SY">SY (Second Year)</option>
                    <option value="TY">TY (Third Year)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Division *
                  </label>
                  <select
                    value={modalDivision}
                    onChange={(e) => setModalDivision(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-600"
                  >
                    <option value="A">Division A</option>
                    <option value="B">Division B</option>
                    <option value="C">Division C</option>
                    <option value="D">Division D</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amit S. Deshmukh"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Student Email
                  </label>
                  <input
                    type="email"
                    placeholder="amit.deshmukh@zcoer.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Student Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98231 XXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Guardian / Parent Phone (For Defaulter Intimations)
                </label>
                <input
                  type="tel"
                  placeholder="+91 98231 XXXXX"
                  value={formData.guardian_phone}
                  onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                  Student Face Photo
                </label>

                {/* File input for device photo selection */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".jpg,.jpeg,.png,.webp,image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
                {/* File input for direct front camera selfie capture on mobile */}
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />

                {photoPreview ? (
                  <div className="space-y-2.5">
                    {/* PHOTO PREVIEW */}
                    <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-300 bg-slate-900/5 flex items-center justify-center shadow-inner">
                      <img
                        src={photoPreview}
                        alt="Student Face Preview"
                        className="w-full h-full object-contain"
                      />
                      {isValidatingPhoto && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                          <RefreshCw className="h-6 w-6 animate-spin text-blue-400 mb-1.5" />
                          <span className="text-xs font-semibold">Detecting & Validating Face...</span>
                        </div>
                      )}
                    </div>

                    {/* Change / Retake / Remove Photo Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={isValidatingPhoto}
                        className="flex-1 min-h-[42px] inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 active:bg-blue-100 text-xs font-bold text-blue-700 transition shadow-sm disabled:opacity-50"
                      >
                        <Camera className="h-3.5 w-3.5 text-blue-600" />
                        <span>Camera</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isValidatingPhoto}
                        className="flex-1 min-h-[42px] inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white active:bg-slate-50 text-xs font-semibold text-slate-700 transition shadow-sm disabled:opacity-50"
                      >
                        <Upload className="h-3.5 w-3.5 text-slate-500" />
                        <span>Gallery</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        disabled={isValidatingPhoto}
                        className="min-h-[42px] inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 active:bg-rose-100 text-xs font-semibold text-rose-700 transition disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                    <div className="h-10 w-10 rounded-full bg-blue-100/70 flex items-center justify-center text-blue-600 mx-auto mb-2">
                      <Camera className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">Student face photo</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      JPG, PNG, WEBP (Direct Camera or Photo Gallery)
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex-1 sm:flex-initial min-h-[42px] inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-sm transition"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        <span>Take Selfie / Camera</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 sm:flex-initial min-h-[42px] inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-bold shadow-sm transition"
                      >
                        <Upload className="h-3.5 w-3.5 text-slate-500" />
                        <span>Upload Photo</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Validation Status */}
                {validationResult && (
                  <div className="mt-2.5">
                    {validationResult.valid ? (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start space-x-2 text-emerald-900 text-xs">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">{validationResult.message || 'Face validated successfully.'}</p>
                          <p className="text-[11px] text-emerald-700 mt-0.5">
                            Face embedding generated and ready for biometric recognition.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2 text-rose-900 text-xs">
                        <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">{validationResult.error}</p>
                          {validationResult.warning && (
                            <p className="text-[11px] text-rose-700 mt-0.5">{validationResult.warning}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition"
                >
                  {editingStudent ? 'Save Changes' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
          <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Bulk Student CSV / Excel Upload</h3>
                <p className="text-xs text-slate-500">Upload multiple roll numbers with contact information in one click.</p>
              </div>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkRows([]);
                }}
                className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600 hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">CSV Template</p>
                  <p className="text-[11px] text-slate-500">Download the required column structure.</p>
                </div>
                <button
                  onClick={handleDownloadSampleCSV}
                  className="flex items-center space-x-1 rounded-lg bg-white border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Sample</span>
                </button>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Upload CSV or Excel (.xlsx) file
                </label>
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileUpload}
                  className="w-full rounded-xl bg-slate-50 border border-dashed border-slate-300 p-4 text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {bulkRows.length > 0 && (
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900">
                  <p className="font-bold">Ready to Import: {bulkRows.length} Rows</p>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Target division: {divisions.find((d) => d.id === selectedDivision)?.year_level} E&TC Div{' '}
                    {divisions.find((d) => d.id === selectedDivision)?.division}
                  </p>
                </div>
              )}

              {bulkImportStatus && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{bulkImportStatus}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={bulkRows.length === 0 || importing}
                  onClick={submitBulkImport}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
                >
                  {importing ? 'Importing...' : `Import ${bulkRows.length} Students`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
