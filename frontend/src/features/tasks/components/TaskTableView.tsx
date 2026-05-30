import { useMemo, useState } from 'react';
import { addDays, format, isAfter, isBefore, isSameDay, startOfDay } from 'date-fns';
import { ChevronDown, ChevronRight, MoreHorizontal, Plus, Search, SlidersHorizontal, UserRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TaskStatusBadge from './TaskStatusBadge';
import { cn } from '@/lib/utils';
import type { Project, Task, TaskStatus, User } from '@/types';

export interface DeadlineTaskGroup {
  id: string;
  title: string;
  createDueDate?: string;
  tasks: Task[];
}

interface TaskToolbarProps {
  statusFilter: TaskStatus | 'all';
  projectFilter: string;
  groupBy: string;
  assigneeFilterLabel: string;
  projects: Project[];
  onStatusChange: (value: TaskStatus | 'all') => void;
  onProjectChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onCreate: () => void;
}

interface TaskTableViewProps {
  groups: DeadlineTaskGroup[];
  projects: Project[];
  users: User[];
  onOpenTask: (task: Task) => void;
  onCreateTask: (dueDate?: string) => void;
}

const getEntityId = (value?: string | { _id?: string; id?: string }) => (
  typeof value === 'string' ? value : value?._id || value?.id || ''
);
const getTaskId = (task: Task) => task.id || task._id || '';
const getProjectId = (project: Project) => project._id || project.id || '';

const formatDateTime = (value?: string) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return format(date, 'HH:mm dd/MM/yyyy');
};

