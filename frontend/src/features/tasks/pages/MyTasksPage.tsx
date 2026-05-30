import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Clock3,
  FolderKanban,
  Gauge,
  ListChecks,
  Loader2,
  Plus,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import { departmentService } from '@/features/departments/api/department.api';
import { projectService } from '@/features/projects/api/project.api';
import { taskService } from '@/features/tasks/api/task.api';
import { userService } from '@/features/users/api/user.api';
import CreateTaskModal from '@/features/tasks/components/CreateTaskModal';
import TaskDetailPanel from '@/features/tasks/components/TaskDetailPanel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { type Department, type Project, type Task, type TaskStatus, type User } from '@/types';

const STATUS_CONFIG: Record<TaskStatus, { label: string; classes: string; color: string }> = {
  todo: { label: 'Todo', classes: 'bg-slate-100 text-slate-600 border-slate-200', color: '#64748b' },
  in_progress: { label: 'In Progress', classes: 'bg-blue-50 text-blue-600 border-blue-200', color: '#2563eb' },
  review: { label: 'Pending Review', classes: 'bg-amber-50 text-amber-600 border-amber-200', color: '#d97706' },
  needs_revision: { label: 'Needs Revision', classes: 'bg-red-50 text-red-600 border-red-200', color: '#dc2626' },
  done: { label: 'Done', classes: 'bg-emerald-50 text-emerald-600 border-emerald-200', color: '#059669' },
};

const STATUS_TABS: Array<{ id: TaskStatus | 'all'; label: string }> = [
  { id: 'all', label: 'Tat ca' },
  { id: 'todo', label: 'Todo' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'review', label: 'Pending Review' },
  { id: 'needs_revision', label: 'Needs Revision' },
  { id: 'done', label: 'Done' },
];

const getEntityId = (value?: string | { _id?: string; id?: string }) =>
  typeof value === 'string' ? value : value?._id || value?.id || '';

const getTaskId = (task: Task) => task.id || task._id || '';
const getTaskProjectId = (task: Task) => getEntityId(task.project_id) || getEntityId(task.project);
const getProjectId = (project: Project) => project._id || project.id || '';
const getDepartmentId = (department: Department) => department._id || department.id || '';

const hasUser = (values: Array<string | User> = [], userId: string) => values.some((value) => getEntityId(value) === userId);

