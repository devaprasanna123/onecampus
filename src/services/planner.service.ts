import { supabase } from '../lib/supabase';

export interface ScheduleItem {
  id?: string;
  target_date: string;
  unit_id: string;
  estimated_hours: number;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed' | 'skipped';
  unit_name?: string;
  unit_number?: number;
}

class PlannerService {
  async getSchedule(userId: string): Promise<ScheduleItem[]> {
    try {
      const { data: schedule, error } = await supabase
        .from('generated_schedule')
        .select(`
          id,
          target_date,
          unit_id,
          estimated_hours,
          priority,
          status
        `)
        .eq('user_id', userId);

      if (error) throw error;

      // Fetch units details to append names
      const { data: units } = await supabase.from('units').select('id, unit_name, unit_number');
      const unitsMap = new Map((units || []).map((u: any) => [u.id, u]));

      return (schedule || []).map((item: any) => {
        const u = unitsMap.get(item.unit_id);
        return {
          ...item,
          unit_name: (u as any)?.unit_name || 'Unit Task',
          unit_number: (u as any)?.unit_number || 0
        };
      }).sort((a: any, b: any) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime());
    } catch (e) {
      console.error('Error getting study schedule:', e);
      return [];
    }
  }

  async generateSchedule(userId: string, subjectId: string, examDateStr: string): Promise<ScheduleItem[]> {
    try {
      const today = new Date();
      const examDate = new Date(examDateStr);
      
      // Calculate remaining days (minus the exam day itself)
      const diffTime = examDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 0) {
        return [];
      }

      // Fetch units in subject
      const { data: units } = await supabase
        .from('units')
        .select('id, unit_name, unit_number, question_count')
        .eq('subject_id', subjectId)
        .order('unit_number', { ascending: true });

      if (!units || units.length === 0) return [];

      // Fetch unit completion status
      const { data: progress } = await supabase.from('question_progress').select('question_id, completed').eq('user_id', userId);
      const { data: qlist } = await supabase.from('questions').select('id, unit_id').eq('subject_id', subjectId);
      
      const incompleteUnits = units.filter((u: any) => {
        const qInUnit = (qlist || []).filter((q: any) => q.unit_id === u.id);
        if (qInUnit.length === 0) return true;
        const compInUnit = qInUnit.filter((q: any) => (progress || []).some((up: any) => (up as any).question_id === q.id && up.completed));
        return (compInUnit.length / qInUnit.length) < 0.7; // Completed if >= 70% reviewed
      });

      if (incompleteUnits.length === 0) {
        return [];
      }

      // Distribute remaining units across available study days
      // Let's reserve the last 2 days before the exam for full "Revision"
      const studyDaysCount = Math.max(diffDays - 2, 1);
      const scheduleItems: any[] = [];
      
      // Compute units per day
      // Simple allocation: distribute units linearly
      const daysPerUnit = Math.max(1, Math.floor(studyDaysCount / incompleteUnits.length));
      
      let dayIndex = 0;
      incompleteUnits.forEach((unit: any, index: any) => {
        // Assign this unit to the next 'daysPerUnit' days
        const duration = (index === incompleteUnits.length - 1) 
          ? (studyDaysCount - dayIndex) // Last unit gets all remaining study days
          : daysPerUnit;

        for (let d = 0; d < duration; d++) {
          const targetDate = new Date();
          targetDate.setDate(today.getDate() + dayIndex);
          const dateStr = targetDate.toISOString().split('T')[0];

          scheduleItems.push({
            user_id: userId,
            target_date: dateStr,
            unit_id: (unit as any).id,
            estimated_hours: 2.5,
            priority: index === 0 ? 'high' : 'medium',
            status: 'pending'
          });
          dayIndex++;
        }
      });

      // Add revision days at the end
      for (let r = 0; r < 2; r++) {
        const targetDate = new Date();
        targetDate.setDate(today.getDate() + dayIndex);
        const dateStr = targetDate.toISOString().split('T')[0];
        
        // Use the first incomplete unit or a dummy/general revision target
        scheduleItems.push({
          user_id: userId,
          target_date: dateStr,
          unit_id: incompleteUnits[incompleteUnits.length - 1].id, // Revision targets last unit context
          estimated_hours: 3.5,
          priority: 'high',
          status: 'pending'
        });
        dayIndex++;
      }

      // Clear existing future schedule items and save new schedule
      const { data: currentSchedule } = await supabase.from('generated_schedule').select('id, target_date').eq('user_id', userId);
      const futureItems = (currentSchedule || []).filter((item: any) => new Date(item.target_date).getTime() >= today.setHours(0,0,0,0));
      const futureIds = futureItems.map((item: any) => item.id);

      if (futureIds.length > 0) {
        await supabase.from('generated_schedule').delete().eq('user_id', userId);
      }

      await supabase.from('generated_schedule').upsert(scheduleItems);
      return scheduleItems;
    } catch (e) {
      console.error('Error generating schedule:', e);
      return [];
    }
  }

  async markTaskStatus(taskId: string, status: 'completed' | 'skipped' | 'pending') {
    try {
      await supabase.from('generated_schedule').update({ status }).eq('id', taskId);
    } catch (e) {
      console.error('Error updating task status:', e);
    }
  }
}

export const plannerService = new PlannerService();
