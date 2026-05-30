import type { NotificationType } from "../constants/notification-types";
import type { User } from "./user.types";

export interface Notification {
  _id?: string;
  id?: string;
  recipient_id: string | User;
  sender_id?: string | User;
  type: NotificationType | string;
  title: string;
  body?: string;
  link_to?: string;
  is_read?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