const isTaskOverdue = (task: Task) => Boolean(task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done');

type ViewMode = 'tasks' | 'dashboard' | 'projects' | 'departments';

interface WorkGroup {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  href?: string;
  tasks: Task[];
}

export default function MyTasks() {
  const { user, token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('tasks');
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const userId = user?._id || user?.id || '';
  const canCreateTask = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    void loadData();
  }, [token, userId, user?.role]);

  const loadData = async () => {
    if (!token || !userId) return;

    try {
      setIsLoading(true);
      setError('');
      const canLoadUsers = user?.role === 'admin' || user?.role === 'manager';
      const [taskList, projectResponse, departmentResponse, userResponse] = await Promise.all([
        taskService.getTasks(token, { assigneeId: userId, limit: 200 }),
        projectService.getProjects(token, { page: 1, limit: 100 }),
        departmentService.getDepartments(token).catch(() => ({ success: true, data: [] as Department[] })),
        canLoadUsers ? userService.getUsers(token) : Promise.resolve({ success: true, data: user ? [user] : [] }),
      ]);

      setTasks(taskList);
      setProjects(projectResponse.data || []);
      setDepartments(departmentResponse.data || []);
      setUsers(userResponse.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load my tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const projectMap = useMemo(() => (
    new Map(projects.map((project) => [getProjectId(project), project]))
  ), [projects]);

  const departmentMap = useMemo(() => {
    const map = new Map<string, Department>();
    departments.forEach((department) => {
      const id = getDepartmentId(department);
      if (id) map.set(id, department);
    });
    projects.forEach((project) => {
      if (typeof project.department_id === 'object') {
        const id = getDepartmentId(project.department_id);
        if (id && !map.has(id)) map.set(id, project.department_id);
      }
    });
    if (typeof user?.department_id === 'object') {
      const id = getDepartmentId(user.department_id);
      if (id && !map.has(id)) map.set(id, user.department_id);
    }
    return map;
  }, [departments, projects, user?.department_id]);

  const getProjectForTask = (task: Task): Project => {
    const projectId = getTaskProjectId(task);
    return projectMap.get(projectId) || task.project || {
      id: projectId || 'unknown',
      name: 'Khong ro du an',
      status: 'planning',
      progress: 0,
    };
  };

  const getDepartmentForProject = (project?: Project | null): Department | null => {
    if (!project?.department_id) return null;
    if (typeof project.department_id === 'object') return project.department_id;
    return departmentMap.get(project.department_id) || null;
  };

  const getDepartmentForTask = (task: Task): Department | null => getDepartmentForProject(getProjectForTask(task));
  const getTaskDepartmentId = (task: Task) => {
    const department = getDepartmentForTask(task);
    return department ? getDepartmentId(department) : 'none';
  };

  const personalProjects = useMemo(() => {
    const ids = new Set<string>();
    tasks.forEach((task) => {
      const id = getTaskProjectId(task);
      if (id) ids.add(id);
    });
    projects.forEach((project) => {
      if (getEntityId(project.owner_id) === userId || hasUser(project.member_ids, userId)) ids.add(getProjectId(project));
    });
    return [...ids]
      .map((id) => projectMap.get(id))
      .filter((project): project is Project => Boolean(project))
      .sort((left, right) => left.name.localeCompare(right.name, 'vi'));
  }, [projectMap, projects, tasks, userId]);

  const personalDepartments = useMemo(() => {
    const ids = new Set<string>();
    departments.forEach((department) => {
      const id = getDepartmentId(department);
      if (id) ids.add(id);
    });
    personalProjects.forEach((project) => {
      const department = getDepartmentForProject(project);
      const id = department ? getDepartmentId(department) : getEntityId(project.department_id);
      if (id) ids.add(id);
    });
    const ownDepartmentId = getEntityId(user?.department_id);
    if (ownDepartmentId) ids.add(ownDepartmentId);
    return [...ids]
      .map((id) => departmentMap.get(id))
      .filter((department): department is Department => Boolean(department))
      .sort((left, right) => left.name.localeCompare(right.name, 'vi'));
  }, [departmentMap, departments, personalProjects, user?.department_id]);

  const filteredTasks = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const project = getProjectForTask(task);
      const department = getDepartmentForTask(task);
      const projectId = getProjectId(project);
      const departmentId = department ? getDepartmentId(department) : 'none';
      const matchesKeyword = !keyword
        || task.title.toLowerCase().includes(keyword)
        || (task.description || '').toLowerCase().includes(keyword)
        || (task.content_html || '').toLowerCase().includes(keyword)
        || project.name.toLowerCase().includes(keyword)
        || (department?.name || '').toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesProject = projectFilter === 'all' || projectId === projectFilter;
      const matchesDepartment = departmentFilter === 'all' || departmentId === departmentFilter;
      return matchesKeyword && matchesStatus && matchesProject && matchesDepartment;
    });
  }, [tasks, search, statusFilter, projectFilter, departmentFilter, projectMap, departmentMap]);

  const dashboard = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const total = filteredTasks.length;
    const done = filteredTasks.filter((task) => task.status === 'done').length;
    const inProgress = filteredTasks.filter((task) => task.status === 'in_progress').length;
    const review = filteredTasks.filter((task) => task.status === 'review').length;
    const overdue = filteredTasks.filter(isTaskOverdue).length;
    const dueSoon = filteredTasks.filter((task) => (
      task.due_date
      && task.status !== 'done'
      && new Date(task.due_date) >= today
      && new Date(task.due_date) <= nextWeek
    )).length;

    const statusRows = (Object.keys(STATUS_CONFIG) as TaskStatus[]).map((status) => {
      const count = filteredTasks.filter((task) => task.status === status).length;
      return {
        status,
        count,
        percentage: total ? Math.round((count / total) * 100) : 0,
        ...STATUS_CONFIG[status],
      };
    });

    const projectRows = personalProjects.map((project) => {
      const projectTasks = filteredTasks.filter((task) => getTaskProjectId(task) === getProjectId(project));
      const projectDone = projectTasks.filter((task) => task.status === 'done').length;
      return {
        project,
        total: projectTasks.length,
        done: projectDone,
        overdue: projectTasks.filter(isTaskOverdue).length,
        percentage: projectTasks.length ? Math.round((projectDone / projectTasks.length) * 100) : 0,
      };
    }).filter((row) => row.total > 0 || projectFilter === 'all');

    const departmentRows = personalDepartments.map((department) => {
      const departmentId = getDepartmentId(department);
      const departmentTasks = filteredTasks.filter((task) => getTaskDepartmentId(task) === departmentId);
      const departmentDone = departmentTasks.filter((task) => task.status === 'done').length;
      return {
        department,
        total: departmentTasks.length,
        done: departmentDone,
        overdue: departmentTasks.filter(isTaskOverdue).length,
        percentage: departmentTasks.length ? Math.round((departmentDone / departmentTasks.length) * 100) : 0,
      };
    }).filter((row) => row.total > 0 || departmentFilter === 'all');

    return {
      total,
      done,
      inProgress,
      review,
      overdue,
      dueSoon,
      completionRate: total ? Math.round((done / total) * 100) : 0,
      statusRows,
      projectRows,
      departmentRows,
      upcomingTasks: filteredTasks
        .filter((task) => task.due_date && task.status !== 'done')
        .sort((left, right) => new Date(left.due_date || '').getTime() - new Date(right.due_date || '').getTime())
        .slice(0, 6),
    };
  }, [filteredTasks, personalProjects, personalDepartments, projectFilter, departmentFilter]);

  const groupedTasks = useMemo<WorkGroup[]>(() => {
    const groups = new Map<string, WorkGroup>();

    filteredTasks.forEach((task) => {
      const project = getProjectForTask(task);
      const department = getDepartmentForTask(task);
      const groupId = viewMode === 'departments'
        ? (department ? getDepartmentId(department) : 'none')
        : getProjectId(project);

      if (!groups.has(groupId)) {
        groups.set(groupId, viewMode === 'departments'
          ? {
            id: groupId,
            name: department?.name || 'Chua gan phong ban',
            subtitle: department?.code || `${filteredTasks.filter((item) => getTaskDepartmentId(item) === groupId).length} cong viec`,
            color: department?.color || '#64748b',
            href: department ? `/departments/${groupId}` : undefined,
            tasks: [],
          }
          : {
            id: groupId,
            name: project.name,
            subtitle: getDepartmentForProject(project)?.name || 'Chua gan phong ban',
            color: project.color || '#2563EB',
            href: groupId !== 'unknown' ? `/projects/${groupId}` : undefined,
            tasks: [],
          });
      }

      groups.get(groupId)?.tasks.push(task);
    });

    return [...groups.values()].sort((left, right) => left.name.localeCompare(right.name, 'vi'));
  }, [filteredTasks, viewMode, projectMap, departmentMap]);

  useEffect(() => {
    setExpandedGroups((current) => {
      const next = { ...current };
      groupedTasks.forEach((group) => {
        if (!(group.id in next)) next[group.id] = true;
      });
      return next;
    });
  }, [groupedTasks]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((current) => ({ ...current, [groupId]: !current[groupId] }));
  };

  const handleTaskUpdated = (updated: Task) => {
    const updatedId = getTaskId(updated);
    setTasks((current) => current.map((task) => getTaskId(task) === updatedId ? updated : task));
    setSelectedTask(updated);
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setProjectFilter('all');
    setDepartmentFilter('all');
  };

  return (
    <div className="flex h-[calc(100vh-101px)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex-shrink-0 bg-white">
        <div className="border-b border-slate-200 px-5 pt-4">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[20px] font-bold tracking-tight text-slate-950">Viec cua toi</h1>
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[11px] font-bold text-emerald-700">
                  {dashboard.completionRate}% hoan thanh
                </Badge>
              </div>
              <p className="mt-1 text-[12px] font-medium text-slate-500">
                {user?.full_name || 'User'} dang co mat trong {personalProjects.length} du an va {personalDepartments.length} phong ban.
              </p>
            </div>

            {canCreateTask && (
              <Button size="sm" onClick={() => setShowCreate(true)} className="h-8 gap-1.5 bg-emerald-600 text-xs font-medium text-white hover:bg-emerald-700">
                <Plus className="h-3.5 w-3.5" />
                Tao cong viec
              </Button>
            )}
          </div>

          <div className="flex gap-6 overflow-x-auto">
            {[
              { id: 'tasks', label: 'Cong viec cua toi', icon: ListChecks },
              { id: 'dashboard', label: 'Dashboard ca nhan', icon: Gauge },
              { id: 'projects', label: 'Theo du an', icon: FolderKanban },
              { id: 'departments', label: 'Theo phong ban', icon: Building2 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id as ViewMode)}
                className={cn(
                  'relative flex items-center gap-1.5 whitespace-nowrap pb-3 text-[13px] font-medium transition-colors',
                  viewMode === tab.id ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900'
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {viewMode === tab.id && <div className="absolute bottom-0 left-0 h-[2px] w-full bg-emerald-600" />}
              </button>
            ))}
          </div>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px] max-w-md flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tim cong viec, du an, phong ban..."
                className="h-8 border-slate-300 bg-white pl-9 text-[13px] focus-visible:ring-emerald-500"
              />
            </div>

            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="h-8 w-56 bg-white text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tat ca du an cua toi</SelectItem>
                {personalProjects.map((project) => (
                  <SelectItem key={getProjectId(project)} value={getProjectId(project)}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="h-8 w-56 bg-white text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tat ca phong ban cua toi</SelectItem>
                {personalDepartments.map((department) => (
                  <SelectItem key={getDepartmentId(department)} value={getDepartmentId(department)}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TaskStatus | 'all')}>
              <SelectTrigger className="h-8 w-44 bg-white text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_TABS.map((tab) => (
                  <SelectItem key={tab.id} value={tab.id}>{tab.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={resetFilters} className="h-8 bg-white text-[12px] font-semibold">
              Reset
            </Button>
          </div>

          <div className="mt-3 flex gap-5 overflow-x-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  'relative whitespace-nowrap pb-2 text-[12px] font-bold transition-colors',
                  statusFilter === tab.id ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900'
                )}
              >
                {tab.label}
                {statusFilter === tab.id && <div className="absolute bottom-0 left-0 h-[2px] w-full bg-emerald-600" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="mx-5 mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="flex-1 overflow-auto bg-[#f3f4f6] p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : viewMode === 'dashboard' ? (
          <PersonalDashboard
            dashboard={dashboard}
            projectCount={personalProjects.length}
            departmentCount={personalDepartments.length}
            getProjectForTask={getProjectForTask}
            getDepartmentForTask={getDepartmentForTask}
            onOpenTask={setSelectedTask}
          />
        ) : viewMode === 'tasks' ? (
          filteredTasks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
              Khong co task phu hop.
            </div>
          ) : (
            <div className="mx-auto max-w-6xl">
              <FlatTaskTable
                tasks={filteredTasks}
                users={users}
                currentUser={user}
                getProjectForTask={getProjectForTask}
                getDepartmentForTask={getDepartmentForTask}
                onOpenTask={setSelectedTask}
              />
            </div>
          )
        ) : groupedTasks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
            Khong co task phu hop.
          </div>
        ) : (
          <div className="mx-auto max-w-6xl space-y-5">
            {groupedTasks.map((group) => (
              <TaskGroupTable
                key={group.id}
                group={group}
                expanded={expandedGroups[group.id] ?? true}
                users={users}
                currentUser={user}
                getProjectForTask={getProjectForTask}
                getDepartmentForTask={getDepartmentForTask}
                onToggle={() => toggleGroup(group.id)}
                onOpenTask={setSelectedTask}
              />
            ))}
          </div>
        )}
      </div>

      <CreateTaskModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={loadData} />
      <TaskDetailPanel
        task={selectedTask}
        open={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        projectId={selectedTask ? getTaskProjectId(selectedTask) : ''}
        users={users}
        onUpdate={handleTaskUpdated}
      />
    </div>
  );
}

