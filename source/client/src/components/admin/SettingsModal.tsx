import React, { useState, useEffect } from 'react';
import { Settings, Save, X, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { SystemSettings } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSettingsSaved }) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [criticalThreshold, setCriticalThreshold] = useState<number>(60.0);
  const [warningThreshold, setWarningThreshold] = useState<number>(75.0);
  const [editWindowHours, setEditWindowHours] = useState<number>(24);
  const [collegeName, setCollegeName] = useState<string>('');
  const [deptName, setDeptName] = useState<string>('');

  // Face Recognition Settings
  const [faceThreshold, setFaceThreshold] = useState<number>(70); // percentage 70%
  const [minFaceQuality, setMinFaceQuality] = useState<number>(60); // percentage 60%
  const [maxImageSizeMb, setMaxImageSizeMb] = useState<number>(10);
  const [duplicateProtection, setDuplicateProtection] = useState<boolean>(true);
  const [requireConfirmation, setRequireConfirmation] = useState<boolean>(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const load = async () => {
        try {
          const res = await api.getSettings();
          setSettings(res.settings);
          setCriticalThreshold(res.settings.critical_threshold);
          setWarningThreshold(res.settings.warning_threshold);
          setEditWindowHours(res.settings.edit_window_hours);
          setCollegeName(res.settings.college_name);
          setDeptName(res.settings.department_name);

          // Load face settings
          const faceRes = await api.getFaceSettings();
          if (faceRes?.settings) {
            setFaceThreshold(Math.round((faceRes.settings.face_match_threshold || 0.7) * 100));
            setMinFaceQuality(Math.round((faceRes.settings.min_face_quality || 0.6) * 100));
            setMaxImageSizeMb(faceRes.settings.max_image_size_mb || 10);
            setDuplicateProtection(faceRes.settings.duplicate_protection !== 0);
            setRequireConfirmation(faceRes.settings.require_confirmation !== 0);
          }
        } catch (err: any) {
          console.error(err);
        }
      };
      load();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (criticalThreshold >= warningThreshold) {
      setError('Critical threshold must be strictly less than warning threshold.');
      return;
    }

    setSaving(true);
    try {
      await Promise.all([
        api.updateSettings({
          critical_threshold: Number(criticalThreshold),
          warning_threshold: Number(warningThreshold),
          edit_window_hours: Number(editWindowHours),
          college_name: collegeName,
          department_name: deptName,
        }),
        api.updateFaceSettings({
          face_match_threshold: Number(faceThreshold) / 100.0,
          min_face_quality: Number(minFaceQuality) / 100.0,
          max_image_size_mb: Number(maxImageSizeMb),
          duplicate_protection: duplicateProtection ? 1 : 0,
          require_confirmation: requireConfirmation ? 1 : 0,
        }),
      ]);
      alert('System & Face recognition settings updated successfully.');
      if (onSettingsSaved) onSettingsSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="rounded-xl bg-rose-500/20 p-2 text-rose-400">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">System Settings & Thresholds</h3>
              <p className="text-xs text-slate-400">Admin configurable compliance parameters</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-500/20 p-3 text-xs text-rose-300 border border-rose-500/40 mb-4 flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-rose-300 block mb-1">
                🔴 Critical Defaulter Threshold (%)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                required
                value={criticalThreshold}
                onChange={(e) => setCriticalThreshold(parseFloat(e.target.value))}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 60.0%</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-amber-300 block mb-1">
                🟡 Warning Threshold (%)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                required
                value={warningThreshold}
                onChange={(e) => setWarningThreshold(parseFloat(e.target.value))}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 75.0%</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Faculty Attendance Edit Window (Hours)
            </label>
            <input
              type="number"
              min="1"
              max="168"
              required
              value={editWindowHours}
              onChange={(e) => setEditWindowHours(parseInt(e.target.value))}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              After this window, only Super Admin can modify records with an audit reason.
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Institution Name (Official Heading)
            </label>
            <input
              type="text"
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Department Name
            </label>
            <input
              type="text"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
            />
          </div>

          {/* AI Face Recognition Settings Section */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                Smart Face Recognition Engine Settings
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-blue-300 block mb-1">
                  Face Matching Threshold (%)
                </label>
                <input
                  type="number"
                  min="40"
                  max="99"
                  value={faceThreshold}
                  onChange={(e) => setFaceThreshold(parseInt(e.target.value))}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Default: 70%</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-blue-300 block mb-1">
                  Minimum Face Quality (%)
                </label>
                <input
                  type="number"
                  min="20"
                  max="90"
                  value={minFaceQuality}
                  onChange={(e) => setMinFaceQuality(parseInt(e.target.value))}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Default: 60%</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Maximum Classroom Image Size (MB)
              </label>
              <input
                type="number"
                min="2"
                max="25"
                value={maxImageSizeMb}
                onChange={(e) => setMaxImageSizeMb(parseInt(e.target.value))}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center space-x-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={duplicateProtection}
                  onChange={(e) => setDuplicateProtection(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
                />
                <span>Enable Attendance Duplicate Protection (One student = one entry)</span>
              </label>

              <label className="flex items-center space-x-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireConfirmation}
                  onChange={(e) => setRequireConfirmation(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
                />
                <span>Require Confirmation Screen before permanently saving attendance</span>
              </label>
            </div>
          </div>


          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-rose-500 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
