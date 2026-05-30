import type { Attachment } from "./file.types";
import type { User } from "./user.types";

export interface Comment {
  _id?: string;
  id?: string;
  task_id: string;
  sender_id: string | User;
  text: string;
  attachments?: Attachment[];
  mentions?: Array<string | User>;
  client_request_id?: string;
  createdAt?: string;
  updatedAt?: string;
}