function PersonalDashboard({
  dashboard,
  projectCount,
  departmentCount,
  getProjectForTask,
  getDepartmentForTask,
  onOpenTask,
}: {
  dashboard: {
    total: number;
    done: number;
    inProgress: number;
    review: number;
    overdue: number;
    dueSoon: number;
    completionRate: number;
    statusRows: Array<{ status: TaskStatus; label: string; count: number; percentage: number; color: string }>;
    projectRows: Array<{ project: Project; total: number; done: number; overdue: number; percentage: number }>;
    departmentRows: Array<{ department: Department; total: number; done: number; overdue: number; percentage: number }>;
    upcomingTasks: Task[];
  };
  projectCount: number;
  departmentCount: number;
  getProjectForTask: (task: Task) => Project;
  getDepartmentForTask: (task: Task) => Department | null;
  onOpenTask: (task: Task) => void;
}) {
  return (
    <div className="mx-auto max-w-[1480px] space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        <PersonalStat icon={ListChecks} label="Tong viec" value={dashboard.total} helper={`${dashboard.done} da xong`} />
        <PersonalStat icon={CheckCircle2} label="Hoan thanh" value={`${dashboard.completionRate}%`} helper={`${dashboard.done}/${dashboard.total} task`} />
        <PersonalStat icon={Clock3} label="Dang lam" value={dashboard.inProgress} helper={`${dashboard.review} cho duyet`} />
        <PersonalStat icon={AlertTriangle} label="Can chu y" value={dashboard.overdue} helper={`${dashboard.dueSoon} sap den han`} />
        <PersonalStat icon={FolderKanban} label="Du an" value={projectCount} helper="workspace co mat" />
        <PersonalStat icon={Building2} label="Phong ban" value={departmentCount} helper="pham vi tham gia" />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <section className="enterprise-panel p-4 xl:col-span-4">
          <SectionHeader title="Trang thai cong viec" description="Phan bo task ca nhan theo bo loc hien tai." />
          <div className="mt-4 space-y-3">
            {dashboard.statusRows.map((row) => (
              <MetricBar key={row.status} label={row.label} value={row.count} percentage={row.percentage} color={row.color} />
            ))}
          </div>
        </section>

        <section className="enterprise-panel p-4 xl:col-span-4">
          <SectionHeader title="Du an cua toi" description="Tien do task ca nhan ben trong tung du an." />
          <div className="mt-4 space-y-4">
            {dashboard.projectRows.slice(0, 6).map((row) => (
              <ProgressRow
                key={getProjectId(row.project)}
                label={row.project.name}
                subtitle={`${row.done}/${row.total} done${row.overdue ? ` - ${row.overdue} tre han` : ''}`}
                percentage={row.percentage}
                color={row.project.color || '#10b981'}
                href={`/projects/${getProjectId(row.project)}`}
              />
            ))}
            {dashboard.projectRows.length === 0 && <EmptyBlock label="Chua co du an phu hop." />}
          </div>
        </section>

        <section className="enterprise-panel p-4 xl:col-span-4">
          <SectionHeader title="Phong ban cua toi" description="Nhin task ca nhan theo tung phong ban." />
          <div className="mt-4 space-y-4">
            {dashboard.departmentRows.slice(0, 6).map((row) => (
              <ProgressRow
                key={getDepartmentId(row.department)}
                label={row.department.name}
                subtitle={`${row.done}/${row.total} done${row.overdue ? ` - ${row.overdue} tre han` : ''}`}
                percentage={row.percentage}
                color={row.department.color || '#2563EB'}
                href={`/departments/${getDepartmentId(row.department)}`}
              />
            ))}
            {dashboard.departmentRows.length === 0 && <EmptyBlock label="Chua co phong ban phu hop." />}
          </div>
        </section>
      </div>

      <section className="enterprise-panel">
        <div className="border-b border-slate-100 px-4 py-3">
          <SectionHeader title="Sap den han" description="Nhung viec can uu tien trong lich ca nhan." />
        </div>
        <div className="divide-y divide-slate-100">
          {dashboard.upcomingTasks.map((task) => {
            const project = getProjectForTask(task);
            const department = getDepartmentForTask(task);
            const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;

            return (
              <button
                key={getTaskId(task)}
                type="button"
                onClick={() => onOpenTask(task)}
                className="grid w-full gap-3 px-4 py-3 text-left transition hover:bg-slate-50 md:grid-cols-[minmax(0,1fr)_180px_160px_140px] md:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-slate-900">{task.title}</p>
                  <p className="truncate text-[12px] text-slate-500">{project.name}</p>
                </div>
                <p className="truncate text-[12px] font-semibold text-slate-600">{department?.name || 'Chua gan phong ban'}</p>
                <div className={cn('flex items-center gap-1.5 text-[12px]', isTaskOverdue(task) ? 'font-bold text-red-600' : 'text-slate-500')}>
                  <Clock className="h-3.5 w-3.5" />
                  {task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : '--'}
                </div>
                <Badge variant="outline" className={cn('w-fit text-[11px] font-medium', status.classes)}>{status.label}</Badge>
              </button>
            );
          })}
          {dashboard.upcomingTasks.length === 0 && <EmptyBlock label="Khong co task sap den han." />}
        </div>
      </section>
    </div>
  );
}

