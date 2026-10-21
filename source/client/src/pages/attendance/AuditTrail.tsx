import React, { useState, useEffect } from 'react';
import { History, ShieldAlert, User, Clock, ArrowRight, ShieldCheck, ScanFace, Trash2, Camera, Settings } from 'lucide-react';
import { api } from '../../services/api';
import { AttendanceAuditLog, BiometricAuditLog } from '../../types';

export const AuditTrail: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'biometric'>('attendance');
  const [logs, setLogs] = useState<AttendanceAuditLog[]>([]);
  const [bioLogs, setBioLogs] = useState<BiometricAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const [attRes, bioRes] = await Promise.all([
          api.getAuditLogs(),
          api.getBiometricAuditLogs({ limit: 100 }),
        ]);
        setLogs(attRes.logs);
        setBioLogs(bioRes.logs);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Audit Trail & Compliance Ledger
            </h2>
            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800 border border-blue-200">
              DPDP Act 2023 Compliant
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Immutable system logs tracking manual record changes and biometric face recognition actions.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="mt-3 sm:mt-0 flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'attendance'
                ? 'bg-white text-blue-600 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Attendance Edits ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('biometric')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'biometric'
                ? 'bg-white text-blue-600 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Biometric Face Logs ({bioLogs.length})
          </button>
        </div>
      </div>

      {/* Attendance Edits Tab */}
      {activeTab === 'attendance' && (
        <div className="card-panel rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <History className="mx-auto h-12 w-12 text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No attendance modifications recorded.</p>
              <p className="text-xs text-slate-400 mt-1">
                Any retroactive changes made in past sessions will generate a timestamped entry here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4 text-center">Change (Old → New)</th>
                    <th className="py-3 px-4">Modified By</th>
                    <th className="py-3 px-4">Stated Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {new Date(log.changed_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{log.student_name}</p>
                        <p className="font-mono text-[10px] text-slate-500">{log.student_roll}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{log.subject_name}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center space-x-1.5 font-mono text-[10px] font-bold">
                          <span
                            className={`px-2 py-0.5 rounded ${
                              log.previous_status === 'PRESENT'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {log.previous_status}
                          </span>
                          <ArrowRight className="h-3 w-3 text-slate-400" />
                          <span
                            className={`px-2 py-0.5 rounded ${
                              log.new_status === 'PRESENT'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {log.new_status}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-800">{log.changed_by_name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({log.changed_by_role})</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate italic font-serif">
                        "{log.reason}"
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Biometric Face Logs Tab */}
      {activeTab === 'biometric' && (
        <div className="card-panel rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : bioLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <ShieldCheck className="mx-auto h-12 w-12 text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No biometric actions logged yet.</p>
              <p className="text-xs text-slate-400 mt-1">
                Student face enrollment, photo replacement, deletions, and classroom scans will be audited here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Performed By</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {bioLogs.map((log) => {
                    const actionBadge =
                      log.action === 'ENROLL'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : log.action === 'REPLACE'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : log.action === 'DELETE'
                        ? 'bg-rose-100 text-rose-800 border-rose-200'
                        : log.action === 'ATTENDANCE_SCAN'
                        ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                        : 'bg-slate-100 text-slate-800 border-slate-200';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${actionBadge}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {log.student_name ? (
                            <>
                              <p className="font-bold text-slate-900">{log.student_name}</p>
                              <p className="font-mono text-[10px] text-slate-500">{log.student_roll}</p>
                            </>
                          ) : (
                            <span className="text-slate-400 font-mono">N/A</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {log.user_name || 'System Admin'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-sm">
                          {log.details}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                          {log.ip_address || '127.0.0.1'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
