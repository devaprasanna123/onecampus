import { useState, useEffect } from 'react';
import { plannerService } from '../services/planner.service';
import type { ScheduleItem } from '../services/planner.service';

export function useStudyPlanner(userId: string | undefined, subjectId: string = 'subject-chem') {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = async () => {
    if (!userId) return;
    setLoading(true);
    const data = await plannerService.getSchedule(userId);
    setSchedule(data);
    setLoading(false);
  };

  const regenerate = async (examDate: string) => {
    if (!userId) return;
    setLoading(true);
    await plannerService.generateSchedule(userId, subjectId, examDate);
    await fetchSchedule();
  };

  const updateTask = async (taskId: string, status: 'completed' | 'skipped' | 'pending') => {
    await plannerService.markTaskStatus(taskId, status);
    // Refresh schedule locally
    setSchedule(prev => 
      prev.map(item => item.id === taskId ? { ...item, status } : item)
    );
  };

  useEffect(() => {
    if (userId) {
      fetchSchedule();
    }
  }, [userId, subjectId]);

  return {
    schedule,
    loading,
    regenerate,
    updateTask,
    refreshSchedule: fetchSchedule
  };
}
export default useStudyPlanner;
