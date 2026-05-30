import { useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronRight, Plus, Search, Star, Target, Users, type LucideIcon } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import TaskStatusBadge from './TaskStatusBadge';
import { cn } from '@/lib/utils';
import type { Department, Project, Task, TaskGroup, User } from '@/types';

interface ProjectTaskListProps {
  title: string;
  project?: Project | null;
  department?: Department | null;
  tasks: Task[];
  taskGroups: TaskGroup[];
  users: User[];
  canCreateTask: boolean;
  onCreateTask: (groupKey?: string) => void;
  onCreateGroup?: () => void;
  onOpenTask: (task: Task) => void;
}

const statusColors = {
  todo: '#94a3b8',
  in_progress: '#0ea5e9',
  review: '#7c3aed',
  needs_revision: '#ef4444',
  done: '#22c55e',
};

const getEntityId = (value?: string | { _id?: string; id?: string }) => (
  typeof value === 'string' ? value : value?._id || value?.id || ''
);
const getTaskId = (task: Task) => task.id || task._id || '';

const formatDate = (value?: string) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('vi-VN');
};

export default function ProjectTaskList({
  title,
  project,
  department,
  tasks,
  taskGroups,
  users,
  canCreateTask,
  onCreateTask,
  onCreateGroup,
  onOpenTask,
}: ProjectTaskListProps) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filteredTasks = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return tasks.filter((task) => !keyword || task.title.toLowerCase().includes(keyword) || (task.group_name || '').toLowerCase().includes(keyword));
  }, [tasks, search]);

  const groups = useMemo(() => {
    const map = new Map(taskGroups.map((group) => [group.key, { ...group, tasks: [] as Task[] }]));
    if (!map.has('general')) map.set('general', { key: 'general', name: 'Chua phan loai', tasks: [] });
    filteredTasks.forEach((task) => {
      const key = task.group_key || 'general';
      if (!map.has(key)) map.set(key, { key, name: task.group_name || 'Chung', tasks: [] });
      map.get(key)?.tasks.push(task);
    });
    return [...map.values()].filter((group) => group.tasks.length > 0 || group.key === 'general');
  }, [filteredTasks, taskGroups]);

  const isExpanded = (groupKey: string) => expanded[groupKey] ?? true;

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_300px] gap-4">
      <div className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2">
          {canCreateTask && (
            <Button type="button" size="sm" onClick={() => onCreateTask()} className="h-8 gap-1.5 bg-blue-600 text-[12px] font-bold text-white hover:bg-blue-700">
              <Plus className="h-3.5 w-3.5" />
              Tao cong viec moi
            </Button>
          )}
          {canCreateTask && (
            <Button type="button" variant="outline" size="sm" onClick={onCreateGroup} disabled={!onCreateGroup} className="h-8 bg-white text-[12px] font-semibold">
              Tao nhom cong viec moi
            </Button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <select disabled className="h-8 cursor-not-allowed rounded-md border border-slate-200 bg-white px-2 text-[12px] font-semibold text-slate-400">
              <option>Ngay tao</option>
            </select>
            <select disabled className="h-8 cursor-not-allowed rounded-md border border-slate-200 bg-white px-2 text-[12px] font-semibold text-slate-400">
              <option>Bo loc: Tat ca</option>
            </select>
            <select disabled className="h-8 cursor-not-allowed rounded-md border border-slate-200 bg-white px-2 text-[12px] font-semibold text-slate-400">
              <option>Tuy chon hien thi</option>
            </select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tim nhanh cong viec" className="h-8 w-48 border-slate-200 pl-8 text-[12px]" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <TaskGroupList
            groups={groups}
            users={users}
            expanded={isExpanded}
            onToggle={(groupKey) => setExpanded((current) => ({ ...current, [groupKey]: !isExpanded(groupKey) }))}
            onCreateTask={onCreateTask}
            onOpenTask={onOpenTask}
          />
        </div>
      </div>

      <ProjectSummaryPanel title={title} project={project} department={department} tasks={tasks} users={users} />
    </div>
  );
}