function FlatTaskTable({
  tasks,
  users,
  currentUser,
  getProjectForTask,
  getDepartmentForTask,
  onOpenTask,
}: {
  tasks: Task[];
  users: User[];
  currentUser?: User | null;
  getProjectForTask: (task: Task) => Project;
  getDepartmentForTask: (task: Task) => Department | null;
  onOpenTask: (task: Task) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div>
          <h2 className="text-[14px] font-bold text-slate-900">Danh sach cong viec cua toi</h2>
          <p className="mt-0.5 text-[12px] text-slate-500">{tasks.length} task theo bo loc hien tai</p>
        </div>
        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[11px] font-bold text-emerald-700">
          {tasks.filter((task) => task.status === 'done').length}/{tasks.length} done
        </Badge>
      </div>
      <TaskTable
        tasks={tasks}
        users={users}
        currentUser={currentUser}
        getProjectForTask={getProjectForTask}
        getDepartmentForTask={getDepartmentForTask}
        onOpenTask={onOpenTask}
      />
    </div>
  );
}

function TaskGroupTable({
  group,
  expanded,
  users,
  currentUser,
  getProjectForTask,
  getDepartmentForTask,
  onToggle,
  onOpenTask,
}: {
  group: WorkGroup;
  expanded: boolean;
  users: User[];
  currentUser?: User | null;
  getProjectForTask: (task: Task) => Project;
  getDepartmentForTask: (task: Task) => Department | null;
  onToggle: () => void;
  onOpenTask: (task: Task) => void;
}) {
  const done = group.tasks.filter((task) => task.status === 'done').length;
  const percentage = group.tasks.length ? Math.round((done / group.tasks.length) * 100) : 0;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex cursor-pointer items-center gap-3 border-b border-slate-200 bg-white px-4 py-3" onClick={onToggle}>
        <div className="flex h-5 w-5 items-center justify-center text-slate-400">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: group.color }} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {group.href ? (
              <Link to={group.href} onClick={(event) => event.stopPropagation()} className="truncate text-[14px] font-bold text-slate-900 hover:text-emerald-600">
                {group.name}
              </Link>
            ) : (
              <h2 className="truncate text-[14px] font-bold text-slate-900">{group.name}</h2>
            )}
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-500">{group.tasks.length}</span>
          </div>
          <p className="mt-0.5 truncate text-[12px] text-slate-500">{group.subtitle}</p>
        </div>
        <div className="hidden w-36 items-center gap-2 sm:flex">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percentage}%` }} />
          </div>
          <span className="w-9 text-right text-[12px] font-extrabold text-slate-800">{percentage}%</span>
        </div>
      </div>

      {expanded && (
        <TaskTable
          tasks={group.tasks}
          users={users}
          currentUser={currentUser}
          getProjectForTask={getProjectForTask}
          getDepartmentForTask={getDepartmentForTask}
          onOpenTask={onOpenTask}
        />
      )}
    </div>
  );
}

function TaskTable({
  tasks,
  users,
  currentUser,
  getProjectForTask,
  getDepartmentForTask,
  onOpenTask,
}: {
  tasks: Task[];
  users: User[];
  currentUser?: User | null;
  getProjectForTask: (task: Task) => Project;
  getDepartmentForTask: (task: Task) => Department | null;
  onOpenTask: (task: Task) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            <th className="w-10 px-4 py-2" />
            <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Ten cong viec</th>
            <th className="w-44 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Du an</th>
            <th className="w-44 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Phong ban</th>
            <th className="w-28 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500 text-center">Nguoi nhan</th>
            <th className="w-32 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Han chot</th>
            <th className="w-36 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500 text-center">Trang thai</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tasks.map((task) => {
            const project = getProjectForTask(task);
            const department = getDepartmentForTask(task);
            const isDone = task.status === 'done';
            const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
            const assignee = users.find((item) => getEntityId(item) === task.assignee_id) || currentUser;

            return (
              <tr key={getTaskId(task)} className="group/row transition hover:bg-slate-50">
                <td className="px-4 py-2.5 align-middle">
                  {isDone ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-slate-300" />}
                </td>
                <td className="px-4 py-2.5 align-middle">
                  <button
                    type="button"
                    onClick={() => onOpenTask(task)}
                    className={cn('text-left text-[13px] font-medium transition-colors hover:text-emerald-600', isDone ? 'text-slate-400 line-through' : 'text-slate-800')}
                  >
                    {task.title}
                  </button>
                </td>
                <td className="px-4 py-2.5 align-middle">
                  <p className="truncate text-[12px] font-semibold text-slate-600">{project.name}</p>
                </td>
                <td className="px-4 py-2.5 align-middle">
                  <p className="truncate text-[12px] text-slate-500">{department?.name || 'Chua gan'}</p>
                </td>
                <td className="px-4 py-2.5 text-center align-middle">
                  <Avatar className="inline-block h-6 w-6">
                    <AvatarImage src={assignee?.avatar} />
                    <AvatarFallback className="bg-emerald-100 text-[9px] font-medium text-emerald-700">
                      {assignee?.full_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </td>
                <td className="px-4 py-2.5 align-middle">
                  <div className={cn('flex items-center gap-1.5 text-[12px]', isDone ? 'text-slate-400' : isTaskOverdue(task) ? 'font-medium text-red-600' : 'text-slate-500')}>
                    <Clock className="h-3.5 w-3.5" />
                    {task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : '--'}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-center align-middle">
                  <Badge variant="outline" className={cn('whitespace-nowrap rounded border px-2 py-0.5 text-[11px] font-medium', status.classes)}>
                    {status.label}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PersonalStat({ icon: Icon, label, value, helper }: { icon: LucideIcon; label: string; value: number | string; helper: string }) {
  return (
    <div className="enterprise-panel p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-emerald-100 bg-emerald-50 text-emerald-700">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-[22px] font-black leading-none tracking-tight text-slate-900">{value}</p>
          <p className="mt-1 truncate text-[11px] font-medium text-slate-500">{helper}</p>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-[12px] font-extrabold uppercase tracking-wide text-slate-800">{title}</h2>
      <p className="mt-1 text-[12px] font-medium text-slate-500">{description}</p>
    </div>
  );
}

function MetricBar({ label, value, percentage, color }: { label: string; value: number; percentage: number; color: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="truncate text-[12px] font-bold text-slate-700">{label}</span>
        <span className="text-[12px] font-extrabold text-slate-900">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full transition-all" style={{ width: `${percentage}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  subtitle,
  percentage,
  color,
  href,
}: {
  label: string;
  subtitle: string;
  percentage: number;
  color: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-slate-900">{label}</p>
          <p className="truncate text-[11px] font-medium text-slate-500">{subtitle}</p>
        </div>
        <span className="text-[12px] font-extrabold text-slate-900">{percentage}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: color }} />
      </div>
    </>
  );

  if (!href) return <div>{content}</div>;
  return <Link to={href} className="block rounded-md transition hover:bg-slate-50">{content}</Link>;
}

function EmptyBlock({ label }: { label: string }) {
  return <div className="flex min-h-28 items-center justify-center text-center text-[13px] font-medium text-slate-400">{label}</div>;
}