export function TaskToolbar({
  statusFilter,
  projectFilter,
  groupBy,
  assigneeFilterLabel,
  projects,
  onStatusChange,
  onProjectChange,
  onSearchChange,
  onCreate,
}: TaskToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
      <Button type="button" size="sm" onClick={onCreate} className="h-8 gap-1.5 bg-blue-600 text-[12px] font-bold text-white hover:bg-blue-700">
        <Plus className="h-3.5 w-3.5" />
        Them moi
      </Button>
      <Select defaultValue="recent" disabled>
        <SelectTrigger className="h-8 w-40 bg-white text-[12px] opacity-70"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="recent">Cap nhat gan day</SelectItem></SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={(value) => onStatusChange(value as TaskStatus | 'all')}>
        <SelectTrigger className="h-8 w-40 bg-white text-[12px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tat ca trang thai</SelectItem>
          <SelectItem value="todo">Can lam</SelectItem>
          <SelectItem value="in_progress">Dang lam</SelectItem>
          <SelectItem value="review">Dang danh gia</SelectItem>
          <SelectItem value="needs_revision">Can sua</SelectItem>
          <SelectItem value="done">Hoan thanh</SelectItem>
        </SelectContent>
      </Select>
      <Select value={projectFilter} onValueChange={onProjectChange}>
        <SelectTrigger className="h-8 w-44 bg-white text-[12px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tat ca du an</SelectItem>
          {projects.map((project) => <SelectItem key={getProjectId(project)} value={getProjectId(project)}>{project.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <div className="flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-[12px] font-semibold text-slate-600">
        <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
        Nhom theo: <span className="font-extrabold text-slate-800">{groupBy}</span>
      </div>
      <div className="flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-[12px] font-semibold text-slate-600">
        <UserRound className="h-3.5 w-3.5 text-slate-400" />
        {assigneeFilterLabel}
      </div>
      <div className="relative ml-auto min-w-[220px]">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <Input onChange={(event) => onSearchChange(event.target.value)} placeholder="Tim nhanh cong viec" className="h-8 border-slate-200 pl-8 text-[12px]" />
      </div>
      <Button type="button" variant="outline" size="icon" disabled className="h-8 w-8 bg-white opacity-60">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function TaskGroupSection({ group, users, projects, expanded, onToggle, onOpenTask, onCreateTask }: {
  group: DeadlineTaskGroup;
  users: User[];
  projects: Project[];
  expanded: boolean;
  onToggle: () => void;
  onOpenTask: (task: Task) => void;
  onCreateTask: (dueDate?: string) => void;
}) {
  return (
    <>
      <tr className="bg-slate-50">
        <td className="sticky left-0 z-10 border-y border-slate-200 bg-slate-50 px-4 py-2" colSpan={1}>
          <button type="button" onClick={onToggle} className="flex items-center gap-2 text-left">
            {expanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
            <span className="text-[14px] font-extrabold text-slate-900">{group.title}</span>
            <span className="text-[12px] font-bold text-slate-500">({group.tasks.length})</span>
          </button>
        </td>
        <td className="border-y border-slate-200 bg-slate-50 px-3 py-2 text-right" colSpan={8}>
          <button type="button" onClick={() => onCreateTask(group.createDueDate)} className="text-[12px] font-bold text-blue-600 hover:underline">
            + Tao cong viec
          </button>
        </td>
      </tr>
      {expanded && group.tasks.map((task) => (
        <TaskTableRow key={getTaskId(task)} task={task} users={users} projects={projects} onOpenTask={onOpenTask} />
      ))}
      {expanded && (
        <tr className="border-b border-slate-100">
          <td className="sticky left-0 z-10 bg-white px-4 py-2">
            <button type="button" onClick={() => onCreateTask(group.createDueDate)} className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-400 hover:text-blue-600">
              <Plus className="h-3.5 w-3.5" />
              Tao cong viec
            </button>
          </td>
          <td colSpan={8} />
        </tr>
      )}
    </>
  );
}

export function TaskTableRow({ task, users, projects, onOpenTask }: {
  task: Task;
  users: User[];
  projects: Project[];
  onOpenTask: (task: Task) => void;
}) {
  const assigneeId = getEntityId(task.assignee_id);
  const creatorId = getEntityId(task.created_by);
  const projectId = getEntityId(task.project_id) || getEntityId(task.project);
  const assignee = task.assignee || users.find((user) => getEntityId(user) === assigneeId);
  const creator = task.createdBy || users.find((user) => getEntityId(user) === creatorId);
  const project = task.project || projects.find((item) => getProjectId(item) === projectId);

  return (
    <tr className="group border-b border-slate-100 transition hover:bg-slate-50">
      <td className="sticky left-0 z-10 min-w-[420px] bg-white px-4 py-2.5 group-hover:bg-slate-50">
        <div className="flex min-w-0 items-center gap-3">
          <Checkbox checked={task.status === 'done'} disabled className="h-4 w-4" />
          <button type="button" onClick={() => onOpenTask(task)} className={cn('truncate text-left text-[13px] font-medium hover:text-blue-600', task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-900')}>
            {task.title}
          </button>
        </div>
      </td>
      <td className="px-3 py-2.5"><TaskStatusBadge task={task} /></td>
      <td className="px-3 py-2.5 text-[12px] font-medium text-slate-500">{formatDateTime(task.start_date)}</td>
      <td className={cn('px-3 py-2.5 text-[12px] font-bold', task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-red-600' : 'text-slate-600')}>{formatDateTime(task.due_date)}</td>
      <td className="px-3 py-2.5 text-[12px] font-medium text-slate-500">{formatDateTime(task.actualFinishDate)}</td>
      <td className="max-w-[220px] truncate px-3 py-2.5 text-[12px] font-semibold text-slate-700">{project?.name || 'Chua gan'}</td>
      <td className="max-w-[220px] truncate px-3 py-2.5 text-[12px] text-slate-500">{task.group_name || 'Chung'}</td>
      <td className="px-3 py-2.5"><UserAvatarLabel user={creator} fallback="--" /></td>
      <td className="px-3 py-2.5"><UserAvatarLabel user={assignee} fallback="Chua giao" /></td>
    </tr>
  );
}

function UserAvatarLabel({ user, fallback }: { user?: User; fallback: string }) {
  if (!user) return <span className="text-[12px] text-slate-400">{fallback}</span>;
  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-6 w-6">
        <AvatarImage src={user.avatar} />
        <AvatarFallback className="bg-slate-100 text-[9px] font-bold text-slate-600">{user.full_name?.[0] || user.email[0] || 'U'}</AvatarFallback>
      </Avatar>
      <span className="max-w-[120px] truncate text-[12px] font-semibold text-slate-700">{user.full_name || user.email}</span>
    </div>
  );
}

export default function TaskTableView({ groups, users, projects, onOpenTask, onCreateTask }: TaskTableViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const visibleGroups = useMemo(() => groups.filter((group) => group.tasks.length > 0 || group.id === 'today'), [groups]);

  const isExpanded = (groupId: string) => expandedGroups[groupId] ?? true;

  return (
    <div className="h-full overflow-auto">
      <table className="w-full min-w-[1500px] border-collapse text-left">
        <thead className="sticky top-0 z-20 bg-white">
          <tr className="border-b border-slate-200 bg-white">
            <th className="sticky left-0 z-30 min-w-[420px] bg-white px-4 py-2.5 text-[11px] font-extrabold uppercase text-slate-500">Ten cong viec</th>
            <th className="w-32 px-3 py-2.5 text-[11px] font-extrabold uppercase text-slate-500">Trang thai</th>
            <th className="w-36 px-3 py-2.5 text-[11px] font-extrabold uppercase text-slate-500">Thoi gian bat dau</th>
            <th className="w-36 px-3 py-2.5 text-[11px] font-extrabold uppercase text-slate-500">Thoi han</th>
            <th className="w-36 px-3 py-2.5 text-[11px] font-extrabold uppercase text-slate-500">Thoi gian hoan...</th>
            <th className="w-56 px-3 py-2.5 text-[11px] font-extrabold uppercase text-slate-500">Du an</th>
            <th className="w-56 px-3 py-2.5 text-[11px] font-extrabold uppercase text-slate-500">Cong viec cha</th>
            <th className="w-40 px-3 py-2.5 text-[11px] font-extrabold uppercase text-slate-500">Tao boi</th>
            <th className="w-40 px-3 py-2.5 text-[11px] font-extrabold uppercase text-slate-500">Giao cho</th>
          </tr>
        </thead>
        <tbody>
          {visibleGroups.map((group) => (
            <TaskGroupSection
              key={group.id}
              group={group}
              users={users}
              projects={projects}
              expanded={isExpanded(group.id)}
              onToggle={() => setExpandedGroups((current) => ({ ...current, [group.id]: !isExpanded(group.id) }))}
              onOpenTask={onOpenTask}
              onCreateTask={onCreateTask}
            />
          ))}
          {visibleGroups.every((group) => group.tasks.length === 0) && (
            <tr>
              <td colSpan={9} className="py-20 text-center text-[13px] font-medium text-slate-400">Khong co cong viec phu hop.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export const groupTasksByDeadline = (tasks: Task[]): DeadlineTaskGroup[] => {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const nextSeven = addDays(today, 7);
  const groups: DeadlineTaskGroup[] = [
    { id: 'past', title: 'Truoc day', tasks: [] },
    { id: 'today', title: 'Hom nay', createDueDate: format(today, 'yyyy-MM-dd'), tasks: [] },
    { id: 'tomorrow', title: 'Ngay mai', createDueDate: format(tomorrow, 'yyyy-MM-dd'), tasks: [] },
    { id: 'next-7', title: '7 ngay toi', createDueDate: format(nextSeven, 'yyyy-MM-dd'), tasks: [] },
    { id: 'future', title: 'Trong tuong lai', tasks: [] },
    { id: 'no-date', title: 'Khong thoi han', tasks: [] },
  ];
  const map = new Map(groups.map((group) => [group.id, group]));

  tasks.forEach((task) => {
    if (!task.due_date) {
      map.get('no-date')?.tasks.push(task);
      return;
    }
    const due = startOfDay(new Date(task.due_date));
    if (isBefore(due, today)) map.get('past')?.tasks.push(task);
    else if (isSameDay(due, today)) map.get('today')?.tasks.push(task);
    else if (isSameDay(due, tomorrow)) map.get('tomorrow')?.tasks.push(task);
    else if (!isAfter(due, nextSeven)) map.get('next-7')?.tasks.push(task);
    else map.get('future')?.tasks.push(task);
  });

  return groups;
};
