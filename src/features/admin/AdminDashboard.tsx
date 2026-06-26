import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';


interface UserPresence {
  user_id: string;
  name: string;
  email: string;
  current_page: string;
  online_status: boolean;
  last_seen: string;
  session_start: string;
  device_type: string;
  browser: string;
}

interface ActivityLog {
  id: string;
  user_id: string;
  action_type: string;
  action_details: any;
  created_at: string;
}

export const AdminDashboard: React.FC = () => {
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityLog[]>([]);

  useEffect(() => {
    // Initial fetch of current presence rows
    const fetchPresence = async () => {
      const { data, error } = await supabase
        .from('user_presence')
        .select('*');
      if (!error && data) setPresences(data as UserPresence[]);
    };
    fetchPresence();

    // Subscribe to realtime changes on user_presence
    const presenceChannel = supabase.channel('public:user_presence')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_presence' }, (payload: any) => {
        const newRecord = payload.new as UserPresence;
        setPresences((prev) => {
          const without = prev.filter((p) => p.user_id !== newRecord.user_id);
          return [...without, newRecord];
        });
      })
      .subscribe();

    // Subscribe to realtime activity logs
    const activityChannel = supabase.channel('public:user_activity_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_activity_logs' }, (payload: any) => {
        const newLog = payload.new as ActivityLog;
        setActivityFeed((prev) => [newLog, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(activityChannel);
    };
  }, []);

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Admin Monitoring Panel</h1>
      <section>
        <h2 className="text-xl font-semibold mb-4">Active Users</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {presences.map((p) => (
            <div key={p.user_id} className="p-4 rounded-xl bg-white shadow-sm border border-gray-200">
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-gray-600">{p.email}</p>
              <p className="text-sm">Page: {p.current_page || '—'}</p>
              <p className="text-sm">Status: {p.online_status ? 'Online' : 'Offline'}</p>
              <p className="text-xs text-gray-500">Last seen: {new Date(p.last_seen).toLocaleTimeString()}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4">Live Activity Feed</h2>
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {activityFeed.map((log) => (
            <li key={log.id} className="p-2 bg-gray-50 rounded">
              <span className="font-medium">{log.action_type}</span> by <span className="text-blue-600">{log.user_id}</span>
              <span className="text-xs text-gray-500 ml-2">{new Date(log.created_at).toLocaleTimeString()}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
