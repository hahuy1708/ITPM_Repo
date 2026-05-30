import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus } from '@/types';

const statusMeta: Record<TaskStatus | 'overdue' | 'late_done', { label: string; className: string }> = {
  todo: { label: 'CAN LAM', className: 'border-slate-300 bg-slate-100 text-slate-600' },
  in_progress: { label: 'DANG LAM', className: 'border-blue-200 bg-blue-50 text-blue-700' },
  review: { label: 'DANG DANH GIA', className: 'border-violet-200 bg-violet-50 text-violet-700' },
  needs_revision: { label: 'CAN SUA', className: 'border-red-200 bg-red-50 text-red-700' },
  done: { label: 'HOAN THANH', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  overdue: { label: 'QUA HAN', className: 'border-red-200 bg-red-100 text-red-700' },
  late_done: { label: 'HOAN THANH MUON', className: 'border-amber-200 bg-amber-100 text-amber-700' },
};

export const getComputedTaskStatus = (task: Task): TaskStatus | 'overdue' | 'late_done' => {
  const due = task.due_date ? new Date(task.due_date) : null;
  const finished = task.actualFinishDate ? new Date(task.actualFinishDate) : null;
  if (task.status === 'done' && due && finished && finished > due) return 'late_done';
  if (task.status !== 'done' && due && due < new Date()) return 'overdue';
  return task.status;
};

export default function TaskStatusBadge({ task, className }: { task: Task; className?: string }) {
  const meta = statusMeta[getComputedTaskStatus(task)] || statusMeta.todo;
  return (
    <Badge variant="outline" className={cn('rounded px-2 py-0.5 text-[10px] font-extrabold', meta.className, className)}>
      {meta.label}
    </Badge>
  );
}
