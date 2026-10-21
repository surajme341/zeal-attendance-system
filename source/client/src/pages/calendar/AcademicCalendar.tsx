import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Award,
  Flag,
  SunMedium,
  Building,
  Info,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { HolidayCalendarEvent, HolidayType } from '../../types';

export const AcademicCalendar: React.FC = () => {
  const { role } = useAuth();
  const [events, setEvents] = useState<HolidayCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Event Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<HolidayType>('REGIONAL_MAHARASHTRA');
  const [isInstructional, setIsInstructional] = useState(false);
  const [eventDesc, setEventDesc] = useState('');

  // Selected filter
  const [typeFilter, setTypeFilter] = useState<'ALL' | HolidayType>('ALL');

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const res = await api.getCalendarEvents();
      setEvents(res.events);
    } catch (err) {
      console.error('Failed to load academic calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, []);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDate || !eventTitle) return;

    try {
      await api.createCalendarEvent({
        event_date: eventDate,
        title: eventTitle,
        type: eventType,
        is_instructional_day: isInstructional ? 1 : 0,
        description: eventDesc,
      });
      setShowAddModal(false);
      setEventDate('');
      setEventTitle('');
      setEventDesc('');
      fetchCalendar();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this calendar event?')) return;
    try {
      await api.deleteCalendarEvent(id);
      fetchCalendar();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredEvents = events.filter((ev) => {
    if (typeFilter !== 'ALL' && ev.type !== typeFilter) return false;
    return true;
  });

  const getEventBadge = (type: HolidayType, isInstructional: number) => {
    if (type === 'NATIONAL') {
      return (
        <span className="flex items-center space-x-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800 border border-blue-200">
          <Flag className="h-3 w-3 text-blue-600" />
          <span>National Holiday</span>
        </span>
      );
    }
    if (type === 'REGIONAL_MAHARASHTRA') {
      return (
        <span className="flex items-center space-x-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
          <SunMedium className="h-3 w-3 text-amber-600" />
          <span>Maharashtra Festival</span>
        </span>
      );
    }
    return (
      <span className="flex items-center space-x-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-800 border border-indigo-200">
        <Building className="h-3 w-3 text-indigo-600" />
        <span>ZCOER College Event</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Indian Academic Calendar & Holidays
            </h2>
            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800 border border-blue-200">
              MSBTE 2026 Term
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            National & Maharashtra state holidays. Excluded dates automatically zero-penalty student attendance calculations.
          </p>
        </div>

        {role === 'ADMIN' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-900/20 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Holiday / Event</span>
          </button>
        )}
      </div>

      {/* Guaranteed Exclusion Notice Banner */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 flex items-start space-x-3 shadow-sm">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-xs text-blue-900">
          <p className="font-bold text-blue-950">Automated Holiday Exclusion Guarantee (MSBTE Rule 14.2):</p>
          <p className="mt-0.5 text-blue-800">
            Any date marked as a Holiday (Non-Instructional Day) is automatically excluded from required conducted sessions. Holidays never count against student attendance calculations.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setTypeFilter('ALL')}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
            typeFilter === 'ALL'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
        >
          All Dates ({events.length})
        </button>
        <button
          onClick={() => setTypeFilter('NATIONAL')}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
            typeFilter === 'NATIONAL'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
        >
          National Holidays
        </button>
        <button
          onClick={() => setTypeFilter('REGIONAL_MAHARASHTRA')}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
            typeFilter === 'REGIONAL_MAHARASHTRA'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
        >
          Maharashtra Festivals
        </button>
        <button
          onClick={() => setTypeFilter('COLLEGE_EVENT')}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
            typeFilter === 'COLLEGE_EVENT'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
        >
          ZCOER College Events
        </button>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((ev) => {
            const dateObj = new Date(ev.event_date);
            const formattedDate = dateObj.toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            const isNonInstructional = ev.is_instructional_day === 0;

            return (
              <div
                key={ev.id}
                className={`card-panel rounded-2xl p-5 shadow-sm transition bg-white border ${
                  isNonInstructional
                    ? 'border-slate-200 hover:border-blue-400'
                    : 'border-indigo-200 bg-indigo-50/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-bold text-slate-700">
                      {formattedDate}
                    </span>
                    <h4 className="mt-1 text-sm font-bold text-slate-900">{ev.title}</h4>
                  </div>
                  {role === 'ADMIN' && (
                    <button
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="text-slate-400 hover:text-red-600 transition p-1"
                      title="Delete Event"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="mt-3 flex items-center space-x-2">
                  {getEventBadge(ev.type, ev.is_instructional_day)}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isNonInstructional
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {isNonInstructional ? 'Zero Penalty' : 'Instructional Event'}
                  </span>
                </div>

                {ev.description && (
                  <p className="mt-3 text-xs text-slate-500 border-t border-slate-100 pt-2">
                    {ev.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Holiday Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Add Academic Calendar Event / Holiday
            </h3>
            <form onSubmit={handleAddEvent} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Event / Holiday Date *
                </label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Title / Occasion *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali (Laxmi Pujan)"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Holiday Classification
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as HolidayType)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="REGIONAL_MAHARASHTRA">Maharashtra State Holiday / Festival</option>
                  <option value="NATIONAL">National Gazetted Holiday</option>
                  <option value="COLLEGE_EVENT">ZCOER College Specific Event / Exam</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isInst"
                  checked={isInstructional}
                  onChange={(e) => setIsInstructional(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isInst" className="text-xs text-slate-700">
                  Instructional Day (classes/exams conducted on this date)
                </label>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Annual Technical Fest / Unit Test 1"
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
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
                  Save to Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
