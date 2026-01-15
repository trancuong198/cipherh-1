export interface IGene {
  name: string;
  description?: string;
  // init is called once on registration
  init?(): Promise<void>;
  // onEvent is called when the system dispatches an event (e.g., telegram message, webhook)
  onEvent?(event: any): Promise<void>;
  // run is for periodic tasks (cron-like)
  run?(): Promise<void>;
  // shutdown for cleanup
  shutdown?(): Promise<void>;
  // immutable genes cannot be deregistered or modified at runtime
  immutable?: boolean;
}