import { useEffect } from 'react';
import { presenceService } from '../services/presence.service';

export function usePresence(
  user: { uid: string; displayName: string | null; email: string | null } | null,
  pageName: string,
  profile?: { id: string; name: string; email: string } | null
) {
  useEffect(() => {
    if (user) {
      presenceService.startPresenceTracker(
        user.uid,
        user.displayName || user.email?.split('@')[0] || 'Student',
        user.email || 'student@onecampus.edu',
        profile?.id // Pass database user ID
      );

      // Track page changes
      presenceService.updateCurrentPage(pageName, window.location.pathname);
    }

    return () => {
      // Set user offline when hook unmounts or user signs out
      presenceService.stopPresenceTracker();
    };
  }, [user, profile?.id]);

  // Update focused page when component props change
  useEffect(() => {
    if (user && pageName) {
      presenceService.updateCurrentPage(pageName, window.location.pathname);
    }
  }, [pageName, user]);
}
export default usePresence;
