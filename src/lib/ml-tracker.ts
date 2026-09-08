import { supabase } from '@/integrations/supabase/client';

export type MLEventType = 
  | 'search'
  | 'shop_view'
  | 'product_view'
  | 'cart_add'
  | 'checkout'
  | 'recommendation_click';

export interface MLEventPayload {
  event_type: MLEventType;
  search_query?: string;
  shop_id?: string;
  product_id?: string;
  category_name?: string;
  lat?: number;
  lng?: number;
  metadata?: Record<string, any>;
}

class MLTracker {
  private queue: MLEventPayload[] = [];
  private isProcessing = false;
  private sessionId: string;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return 'server_session';
    let sid = sessionStorage.getItem('ls_ml_session_id');
    if (!sid) {
      sid = 'sid_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      sessionStorage.setItem('ls_ml_session_id', sid);
    }
    return sid;
  }

  public track(payload: MLEventPayload): void {
    if (typeof window === 'undefined') return;

    this.queue.push({
      ...payload,
      metadata: {
        ...payload.metadata,
        timestamp: new Date().toISOString(),
        referrer: document.referrer || undefined,
        url: window.location.pathname,
      },
    });

    // Schedule flush asynchronously
    if (!this.isProcessing) {
      setTimeout(() => this.flush(), 1000);
    }
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0 || this.isProcessing) return;
    this.isProcessing = true;

    const eventsToFlush = [...this.queue];
    this.queue = [];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      const records = eventsToFlush.map((evt) => ({
        user_id: userId,
        session_id: this.sessionId,
        event_type: evt.event_type,
        search_query: evt.search_query || null,
        shop_id: evt.shop_id || null,
        product_id: evt.product_id || null,
        category_name: evt.category_name || null,
        lat: evt.lat || null,
        lng: evt.lng || null,
        metadata: evt.metadata || {},
      }));

      await (supabase as any).from('ml_user_events').insert(records);
    } catch (err) {
      // Non-blocking fallback on telemetry errors
      console.debug('[MLTracker] Telemetry batch flush ignored:', err);
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        setTimeout(() => this.flush(), 2000);
      }
    }
  }
}

export const mlTracker = new MLTracker();
