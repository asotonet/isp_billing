export interface RouterEvent {
  id: string;
  router_id: string;
  event_type: string;
  description: string;
  event_metadata: Record<string, any> | null;
  created_at: string;
  router_nombre: string | null;
  router_ip: string | null;
}

export type RouterEventType =
  | "CREATED"
  | "UPDATED"
  | "DELETED"
  | "ONLINE"
  | "OFFLINE"
  | "IDENTITY_CHANGED"
  | "VERSION_CHANGED";
