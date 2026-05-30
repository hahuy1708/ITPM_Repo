import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Filter,
  FolderKanban,
  Gauge,
  LayoutGrid,
  List,
  ListChecks,
  Loader2,
  Plus,
  Search,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { departmentService } from '@/features/departments/api/department.api';
import { projectService } from '@/features/projects/api/project.api';
import { taskService } from '@/features/tasks/api/task.api';
import { userService } from '@/features/users/api/user.api';
import KanbanBoard from '@/features/tasks/components/KanbanBoard';
import ListView from '@/features/tasks/components/ListView';
import GanttChart from '@/features/tasks/components/GanttChart';
import CreateTaskModal from '@/features/tasks/components/CreateTaskModal';
import ProjectTaskList from '@/features/tasks/components/ProjectTaskList';
import TaskDetailPanel from '@/features/tasks/components/TaskDetailPanel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Department, Project, Task, TaskGroup, TaskStatus, User } from '@/types';

const PIE_COLORS = ['#94a3b8', '#2563eb', '#d97706', '#dc2626', '#059669'];

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Todo',
  in_progress: 'Dang lam',
  review: 'Cho nghiem thu',
  needs_revision: 'Can sua',
  done: 'Hoan thanh',
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: '#64748b',
  in_progress: '#2563eb',
  review: '#d97706',
  needs_revision: '#dc2626',
  done: '#059669',
};

const getEntityId = (value?: string | { _id?: string; id?: string }) => (
  typeof value === 'string' ? value : value?._id || value?.id || ''
);

const getProjectId = (project: Project) => project._id || project.id || '';
const getTaskId = (task: Task) => task.id || task._id || '';

const deriveTaskGroups = (tasks: Task[]): TaskGroup[] => {
  const map = new Map<string, TaskGroup>();
  tasks.forEach((task) => {
    const key = task.group_key || 'general';
    if (!map.has(key)) map.set(key, { key, name: task.group_name || 'Chung', task_count: 0 });
    const group = map.get(key);
    if (group) group.task_count = (group.task_count || 0) + 1;
  });
  if (!map.has('general')) map.set('general', { key: 'general', name: 'Chung', task_count: 0 });
  return [...map.values()].sort((left, right) => left.name.localeCompare(right.name, 'vi'));
};

const getProjectName = (task: Task, projectMap: Map<string, Project>) => {
  const projectId = getEntityId(task.project_id) || getEntityId(task.project);
  return task.project?.name || projectMap.get(projectId)?.name || 'Khong ro du an';
};

