import { supabase } from '../lib/supabase';

class PresenceService {
  private updateInterval: any = null;
  private idleTimeout: any = null;
  private lastActivityTime: number = Date.now();
  private readonly IDLE_LIMIT_MS = 2 * 60 * 1000; // 2 minutes idle detection
  private currentUserId: string | null = null;
  private currentDbUserId: string | null = null;
  private currentUserName: string = '';
  private currentUserEmail: string = '';
  private currentPageName: string = 'Dashboard';

  startPresenceTracker(userId: string, name: string, email: string, dbUserId?: string) {
    this.currentUserId = userId;
    this.currentDbUserId = dbUserId || null;
    this.currentUserName = name;
    this.currentUserEmail = email;
    this.lastActivityTime = Date.now();

    // Set user online immediately
    this.pingPresence(true);

    // Setup 30 seconds interval ping
    if (this.updateInterval) clearInterval(this.updateInterval);
    this.updateInterval = setInterval(() => {
      this.checkActivityAndPing();
    }, 30000);

    // Setup event listeners for user activity
    this.setupActivityListeners();
  }

  stopPresenceTracker() {
    if (this.updateInterval) clearInterval(this.updateInterval);
    if (this.idleTimeout) clearTimeout(this.idleTimeout);
    this.removeActivityListeners();
    
    // Set user offline
    if (this.currentUserId) {
      this.pingPresence(false);
    }
  }

  updateCurrentPage(pageName: string, pageUrl: string) {
    this.currentPageName = pageName;
    this.lastActivityTime = Date.now();

    if (!this.currentDbUserId) return;

    // Log historical page visit
    supabase
      .from('page_visits')
      .insert({
        user_id: this.currentDbUserId,
        page_name: pageName,
        page_url: pageUrl,
      })
      .then(({ error }: { error: any }) => {
        if (error) {
          console.error('[presence] page_visits.insert failed:', error?.message, {
            page_name: pageName,
            page_url: pageUrl,
          });
        }
      })
      .catch((e: unknown) => {
        console.error('[presence] page_visits.insert threw:', e);
      });

    // Instantly update active presence row page focus
    this.pingPresence(true);
  }


  private setupActivityListeners() {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach(e => {
      window.addEventListener(e, this.handleUserActivity);
    });

    // Handle tab closing or browser minimize
    window.addEventListener('beforeunload', this.handleUnload);
  }

  private removeActivityListeners() {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach(e => {
      window.removeEventListener(e, this.handleUserActivity);
    });
    window.removeEventListener('beforeunload', this.handleUnload);
  }

  private handleUserActivity = () => {
    this.lastActivityTime = Date.now();
  };

  private handleUnload = () => {
    this.pingPresenceSync(false);
  };

  private checkActivityAndPing() {
    const timeSinceLastActivity = Date.now() - this.lastActivityTime;
    const isOnline = timeSinceLastActivity < this.IDLE_LIMIT_MS;
    this.pingPresence(isOnline);
  }

  private async pingPresence(isOnline: boolean) {
    if (!this.currentDbUserId) return;

    const userAgent = navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
    const browser = userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Firefox') ? 'Firefox' : 'Safari';

    const { error } = await supabase.from('user_presence').upsert({
      user_id: this.currentDbUserId,
      name: this.currentUserName,
      email: this.currentUserEmail,
      current_page: this.currentPageName,
      online_status: isOnline,
      last_seen: new Date().toISOString(),
      session_start: new Date().toISOString(),
      device_type: isMobile ? 'Mobile' : 'Desktop',
      browser: browser,
    });

    if (error) {
      console.error('[presence] user_presence.upsert failed:', error?.message, {
        current_page: this.currentPageName,
        online_status: isOnline,
        user_id: this.currentDbUserId,
      });
      throw error;
    }

  }

  // Synchronous ping on page close using fetch/sendBeacon if needed, or simply fast local DB write
  // Removed localStorage mock fallback. Presence updates must use real Supabase.
  private pingPresenceSync(isOnline: boolean) {
    // Best-effort: reuse the async ping (cannot be awaited here)
    this.pingPresence(isOnline).catch((e) => {
      console.error('[presence] pingPresenceSync failed:', e);
    });
  }
}


export const presenceService = new PresenceService();
