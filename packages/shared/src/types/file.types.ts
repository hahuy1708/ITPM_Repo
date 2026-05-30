import type { User } from "./user.types";

export interface Attachment {
  file_name: string;
  file_url: string;
  file_type?: string;
  size?: number;
  uploaded_by?: string | User;
  uploaded_at?: string;
  storage_key?: string;
  preview_url?: string;
}
