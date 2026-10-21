import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface QueuedSession {
  id: string;
  subject_id: string;
  division_id: string;
  session_date: string;
  lecture_slot: string;
  room_no?: string;
  records: { student_id: string; status: string }[];
  timestamp: number;
}

interface OfflineContextType {
  isOnline: boolean;
  queuedSessions: QueuedSession[];
  queueSession: (session: Omit<QueuedSession, 'id' | 'timestamp'>) => void;
  syncNow: () => Promise<number>;
  isSyncing: boolean;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

const STORAGE_KEY = 'zcoer_offline_attendance_queue';

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [queuedSessions, setQueuedSessions] = useState<QueuedSession[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-trigger sync when network reconnects
      syncNow();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queuedSessions]);

  const saveQueue = (queue: QueuedSession[]) => {
    setQueuedSessions(queue);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  };

  const queueSession = (sessionData: Omit<QueuedSession, 'id' | 'timestamp'>) => {
    const newSession: QueuedSession = {
      ...sessionData,
      id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    const updated = [...queuedSessions, newSession];
    saveQueue(updated);
  };

  const syncNow = async (): Promise<number> => {
    if (queuedSessions.length === 0 || !navigator.onLine || isSyncing) return 0;
    setIsSyncing(true);
    try {
      const res = await api.syncOfflineAttendance(queuedSessions);
      saveQueue([]);
      return res.syncedCount;
    } catch (err) {
      console.error('Offline sync failed:', err);
      return 0;
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        queuedSessions,
        queueSession,
        syncNow,
        isSyncing,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