export function TaskGroupList({ groups, users, expanded, onToggle, onCreateTask, onOpenTask }: {
  groups: Array<TaskGroup & { tasks: Task[] }>;
  users: User[];
  expanded: (groupKey: string) => boolean;
  onToggle: (groupKey: string) => void;
  onCreateTask: (groupKey?: string) => void;
  onOpenTask: (task: Task) => void;
}) {
  return (
    <div className="divide-y divide-slate-200">
      {groups.map((group) => {
        const done = group.tasks.filter((task) => task.status === 'done').length;
        const open = expanded(group.key);
        return (
          <section key={group.key}>
            <div className="flex items-center gap-2 bg-white px-4 py-3">
              <button type="button" onClick={() => onToggle(group.key)} className="text-slate-400">
                {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              <h3 className="text-[14px] font-extrabold text-slate-900">{group.name}</h3>
              <span className="text-[12px] font-bold text-slate-500">{done}/{group.tasks.length}</span>
              <button type="button" onClick={() => onCreateTask(group.key)} className="ml-auto text-[12px] font-bold text-blue-600 hover:underline">
                + Them cong viec
              </button>
            </div>
            {open && (
              <div className="divide-y divide-slate-100">
                {group.tasks.map((task) => (
                  <ProjectTaskRow key={getTaskId(task)} task={task} users={users} onOpenTask={onOpenTask} />
                ))}
                <TaskQuickCreateRow onCreate={() => onCreateTask(group.key)} />
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function ProjectTaskRow({ task, users, onOpenTask }: { task: Task; users: User[]; onOpenTask: (task: Task) => void }) {
  const assignee = task.assignee || users.find((user) => getEntityId(user) === getEntityId(task.assignee_id));
  const overdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_120px_110px_32px] items-center gap-3 px-4 py-2.5 transition hover:bg-slate-50">
      <div className="flex min-w-0 items-start gap-3">
        <Checkbox checked={task.status === 'done'} disabled className={cn('mt-0.5 h-4 w-4', task.status === 'done' && 'border-emerald-500')} />
        <button type="button" onClick={() => onOpenTask(task)} className="min-w-0 text-left">
          <span className={cn('block truncate text-[13px] font-semibold hover:text-blue-600', task.status === 'done' ? 'text-emerald-700' : 'text-slate-900')}>
            {task.title}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            <TaskStatusBadge task={task} />
            {task.priority && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-500">{task.priority}</span>}
            {task.attachment_count ? <span className="text-[11px] font-medium text-slate-400">{task.attachment_count} file</span> : null}
          </span>
        </button>
      </div>
      <div className={cn('text-right text-[12px] font-bold', overdue ? 'text-red-600' : 'text-slate-500')}>
        {formatDate(task.due_date)}
      </div>
      <div className="flex items-center justify-end gap-1.5">
        {assignee && (
          <>
            <Avatar className="h-6 w-6">
              <AvatarImage src={assignee.avatar} />
              <AvatarFallback className="bg-slate-100 text-[9px] font-bold">{assignee.full_name?.[0] || assignee.email[0]}</AvatarFallback>
            </Avatar>
            <span className="max-w-[76px] truncate text-[12px] font-medium text-slate-500">{assignee.full_name}</span>
          </>
        )}
      </div>
      <Star className="h-4 w-4 text-slate-300" />
    </div>
  );
}

export function TaskQuickCreateRow({ onCreate }: { onCreate: () => void }) {
  return (
    <button type="button" onClick={onCreate} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] font-medium text-slate-400 hover:bg-slate-50 hover:text-blue-600">
      <Plus className="h-3.5 w-3.5" />
      Them cong viec
    </button>
  );
}

export function ProjectSummaryPanel({ title, project, department, tasks, users }: {
  title: string;
  project?: Project | null;
  department?: Department | null;
  tasks: Task[];
  users: User[];
}) {
  const done = tasks.filter((task) => task.status === 'done').length;
  const total = tasks.length;
  const percentage = total ? Math.round((done / total) * 100) : project?.progress || 0;
  const overdueTasks = tasks.filter((task) => task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done');
  const statusData = Object.entries(statusColors).map(([status, color]) => ({
    status,
    value: tasks.filter((task) => task.status === status).length,
    color,
  }));

  return (
    <aside className="overflow-y-auto rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-[16px] font-extrabold text-slate-900">{title}</h2>
        <p className="mt-1 text-[12px] font-medium text-slate-500">{project?.description || department?.description || 'Chua co mo ta'}</p>
        <div className="mt-3 flex items-center gap-3">
          <Progress value={percentage} className="h-2 flex-1" />
          <span className="text-[12px] font-extrabold text-slate-900">{percentage}%</span>
        </div>
      </div>

      <div className="space-y-3 border-b border-slate-200 p-4 text-[12px] font-medium text-slate-600">
        <SummaryLine icon={CalendarDays} label="Ngay bat dau - Ngay ket thuc" value={`${formatDate(project?.start_date)} - ${formatDate(project?.end_date)}`} />
        <SummaryLine icon={Target} label="Department" value={department?.name || 'Chua gan'} />
        <SummaryLine icon={Users} label="Thanh vien" value={`${users.length} thanh vien`} />
      </div>

      <div className="border-b border-slate-200 p-4">
        <p className="mb-3 text-[12px] font-extrabold text-slate-800">Cong viec cua toi</p>
        <div className="grid grid-cols-3 gap-2">
          <MiniCount label="Can lam" value={tasks.filter((task) => task.status === 'todo').length} color="text-slate-600" />
          <MiniCount label="Dang lam" value={tasks.filter((task) => task.status === 'in_progress').length} color="text-blue-600" />
          <MiniCount label="Hoan thanh" value={done} color="text-emerald-600" />
        </div>
      </div>

      <div className="border-b border-slate-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[12px] font-extrabold text-red-600">Can luu y</p>
          <span className="text-[12px] font-bold text-slate-400">{overdueTasks.length}</span>
        </div>
        <div className="space-y-2">
          {overdueTasks.slice(0, 3).map((task) => (
            <div key={getTaskId(task)} className="rounded-md border border-red-100 bg-red-50 px-2 py-1.5 text-[12px] font-medium text-red-700">
              {task.title}
            </div>
          ))}
          {overdueTasks.length === 0 && <p className="text-[12px] text-slate-400">Khong co viec qua han.</p>}
        </div>
      </div>

      <div className="p-4">
        <p className="mb-3 text-[12px] font-extrabold text-slate-800">Thong tin chung</p>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <PieChart>
              <Pie data={statusData} dataKey="value" innerRadius={38} outerRadius={56} strokeWidth={0}>
                {statusData.map((item) => <Cell key={item.status} fill={item.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </aside>
  );
}

function SummaryLine({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-400">{label}</p>
        <p className="truncate text-[12px] font-bold text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function MiniCount({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-center">
      <p className={cn('text-[14px] font-black', color)}>{value}</p>
      <p className="mt-0.5 text-[10px] font-bold text-slate-400">{label}</p>
    </div>
  );
}