export default function DepartmentDetail() {
  const { id: deptId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token, user } = useAuth();
  const taskIdFromQuery = searchParams.get('task') || '';

  const [department, setDepartment] = useState<Department | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [view, setView] = useState<'overview' | 'kanban' | 'list' | 'gantt' | 'projects' | 'members'>('overview');
  const [taskSearch, setTaskSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedListTask, setSelectedListTask] = useState<Task | null>(null);
  const [createTaskGroupKey, setCreateTaskGroupKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const canCreateTask = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    void loadData();
  }, [token, deptId, user?.role]);

  const loadData = async () => {
    if (!token || !deptId) return;

    try {
      setIsLoading(true);
      setError('');
      const canLoadUsers = user?.role === 'admin' || user?.role === 'manager';
      const [departmentResponse, projectResponse, userResponse] = await Promise.all([
        departmentService.getDepartment(deptId, token),
        projectService.getProjects(token, { department_id: deptId, page: 1, limit: 100 }),
        canLoadUsers ? userService.getUsers(token) : Promise.resolve({ success: true, data: [] as User[] }),
      ]);

      const projectList = projectResponse.data || [];
      const taskEntries = await Promise.all(projectList.map(async (project) => {
        try {
          return await taskService.getProjectTasks(getProjectId(project), token);
        } catch {
          return [];
        }
      }));

      setDepartment(departmentResponse.data || null);
      setProjects(projectList);
      setUsers(userResponse.data || []);
      setTasks(taskEntries.flat());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong tai duoc phong ban');
    } finally {
      setIsLoading(false);
    }
  };

  const projectMap = useMemo(() => (
    new Map(projects.map((project) => [getProjectId(project), project]))
  ), [projects]);

  const taskGroups = useMemo(() => deriveTaskGroups(tasks), [tasks]);

  const deptData = useMemo(() => {
    if (!department) return null;

    const memberMap = new Map<string, User>();
    const addUser = (candidate?: User | null) => {
      const id = candidate ? getEntityId(candidate) : '';
      if (candidate && id && !memberMap.has(id)) memberMap.set(id, candidate);
    };

    (department.member_ids || []).forEach((member) => {
      if (typeof member === 'object') addUser(member);
    });
    if (typeof department.manager_id === 'object') addUser(department.manager_id);
    users.forEach((item) => {
      if (getEntityId(item.department_id) === deptId) addUser(item);
      if ((department.member_ids || []).some((member) => getEntityId(member) === getEntityId(item))) addUser(item);
    });
    tasks.forEach((task) => addUser(task.assignee));

    const members = [...memberMap.values()];
    const manager = typeof department.manager_id === 'object'
      ? department.manager_id
      : users.find((item) => getEntityId(item) === department.manager_id) || null;

    const totalTasks = tasks.length;
    const doneTasks = tasks.filter((task) => task.status === 'done').length;
    const inProgressTasks = tasks.filter((task) => task.status === 'in_progress').length;
    const reviewTasks = tasks.filter((task) => task.status === 'review').length;
    const overdueTasks = tasks.filter((task) => task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done').length;
    const unassignedTasks = tasks.filter((task) => !task.assignee_id).length;
    const kpiProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    const activeProjects = projects.filter((project) => project.status === 'active').length;
    const statusChartData = (Object.keys(STATUS_LABELS) as TaskStatus[]).map((status) => ({
      key: status,
      name: STATUS_LABELS[status],
      value: tasks.filter((task) => task.status === status).length,
      color: STATUS_COLORS[status],
    }));

    const employeeRows = members
      .map((member) => {
        const memberId = getEntityId(member);
        const assignedTasks = tasks.filter((task) => getEntityId(task.assignee_id) === memberId);
        const done = assignedTasks.filter((task) => task.status === 'done').length;
        const overdue = assignedTasks.filter((task) => task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done').length;
        return {
          member,
          memberId,
          total: assignedTasks.length,
          done,
          inProgress: assignedTasks.filter((task) => task.status === 'in_progress').length,
          review: assignedTasks.filter((task) => task.status === 'review').length,
          overdue,
          percentage: assignedTasks.length ? Math.round((done / assignedTasks.length) * 100) : 0,
        };
      })
      .sort((left, right) => right.total - left.total || right.percentage - left.percentage);

    const projectRows = projects.map((project) => {
      const projectTasks = tasks.filter((task) => getEntityId(task.project_id) === getProjectId(project));
      const done = projectTasks.filter((task) => task.status === 'done').length;
      return {
        project,
        total: projectTasks.length,
        done,
        percentage: projectTasks.length ? Math.round((done / projectTasks.length) * 100) : project.progress || 0,
      };
    });

    return {
      manager,
      members,
      employeeRows,
      projectRows,
      statusChartData,
      stats: {
        activeProjects,
        doneTasks,
        inProgressTasks,
        kpiProgress,
        overdueTasks,
        reviewTasks,
        totalTasks,
        unassignedTasks,
      },
    };
  }, [department, users, tasks, projects, deptId]);

  const assigneeOptions = useMemo(() => {
    const map = new Map<string, User>();
    const addUser = (candidate?: User | null) => {
      const id = candidate ? getEntityId(candidate) : '';
      if (candidate && id && !map.has(id)) map.set(id, candidate);
    };
    deptData?.members.forEach(addUser);
    tasks.forEach((task) => addUser(task.assignee));
    return [...map.values()].sort((left, right) => left.full_name.localeCompare(right.full_name, 'vi'));
  }, [deptData, tasks]);

  const filteredTasks = useMemo(() => {
    const keyword = taskSearch.trim().toLowerCase();
    return tasks.filter((task) => {
      const assigneeId = getEntityId(task.assignee_id);
      const projectName = getProjectName(task, projectMap).toLowerCase();
      const matchesKeyword = !keyword
        || task.title.toLowerCase().includes(keyword)
        || (task.description || '').toLowerCase().includes(keyword)
        || (task.content_html || '').toLowerCase().includes(keyword)
        || projectName.includes(keyword);
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesAssignee = assigneeFilter === 'all' || assigneeId === assigneeFilter;
      return matchesKeyword && matchesStatus && matchesAssignee;
    });
  }, [tasks, taskSearch, statusFilter, assigneeFilter, projectMap]);

  const clearTaskQuery = () => {
    if (!taskIdFromQuery) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('task');
    setSearchParams(nextParams, { replace: true });
  };

  const openCreateTask = (groupKey = '') => {
    setCreateTaskGroupKey(groupKey);
    setShowCreateTask(true);
  };

  const handleTaskUpdated = (updated: Task) => {
    const updatedId = getTaskId(updated);
    setTasks((current) => current.map((task) => (getTaskId(task) === updatedId ? updated : task)));
  };

  const workspaceView = view === 'kanban' || view === 'list' || view === 'gantt';

  if (isLoading) {
    return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      </div>
    );
  }

  if (!department || !deptData) {
    return <div className="p-10 text-center text-sm text-slate-500">Khong tim thay phong ban.</div>;
  }

  return (
    <div className="flex h-[calc(100vh-101px)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex-shrink-0 bg-white">
        <div className="px-5 pt-4">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <Link to="/departments" className="mt-1 rounded-md border border-slate-200 p-2 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: department.color || '#2563EB' }}>
                <span className="text-lg font-bold text-white">{department.name[0]}</span>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-[18px] font-semibold leading-tight text-slate-900">{department.name}</h1>
                  <Badge variant="outline" className="h-5 border-emerald-200 bg-emerald-50 px-2 py-0 text-[11px] font-medium text-emerald-700">
                    {department.code || 'Phong ban'}
                  </Badge>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[12px] text-slate-500">
                  {deptData.manager && <span>Manager: <span className="font-medium text-slate-700">{deptData.manager.full_name}</span></span>}
                  <span>{projects.length} du an</span>
                  <span>{deptData.members.length} thanh vien</span>
                  {department.description && <span className="max-w-xl truncate">{department.description}</span>}
                </div>
              </div>
            </div>

            {canCreateTask && (
              <Button size="sm" onClick={() => openCreateTask()} className="h-8 gap-1.5 bg-emerald-600 text-[13px] font-medium text-white shadow-none hover:bg-emerald-700">
                <Plus className="h-3.5 w-3.5" />
                Giao viec moi
              </Button>
            )}
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <HeaderStat icon={FolderKanban} label="Du an" value={`${projects.length}`} helper={`${deptData.stats.activeProjects} dang chay`} />
            <HeaderStat icon={Users} label="Nhan su" value={`${deptData.members.length}`} helper="thanh vien phong ban" />
            <HeaderStat icon={ListChecks} label="Cong viec" value={`${deptData.stats.totalTasks}`} helper={`${filteredTasks.length} dang xem`} />
            <HeaderStat icon={CheckCircle2} label="Hoan thanh" value={`${deptData.stats.kpiProgress}%`} helper={`${deptData.stats.doneTasks}/${deptData.stats.totalTasks} task`} />
            <HeaderStat icon={Clock3} label="Dang lam" value={`${deptData.stats.inProgressTasks}`} helper={`${deptData.stats.reviewTasks} cho duyet`} />
            <HeaderStat icon={AlertTriangle} label="Can chu y" value={`${deptData.stats.overdueTasks}`} helper={`${deptData.stats.unassignedTasks} chua giao`} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-5">
          <div className="flex gap-6 overflow-x-auto">
            {[
              { id: 'overview', icon: Gauge, label: 'Tong quan' },
              { id: 'kanban', icon: LayoutGrid, label: 'Kanban Board' },
              { id: 'list', icon: List, label: 'Danh sach' },
              { id: 'gantt', icon: BarChart3, label: 'Timeline Gantt' },
              { id: 'projects', icon: FolderKanban, label: 'Du an' },
              { id: 'members', icon: Users, label: 'Thanh vien' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id as typeof view)}
                className={cn(
                  'relative flex items-center gap-1.5 whitespace-nowrap pb-2.5 text-[13px] font-medium transition-colors',
                  view === tab.id ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900'
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {view === tab.id && <div className="absolute bottom-0 left-0 h-[2px] w-full bg-emerald-600" />}
              </button>
            ))}
          </div>
          <div className="hidden items-center gap-2 text-[11px] font-semibold text-slate-500 lg:flex">
            <Filter className="h-3.5 w-3.5" />
            {filteredTasks.length}/{tasks.length} task hien thi
          </div>
        </div>

        {workspaceView && (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
            <div className="relative min-w-[240px] max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={taskSearch}
                onChange={(event) => setTaskSearch(event.target.value)}
                placeholder="Tim cong viec hoac du an..."
                className="h-8 rounded-md border-slate-200 bg-white pl-8 text-[12px] font-medium shadow-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as TaskStatus | 'all')}
              className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-[12px] font-semibold text-slate-600 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="all">Tat ca trang thai</option>
              {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((status) => (
                <option key={status} value={status}>{STATUS_LABELS[status]}</option>
              ))}
            </select>
            <select
              value={assigneeFilter}
              onChange={(event) => setAssigneeFilter(event.target.value)}
              className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-[12px] font-semibold text-slate-600 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="all">Tat ca phu trach</option>
              {assigneeOptions.map((member) => (
                <option key={getEntityId(member)} value={getEntityId(member)}>
                  {member.full_name || member.email}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden bg-[#f3f4f6]">
        <div className="h-full min-h-[480px] p-4">
          {view === 'overview' && (
            <div className="h-full overflow-auto">
              <div className="grid gap-4 xl:grid-cols-12">
                <section className="enterprise-panel p-4 xl:col-span-4">
                  <OverviewHeader title="Trang thai cong viec" description="Phan bo task cua cac du an trong phong ban." />
                  <div className="mt-4 h-[230px]">
                    {tasks.length === 0 ? (
                      <EmptyState label="Chua co du lieu task." />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <PieChart>
                          <Pie data={deptData.statusChartData} cx="50%" cy="50%" innerRadius={56} outerRadius={82} paddingAngle={3} dataKey="value" strokeWidth={0}>
                            {deptData.statusChartData.map((entry, index) => (
                              <Cell key={entry.key} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {deptData.statusChartData.map((item) => (
                      <div key={item.key} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                        <span className="flex min-w-0 items-center gap-2 text-[12px] font-semibold text-slate-600">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="truncate">{item.name}</span>
                        </span>
                        <span className="text-[12px] font-extrabold text-slate-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="enterprise-panel p-4 xl:col-span-5">
                  <OverviewHeader title="Tien do nhan vien" description="Theo doi task, hoan thanh, review va tre han theo tung nguoi." />
                  <div className="mt-4 divide-y divide-slate-100">
                    {deptData.employeeRows.slice(0, 8).map((row) => (
                      <EmployeeProgressRow key={row.memberId} row={row} />
                    ))}
                    {deptData.employeeRows.length === 0 && <EmptyState label="Chua co thanh vien hoac task duoc giao." />}
                  </div>
                </section>

                <section className="enterprise-panel p-4 xl:col-span-3">
                  <OverviewHeader title="Tin hieu dieu hanh" description="Nhung con so can xem nhanh trong ngay." />
                  <div className="mt-4 grid gap-3">
                    <MiniStat icon={FolderKanban} label="Du an dang chay" value={deptData.stats.activeProjects} />
                    <MiniStat icon={Clock3} label="Cho nghiem thu" value={deptData.stats.reviewTasks} />
                    <MiniStat icon={AlertTriangle} label="Tre han" value={deptData.stats.overdueTasks} />
                    <MiniStat icon={CalendarDays} label="Chua phan cong" value={deptData.stats.unassignedTasks} />
                  </div>
                </section>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-12">
                <section className="enterprise-panel p-4 xl:col-span-7">
                  <OverviewHeader title="Tien do du an truc thuoc" description="Moi du an van co workspace rieng, phong ban gom lai de dieu phoi." />
                  <div className="mt-4 space-y-4">
                    {deptData.projectRows.map((row) => (
                      <ProjectProgressRow key={getProjectId(row.project)} row={row} />
                    ))}
                    {deptData.projectRows.length === 0 && <EmptyState label="Chua co du an trong phong ban." />}
                  </div>
                </section>

                <section className="enterprise-panel p-4 xl:col-span-5">
                  <OverviewHeader title="Thong tin phong ban" description="Nguoi phu trach, quy mo va mo ta hien tai." />
                  <div className="mt-4 grid gap-3">
                    <InfoRow label="Manager" value={deptData.manager?.full_name || 'Chua gan'} />
                    <InfoRow label="Ma phong ban" value={department.code || 'Chua dat'} />
                    <InfoRow label="Thanh vien" value={`${deptData.members.length} nguoi`} />
                    <InfoRow label="Du an" value={`${projects.length} workspace`} />
                    <InfoRow label="Mo ta" value={department.description || 'Chua co mo ta'} />
                  </div>
                </section>
              </div>
            </div>
          )}

          {view === 'kanban' && (
            <KanbanBoard
              projectId={deptId}
              tasks={filteredTasks}
              taskGroups={taskGroups}
              users={assigneeOptions}
              onTaskUpdated={handleTaskUpdated}
              initialTaskId={taskIdFromQuery}
              onTaskDetailClose={clearTaskQuery}
              onCreateTask={canCreateTask ? openCreateTask : undefined}
            />
          )}
          {view === 'list' && (
            <ProjectTaskList
              title={department.name}
              department={department}
              tasks={filteredTasks}
              taskGroups={taskGroups}
              users={assigneeOptions}
              canCreateTask={canCreateTask}
              onCreateTask={openCreateTask}
              onOpenTask={setSelectedListTask}
            />
          )}
          {view === 'gantt' && <GanttChart projectId={deptId} tasks={filteredTasks} users={assigneeOptions} onTaskUpdated={handleTaskUpdated} />}

          {view === 'projects' && (
            <div className="h-full overflow-auto">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {deptData.projectRows.map((row) => (
                  <Link key={getProjectId(row.project)} to={`/projects/${getProjectId(row.project)}`} className="enterprise-panel block p-4 transition hover:border-emerald-300">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: `${row.project.color || '#2563EB'}20` }}>
                        <FolderKanban className="h-4 w-4" style={{ color: row.project.color || '#2563EB' }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-[14px] font-bold text-slate-900">{row.project.name}</h4>
                        <p className="text-[11px] font-semibold uppercase text-slate-400">{row.project.status}</p>
                      </div>
                      <Badge variant="outline" className="text-[11px]">{row.percentage}%</Badge>
                    </div>
                    <p className="line-clamp-2 text-[12px] text-slate-500">{row.project.description || 'Khong co mo ta.'}</p>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${row.percentage}%`, backgroundColor: row.project.color || '#10b981' }} />
                    </div>
                    <p className="mt-2 text-[11px] font-medium text-slate-500">{row.done}/{row.total} cong viec hoan thanh</p>
                  </Link>
                ))}
              </div>
              {projects.length === 0 && <EmptyState label="Chua co du an trong phong ban." />}
            </div>
          )}

          {view === 'members' && (
            <div className="h-full overflow-auto">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="grid gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-wide text-slate-500 md:grid-cols-[minmax(0,1fr)_120px_120px_180px]">
                  <div>Nhan su</div>
                  <div>Vai tro</div>
                  <div>Task</div>
                  <div>Tien do</div>
                </div>
                <div className="divide-y divide-slate-100">
                  {deptData.employeeRows.map((row) => (
                    <div key={row.memberId} className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_120px_120px_180px] md:items-center">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={row.member.avatar} />
                          <AvatarFallback className="text-[10px] font-bold">{row.member.full_name?.[0] || row.member.email?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold text-slate-900">{row.member.full_name}</p>
                          <p className="truncate text-[12px] text-slate-500">{row.member.email}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="w-fit text-xs capitalize">{row.member.role}</Badge>
                      <p className="text-[12px] font-semibold text-slate-600">{row.done}/{row.total} done</p>
                      <div className="flex items-center gap-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${row.percentage}%` }} />
                        </div>
                        <span className="w-10 text-right text-[12px] font-extrabold text-slate-900">{row.percentage}%</span>
                      </div>
                    </div>
                  ))}
                  {deptData.employeeRows.length === 0 && <EmptyState label="Chua co thanh vien." />}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateTaskModal
        open={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        defaultProjectId={projects.length === 1 ? getProjectId(projects[0]) : undefined}
        defaultGroupKey={createTaskGroupKey || undefined}
        taskGroups={projects.length === 1 ? taskGroups : undefined}
        onCreated={loadData}
      />
      <TaskDetailPanel
        task={selectedListTask}
        open={Boolean(selectedListTask)}
        onClose={() => setSelectedListTask(null)}
        projectId={selectedListTask ? getEntityId(selectedListTask.project_id) : deptId}
        users={assigneeOptions}
        onUpdate={(updatedTask) => {
          handleTaskUpdated(updatedTask);
          setSelectedListTask(updatedTask);
        }}
      />
    </div>
  );
}

function HeaderStat({ icon: Icon, label, value, helper }: { icon: LucideIcon; label: string; value: string; helper: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">{label}</p>
        <Icon className="h-3.5 w-3.5 text-slate-400" />
      </div>
      <p className="mt-1 text-[16px] font-black text-slate-900">{value}</p>
      <p className="truncate text-[11px] font-medium text-slate-500">{helper}</p>
    </div>
  );
}

function OverviewHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-[12px] font-extrabold uppercase tracking-wide text-slate-800">{title}</h2>
      <p className="mt-1 text-[12px] font-medium text-slate-500">{description}</p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="flex min-h-32 items-center justify-center text-center text-[13px] font-medium text-slate-400">{label}</div>;
}

function MiniStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
        <span className="truncate text-[12px] font-bold text-slate-600">{label}</span>
      </div>
      <span className="text-[13px] font-extrabold text-slate-900">{value}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">{label}</span>
      <span className="min-w-0 truncate text-right text-[13px] font-bold text-slate-800">{value}</span>
    </div>
  );
}

function EmployeeProgressRow({
  row,
}: {
  row: { member: User; total: number; done: number; inProgress: number; review: number; overdue: number; percentage: number };
}) {
  return (
    <div className="grid gap-3 py-3 md:grid-cols-[minmax(0,1fr)_96px_150px] md:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="h-8 w-8 border border-slate-200">
          <AvatarImage src={row.member.avatar} />
          <AvatarFallback className="bg-slate-100 text-[10px] font-bold text-slate-600">
            {row.member.full_name?.[0] || row.member.email?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-slate-900">{row.member.full_name || row.member.email}</p>
          <p className="truncate text-[11px] text-slate-500">
            {row.done}/{row.total} done
            {row.overdue > 0 ? ` - ${row.overdue} tre han` : ''}
          </p>
        </div>
      </div>
      <p className="text-[12px] font-semibold text-slate-600">{row.inProgress} lam / {row.review} duyet</p>
      <div className="flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${row.percentage}%` }} />
        </div>
        <span className="w-9 text-right text-[12px] font-extrabold text-slate-900">{row.percentage}%</span>
      </div>
    </div>
  );
}

function ProjectProgressRow({ row }: { row: { project: Project; total: number; done: number; percentage: number } }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-slate-900">{row.project.name}</p>
          <p className="text-[11px] font-semibold uppercase text-slate-400">{row.project.status}</p>
        </div>
        <span className="text-[12px] font-extrabold text-slate-900">{row.percentage}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${row.percentage}%`, backgroundColor: row.project.color || '#10b981' }} />
      </div>
      <p className="mt-1 text-[11px] font-medium text-slate-500">{row.done}/{row.total} cong viec hoan thanh</p>
    </div>
  );
}
