import React from 'react';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, X, RefreshCw } from 'lucide-react';

interface AttendanceConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onRescan: () => void;
  recognizedCount: number;
  unknownCount: number;
  totalEnrolled: number;
  sessionMeta: {
    divisionName: string;
    subjectName: string;
    lectureSlot: string;
    sessionDate: string;
  };
  isSaving: boolean;
}

export const AttendanceConfirmModal: React.FC<AttendanceConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onRescan,
  recognizedCount,
  unknownCount,
  totalEnrolled,
  sessionMeta,
  isSaving,
}) => {
  if (!isOpen) return null;

  const absentCount = Math.max(0, totalEnrolled - recognizedCount);
  const attendanceRate = totalEnrolled > 0 ? Math.round((recognizedCount / totalEnrolled) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-[#0F172A] p-6 shadow-2xl text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Confirm Attendance Submission
              </h3>
              <p className="text-xs text-slate-400">
                Biometric Face Recognition Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Highlight Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-950/40 to-blue-900/40 border border-blue-500/30 p-5 mb-5 text-center">
          <p className="text-2xl sm:text-3xl font-extrabold text-white">
            {recognizedCount} students recognized
          </p>
          <p className="text-sm font-semibold text-blue-300 mt-1">
            Mark attendance for {sessionMeta.divisionName}?
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {sessionMeta.subjectName} • {sessionMeta.lectureSlot} • {sessionMeta.sessionDate}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-center">
            <span className="text-[11px] font-bold text-emerald-400 block uppercase">Present</span>
            <span className="text-xl font-bold font-mono text-emerald-300">{recognizedCount}</span>
            <span className="text-[10px] text-emerald-500/80 block mt-0.5">({attendanceRate}%)</span>
          </div>

          <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-center">
            <span className="text-[11px] font-bold text-rose-400 block uppercase">Absent</span>
            <span className="text-xl font-bold font-mono text-rose-300">{absentCount}</span>
            <span className="text-[10px] text-rose-500/80 block mt-0.5">Enrolled: {totalEnrolled}</span>
          </div>

          <div className="rounded-xl border border-orange-500/30 bg-orange-950/30 p-3 text-center">
            <span className="text-[11px] font-bold text-orange-400 block uppercase">Unknown</span>
            <span className="text-xl font-bold font-mono text-orange-300">{unknownCount}</span>
            <span className="text-[10px] text-orange-500/80 block mt-0.5">Not Marked</span>
          </div>
        </div>

        {/* Security / DPDP Note */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3 text-xs text-slate-400 flex items-start space-x-2.5 mb-6">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-300">Permanent Record Commitment</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Attendance will be marked as <code className="text-blue-300">FACE_RECOGNITION</code> and audited.
              Unknown faces will not receive attendance. You can modify records manually later within the 24-hour window.
            </p>
          </div>
        </div>

        {/* Action Buttons: Confirm & Save, Cancel, Rescan */}
        <div className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            type="button"
            onClick={onRescan}
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center space-x-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Rescan</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="w-full sm:w-auto rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-900/40 transition disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4 text-blue-200" />
            <span>{isSaving ? 'Saving Attendance...' : 'Confirm & Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
