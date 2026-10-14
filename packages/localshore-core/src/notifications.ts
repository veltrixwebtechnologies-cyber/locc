export interface AppNotification {
  id: string;
  title: string;
  body: string;
  kind: string;
  link?: string | null;
  read_at?: string | null;
  created_at: string;
}
