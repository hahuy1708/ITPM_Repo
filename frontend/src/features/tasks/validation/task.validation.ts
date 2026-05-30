import type { Attachment, TaskPriority } from '@/types';

export interface CreateTaskFormValues {
  title: string;
  content_html: string;
  project_id: string;
  assignee_id: string;
  reviewer_id: string;
  priority: TaskPriority;
  group_key: string;
  group_name: string;
  kpi_weight: string;
  start_date: string;
  due_date: string;
}

export interface CreateTaskPayload {
  title: string;
  project_id: string;
  assignee_id?: string;
  reviewer_id?: string;
  priority: TaskPriority;
  group_key: string;
  group_name: string;
  kpi_weight: number;
  start_date?: string;
  due_date?: string;
  content_html: string;
  attachments: Attachment[];
  dependency_ids: string[];
}

export const createTaskValidationSchema = {
  validate(values: CreateTaskFormValues): string[] {
    const errors: string[] = [];
    if (!values.title.trim()) errors.push('Ten cong viec la bat buoc.');
    if (!values.project_id) errors.push('Can chon du an/phong ban cho cong viec.');
    if (values.start_date && values.due_date && new Date(values.start_date) > new Date(values.due_date)) {
      errors.push('Ngay bat dau khong duoc lon hon deadline.');
    }
    return errors;
  },

  toPayload(values: CreateTaskFormValues, attachments: Attachment[], dependencyIds: string[]): CreateTaskPayload {
    return {
      title: values.title.trim(),
      project_id: values.project_id,
      assignee_id: values.assignee_id === 'none' ? undefined : values.assignee_id,
      reviewer_id: values.reviewer_id === 'none' ? undefined : values.reviewer_id,
      priority: values.priority,
      group_key: values.group_key.trim() || 'general',
      group_name: values.group_name.trim() || 'Chung',
      kpi_weight: Number(values.kpi_weight) || 0,
      start_date: values.start_date || undefined,
      due_date: values.due_date || undefined,
      content_html: values.content_html,
      attachments,
      dependency_ids: dependencyIds,
    };
  },
};
