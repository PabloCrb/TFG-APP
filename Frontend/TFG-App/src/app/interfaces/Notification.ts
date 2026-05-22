export interface UserNotification {
  id?: string;
  user_id?: number;
  type?: string;
  title?: string;
  message?: string;
  read?: boolean;
  created_at?: string;
  removing?: boolean;
}
