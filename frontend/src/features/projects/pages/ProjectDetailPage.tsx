import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, AlertTriangle, BarChart3, CalendarDays, CheckCircle2, Clock3, Filter, FolderPlus, Gauge, LayoutGrid, List, Loader2, Plus, Search, Settings, Trash2, UserPlus, Users, type LucideIcon } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Department, Project, ProjectStatus, Task, TaskGroup, TaskStatus, User } from '@/types';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; classes: string }> = {
  planning: { label: 'Lap ke hoach', classes: 'bg-slate-100 text-slate-600 border-slate-200' },
  active: { label: 'Dang chay', classes: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  completed: { label: 'Hoan thanh', classes: 'bg-blue-50 text-blue-600 border-blue-200' },
  on_hold: { label: 'Tam dung', classes: 'bg-amber-50 text-amber-600 border-amber-200' },
};

const TASK_STATUS_META: Record<TaskStatus, { label: string; color: string; soft: string }> = {
  todo: { label: 'Todo', color: '#64748b', soft: 'bg-slate-100 text-slate-600' },
  in_progress: { label: 'Dang lam', color: '#2563eb', soft: 'bg-blue-50 text-blue-700' },
  review: { label: 'Cho nghiem thu', color: '#d97706', soft: 'bg-amber-50 text-amber-700' },
  needs_revision: { label: 'Can sua', color: '#dc2626', soft: 'bg-red-50 text-red-700' },
  done: { label: 'Hoan thanh', color: '#059669', soft: 'bg-emerald-50 text-emerald-700' },
};

const PRIORITY_META: Record<Task['priority'], { label: string; color: string }> = {
  low: { label: 'Thap', color: '#64748b' },
  medium: { label: 'Trung binh', color: '#2563eb' },
  high: { label: 'Cao', color: '#d97706' },
  urgent: { label: 'Khan cap', color: '#dc2626' },
};

const getEntityId = (value?: string | { _id?: string; id?: string }) =>
  typeof value === 'string' ? value : value?._id || value?.id || '';

const getProjectId = (project: Project) => project._id || project.id;

const getProjectMembers = (project: Project | null, users: User[]) => {
  if (!project) return [];
  const userMap = new Map(users.map((user) => [getEntityId(user), user]));
  return (project.member_ids || [])
    .map((member) => (typeof member === 'string' ? userMap.get(member) : member))
    .filter((member): member is User => Boolean(member));
};

const getProjectOwner = (project: Project | null, users: User[]) => {
  if (!project) return null;
  if (typeof project.owner_id === 'object') return project.owner_id;
  return users.find((user) => getEntityId(user) === project.owner_id) || null;
};

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

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token, user } = useAuth();
  const projectId = id || '';
  const taskIdFromQuery = searchParams.get('task') || '';

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [view, setView] = useState<'overview' | 'kanban' | 'list' | 'gantt'>('overview');
  const [taskSearch, setTaskSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Task['status']>('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedListTask, setSelectedListTask] = useState<Task | null>(null);
  const [createTaskGroupKey, setCreateTaskGroupKey] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [isSavingMembers, setIsSavingMembers] = useState(false);
  const canManageProject = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    void loadData();
  }, [token, projectId, user?.role]);

  useEffect(() => {
    const owner = getProjectOwner(project, users);
    setSelectedOwnerId(owner ? getEntityId(owner) : '');
  }, [project, users]);

  const loadData = async () => {
    if (!token || !projectId) return;

    try {
      setIsLoading(true);
      setError('');
      const canLoadUsers = user?.role === 'admin' || user?.role === 'manager';
      let taskAccessMessage = '';
      const [projectResponse, projectTasks, userResponse, departmentResponse, groupResponse] = await Promise.all([
        projectService.getProject(projectId, token),
        taskService.getProjectTasks(projectId, token).catch((err) => {
          taskAccessMessage = err instanceof Error ? err.message : 'No task access';
          return [];
        }),
        canLoadUsers ? userService.getUsers(token) : Promise.resolve({ success: true, data: [] }),
        departmentService.getDepartments(token),
        projectService.getTaskGroups(projectId, token).catch(() => ({ success: true, data: [] as TaskGroup[] })),
      ]);

      setProject(projectResponse.data || null);
      setTasks(projectTasks);
      setTaskGroups(groupResponse.data?.length ? groupResponse.data : deriveTaskGroups(projectTasks));
      if (userResponse.data?.length) {
        setUsers(userResponse.data);
      } else {
        const projectUsers = getProjectMembers(projectResponse.data || null, []);
        const owner = getProjectOwner(projectResponse.data || null, projectUsers);
        setUsers(owner && !projectUsers.some((item) => getEntityId(item) === getEntityId(owner))
          ? [owner, ...projectUsers]
          : projectUsers);
      }
      setDepartments(departmentResponse.data || []);
      if (taskAccessMessage) setError(taskAccessMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setIsLoading(false);
    }
  };

  const memberUsers = useMemo(() => getProjectMembers(project, users), [project, users]);
  const owner = useMemo(() => getProjectOwner(project, users), [project, users]);
  const ownerId = owner ? getEntityId(owner) : '';
  const memberIdSet = useMemo(() => new Set(memberUsers.map((member) => getEntityId(member))), [memberUsers]);
  const currentUserId = user?._id || user?.id || '';
  const isCurrentProjectMember = Boolean(currentUserId && (ownerId === currentUserId || memberIdSet.has(currentUserId)));
  const canCreateTask = user?.role === 'manager' || user?.role === 'admin';

  const department = useMemo(() => {
    if (!project?.department_id) return null;
    if (typeof project.department_id === 'object') return project.department_id;
    return departments.find((item) => getEntityId(item) === project.department_id) || null;
  }, [project, departments]);

  const availableUsers = useMemo(() => {
    const keyword = memberSearch.trim().toLowerCase();
    return users.filter((user) => {
      const userId = getEntityId(user);
      const matches = !keyword
        || user.full_name.toLowerCase().includes(keyword)
        || user.email.toLowerCase().includes(keyword);
      return matches && !memberIdSet.has(userId);
    });
  }, [users, memberSearch, memberIdSet]);

  const stats = useMemo(() => {
    const done = tasks.filter((task) => task.status === 'done').length;
    const total = tasks.length;
    const percentage = total > 0 ? Math.round((done / total) * 100) : project?.progress || 0;
    return { done, total, percentage };
  }, [tasks, project]);

  const dashboardData = useMemo(() => {
    const now = new Date();
    const userMap = new Map<string, User>();
    const addUser = (candidate?: User | null) => {
      const id = candidate ? getEntityId(candidate) : '';
      if (candidate && id && !userMap.has(id)) userMap.set(id, candidate);
    };

    users.forEach(addUser);
    memberUsers.forEach(addUser);
    addUser(owner);
    tasks.forEach((task) => addUser(task.assignee));

    const statusRows = (Object.keys(TASK_STATUS_META) as TaskStatus[]).map((status) => {
      const count = tasks.filter((task) => task.status === status).length;
      return {
        status,
        count,
        percentage: tasks.length ? Math.round((count / tasks.length) * 100) : 0,
        ...TASK_STATUS_META[status],
      };
    });

    const priorityRows = (Object.keys(PRIORITY_META) as Task['priority'][]).map((priority) => {
      const count = tasks.filter((task) => task.priority === priority).length;
      return {
        priority,
        count,
        percentage: tasks.length ? Math.round((count / tasks.length) * 100) : 0,
        ...PRIORITY_META[priority],
      };
    });

    const groupRows = taskGroups.map((group) => {
      const groupTasks = tasks.filter((task) => (task.group_key || 'general') === group.key);
      const done = groupTasks.filter((task) => task.status === 'done').length;
      return {
        ...group,
        total: groupTasks.length,
        done,
        percentage: groupTasks.length ? Math.round((done / groupTasks.length) * 100) : 0,
      };
    });

    const employeeRows = [...userMap.values()]
      .map((employee) => {
        const employeeId = getEntityId(employee);
        const assignedTasks = tasks.filter((task) => getEntityId(task.assignee_id) === employeeId);
        const done = assignedTasks.filter((task) => task.status === 'done').length;
        const inProgress = assignedTasks.filter((task) => task.status === 'in_progress').length;
        const overdue = assignedTasks.filter((task) => task.due_date && new Date(task.due_date) < now && task.status !== 'done').length;
        return {
          employee,
          employeeId,
          total: assignedTasks.length,
          done,
          inProgress,
          overdue,
          percentage: assignedTasks.length ? Math.round((done / assignedTasks.length) * 100) : 0,
        };
      })
      .filter((row) => row.total > 0 || memberIdSet.has(row.employeeId) || row.employeeId === ownerId)
      .sort((left, right) => right.total - left.total || right.percentage - left.percentage);

    return {
      statusRows,
      priorityRows,
      groupRows,
      employeeRows,
      overdueTasks: tasks.filter((task) => task.due_date && new Date(task.due_date) < now && task.status !== 'done').length,
      reviewTasks: tasks.filter((task) => task.status === 'review').length,
      unassignedTasks: tasks.filter((task) => !task.assignee_id).length,
    };
  }, [tasks, users, memberUsers, owner, taskGroups, memberIdSet, ownerId]);

  const filteredTasks = useMemo(() => {
    const keyword = taskSearch.trim().toLowerCase();
    return tasks.filter((task) => {
      const assigneeId = getEntityId(task.assignee_id);
      const matchesKeyword = !keyword
        || task.title.toLowerCase().includes(keyword)
        || (task.description || '').toLowerCase().includes(keyword)
        || (task.content_html || '').toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesAssignee = assigneeFilter === 'all' || assigneeId === assigneeFilter;
      return matchesKeyword && matchesStatus && matchesAssignee;
    });
  }, [tasks, taskSearch, statusFilter, assigneeFilter]);

  const blockingTaskCount = (userId: string) => tasks.filter((task) => (
    getEntityId(task.assignee_id) === userId && task.status === 'in_progress'
  )).length;

  const handleAddMembers = async () => {
    if (!token || !project || selectedUserIds.length === 0) return;

    try {
      setIsSavingMembers(true);
      setError('');
      const response = await projectService.addMembers(getProjectId(project), selectedUserIds, token);
      if (response.data) setProject(response.data);
      setSelectedUserIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add members');
    } finally {
      setIsSavingMembers(false);
    }
  };

  const handleRemoveMember = async (user: User) => {
    if (!token || !project) return;
    const userId = getEntityId(user);
    const blocking = blockingTaskCount(userId);

    if (blocking > 0) {
      setError(`${user.full_name} dang giu ${blocking} task In Progress, khong the go khoi du an.`);
      return;
    }

    try {
      setError('');
      const response = await projectService.removeMember(project, userId, token);
      if (response.data) setProject(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const handleOwnerChange = async (nextOwnerId: string) => {
    if (!token || !project || !nextOwnerId) return;

    try {
      setSelectedOwnerId(nextOwnerId);
      const response = await projectService.updateOwner(getProjectId(project), nextOwnerId, token);
      if (response.data) setProject(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update owner');
      setSelectedOwnerId(ownerId);
    }
  };

  const openCreateTask = (groupKey = '') => {
    setCreateTaskGroupKey(groupKey);
    setShowCreateTask(true);
  };

  const handleCreateGroup = async () => {
    if (!token || !projectId || !newGroupName.trim()) return;

    try {
      setIsSavingGroup(true);
      setError('');
      const response = await projectService.createTaskGroup(projectId, { name: newGroupName.trim() }, token);
      setTaskGroups(response.data || []);
      setNewGroupName('');
      setShowCreateGroup(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task group');
    } finally {
      setIsSavingGroup(false);
    }
  };

  const handleTaskUpdated = (updated: Task) => {
    setTasks((current) => current.map((task) => task.id === updated.id ? updated : task));
  };

  const toggleSelectedUser = (userId: string, checked: boolean) => {
    setSelectedUserIds((current) => (
      checked ? [...new Set([...current, userId])] : current.filter((id) => id !== userId)
    ));
  };

  const clearTaskQuery = () => {
    if (!taskIdFromQuery) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('task');
    setSearchParams(nextParams, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-500 font-medium">Khong tim thay du an.</p>
        <Link to="/projects" className="text-emerald-600 text-[13px] mt-4 font-semibold hover:underline">
          Quay lai danh sach
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning;

  return (
    <div className="flex h-[calc(100vh-101px)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex-shrink-0 bg-white">
        <div className="px-5 pt-4">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-md flex items-center justify-center mt-0.5 shrink-0" style={{ backgroundColor: project.color || '#2563EB' }}>
              <span className="text-lg font-bold text-white">{project.name[0]}</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link to="/projects" className="text-[13px] text-slate-400 hover:text-emerald-600 transition-colors">Du an</Link>
                <span className="text-slate-300">/</span>
                <h1 className="text-[18px] font-semibold text-slate-900 leading-tight truncate">{project.name}</h1>
                <Badge variant="outline" className={cn('text-[11px] font-medium px-2 py-0 h-5 border', statusCfg.classes)}>
                  {statusCfg.label}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[12px] text-slate-500">
                {department && <span>Phong ban: <span className="font-medium text-slate-700">{department.name}</span></span>}
                {owner && <span>Owner: <span className="font-medium text-slate-700">{owner.full_name}</span></span>}
                {project.description && <span className="truncate max-w-md">{project.description}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
              <div className="flex -space-x-1.5">
                {memberUsers.slice(0, 4).map((member) => (
                  <Avatar key={getEntityId(member)} className="h-7 w-7 border-2 border-white">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600 font-medium">
                      {member.full_name?.[0] || member.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {memberUsers.length > 4 && (
                  <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white text-[10px] font-medium text-slate-600 z-10">
                    +{memberUsers.length - 4}
                  </div>
                )}
              </div>
              {canManageProject && (
                <Button variant="ghost" size="icon" onClick={() => setShowMembers(true)} className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-200 text-slate-500">
                  <UserPlus className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

            {canManageProject && (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowMembers(true)} className="h-8 text-[13px] font-medium border-slate-300 text-slate-700">
                  <Settings className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  Thanh vien
                </Button>
                {canCreateTask && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setShowCreateGroup(true)} className="h-8 text-[13px] font-medium border-slate-300 text-slate-700">
                      <FolderPlus className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                      Nhom cong viec
                    </Button>
                    <Button size="sm" onClick={() => openCreateTask()} className="h-8 text-[13px] font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-none">
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Giao viec moi
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Tien do</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full transition-all duration-1000 ease-in-out" style={{ width: `${stats.percentage}%`, backgroundColor: project.color || '#10b981' }} />
              </div>
              <span className="text-[12px] font-extrabold text-slate-800">{stats.percentage}%</span>
            </div>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Hoan thanh</p>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] font-bold text-slate-800">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              {stats.done}/{stats.total} cong viec
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Nhan su</p>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] font-bold text-slate-800">
              <Users className="h-3.5 w-3.5 text-indigo-500" />
              {dashboardData.employeeRows.length || memberUsers.length} nguoi
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Dang xem</p>
            <p className="mt-1 text-[13px] font-bold text-slate-800">{filteredTasks.length} task</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Can chu y</p>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] font-bold text-slate-800">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              {dashboardData.overdueTasks} tre han
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Deadline</p>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] font-bold text-slate-800">
              <CalendarDays className="h-3.5 w-3.5 text-blue-500" />
              {project.end_date ? new Date(project.end_date).toLocaleDateString('vi-VN') : 'Chua dat'}
            </p>
          </div>
        </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-5">
          <div className="flex gap-6">
          {[
            { id: 'overview', icon: Gauge, label: 'Tong quan' },
            { id: 'kanban', icon: LayoutGrid, label: 'Kanban Board' },
            { id: 'list', icon: List, label: 'Danh sach' },
            { id: 'gantt', icon: BarChart3, label: 'Timeline Gantt' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id as 'overview' | 'kanban' | 'list' | 'gantt')}
              className={cn(
                'pb-2.5 text-[13px] font-medium transition-colors relative flex items-center gap-1.5',
                view === tab.id ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {view === tab.id && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-emerald-600" />}
            </button>
          ))}
          </div>
          <div className="hidden items-center gap-2 text-[11px] font-semibold text-slate-500 lg:flex">
            <Filter className="h-3.5 w-3.5" />
            {filteredTasks.length}/{tasks.length} task hien thi
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={taskSearch}
              onChange={(event) => setTaskSearch(event.target.value)}
              placeholder="Tim cong viec..."
              className="h-8 rounded-md border-slate-200 bg-white pl-8 text-[12px] font-medium shadow-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-[12px] font-semibold text-slate-600 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="all">Tat ca trang thai</option>
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Pending Review</option>
            <option value="needs_revision">Needs Revision</option>
            <option value="done">Done</option>
          </select>
          <select
            value={assigneeFilter}
            onChange={(event) => setAssigneeFilter(event.target.value)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-[12px] font-semibold text-slate-600 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="all">Tat ca phu trach</option>
            {(memberUsers.length ? memberUsers : users).map((member) => (
              <option key={getEntityId(member)} value={getEntityId(member)}>
                {member.full_name || member.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-[#f3f4f6]">
        <div className="h-full min-h-[480px] p-4">
          {view === 'overview' && (
            <div className="h-full overflow-auto">
              <div className="grid gap-4 xl:grid-cols-12">
                <section className="enterprise-panel p-4 xl:col-span-4">
                  <OverviewHeader title="Trang thai cong viec" description="Phan bo task theo tien trinh xu ly." />
                  <div className="mt-4 space-y-3">
                    {dashboardData.statusRows.map((row) => (
                      <MetricBar key={row.status} label={row.label} value={row.count} percentage={row.percentage} color={row.color} />
                    ))}
                  </div>
                </section>

                <section className="enterprise-panel p-4 xl:col-span-5">
                  <OverviewHeader title="Tien do nhan su" description="So task duoc giao, hoan thanh va cac viec can chu y." />
                  <div className="mt-4 divide-y divide-slate-100">
                    {dashboardData.employeeRows.slice(0, 8).map((row) => (
                      <div key={row.employeeId} className="grid gap-3 py-3 md:grid-cols-[minmax(0,1fr)_82px_140px] md:items-center">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="h-8 w-8 border border-slate-200">
                            <AvatarImage src={row.employee.avatar} />
                            <AvatarFallback className="bg-slate-100 text-[10px] font-bold text-slate-600">
                              {row.employee.full_name?.[0] || row.employee.email?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-bold text-slate-900">{row.employee.full_name || row.employee.email}</p>
                            <p className="truncate text-[11px] text-slate-500">
                              {row.done}/{row.total} done
                              {row.overdue > 0 ? ` - ${row.overdue} tre han` : ''}
                            </p>
                          </div>
                        </div>
                        <p className="text-[12px] font-semibold text-slate-600">{row.inProgress} dang lam</p>
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${row.percentage}%` }} />
                          </div>
                          <span className="w-9 text-right text-[12px] font-extrabold text-slate-900">{row.percentage}%</span>
                        </div>
                      </div>
                    ))}
                    {dashboardData.employeeRows.length === 0 && (
                      <p className="py-10 text-center text-[13px] text-slate-500">Chua co du lieu nhan su.</p>
                    )}
                  </div>
                </section>

                <section className="enterprise-panel p-4 xl:col-span-3">
                  <OverviewHeader title="Tin hieu nhanh" description="Cac chi so giup ra quyet dinh trong workspace." />
                  <div className="mt-4 grid gap-3">
                    <MiniStat icon={Clock3} label="Cho nghiem thu" value={dashboardData.reviewTasks} />
                    <MiniStat icon={AlertTriangle} label="Chua phan cong" value={dashboardData.unassignedTasks} />
                    <MiniStat icon={Users} label="Thanh vien" value={memberUsers.length} />
                  </div>
                  <div className="mt-5">
                    <p className="mb-3 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Do uu tien</p>
                    <div className="space-y-3">
                      {dashboardData.priorityRows.map((row) => (
                        <MetricBar key={row.priority} label={row.label} value={row.count} percentage={row.percentage} color={row.color} compact />
                      ))}
                    </div>
                  </div>
                </section>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-12">
                <section className="enterprise-panel p-4 xl:col-span-7">
                  <OverviewHeader title="Tien do nhom cong viec" description="Theo doi tung nhom task trong workspace du an." />
                  <div className="mt-4 space-y-4">
                    {dashboardData.groupRows.map((group) => (
                      <div key={group.key}>
                        <div className="mb-1.5 flex items-center justify-between gap-3">
                          <p className="truncate text-[13px] font-bold text-slate-800">{group.name}</p>
                          <span className="text-[12px] font-extrabold text-slate-900">{group.percentage}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${group.percentage}%` }} />
                        </div>
                        <p className="mt-1 text-[11px] font-medium text-slate-500">{group.done}/{group.total} cong viec hoan thanh</p>
                      </div>
                    ))}
                    {dashboardData.groupRows.length === 0 && (
                      <p className="py-10 text-center text-[13px] text-slate-500">Chua co nhom cong viec.</p>
                    )}
                  </div>
                </section>

                <section className="enterprise-panel p-4 xl:col-span-5">
                  <OverviewHeader title="Thong tin workspace" description="Phong ban, owner, moc thoi gian va trang thai hien tai." />
                  <div className="mt-4 grid gap-3">
                    <InfoRow label="Phong ban" value={department?.name || 'Chua gan'} />
                    <InfoRow label="Owner" value={owner?.full_name || 'Chua gan'} />
                    <InfoRow label="Trang thai" value={statusCfg.label} />
                    <InfoRow label="Ngay bat dau" value={project.start_date ? new Date(project.start_date).toLocaleDateString('vi-VN') : 'Chua dat'} />
                    <InfoRow label="Deadline" value={project.end_date ? new Date(project.end_date).toLocaleDateString('vi-VN') : 'Chua dat'} />
                  </div>
                </section>
              </div>
            </div>
          )}
          {view === 'kanban' && (
            <KanbanBoard
              projectId={projectId}
              tasks={filteredTasks}
              taskGroups={taskGroups}
              users={users}
              onTaskUpdated={handleTaskUpdated}
              initialTaskId={taskIdFromQuery}
              onTaskDetailClose={clearTaskQuery}
              onCreateTask={openCreateTask}
              persistGroupOrder
              onTaskGroupsReordered={setTaskGroups}
            />
          )}
          {view === 'list' && (
            <ProjectTaskList
              title={project.name}
              project={project}
              department={department}
              tasks={filteredTasks}
              taskGroups={taskGroups}
              users={users}
              canCreateTask={canCreateTask}
              onCreateTask={openCreateTask}
              onCreateGroup={() => setShowCreateGroup(true)}
              onOpenTask={setSelectedListTask}
            />
          )}
          {view === 'gantt' && <GanttChart projectId={projectId} tasks={filteredTasks} users={users} onTaskUpdated={handleTaskUpdated} />}
        </div>
      </div>

      <CreateTaskModal
        open={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        defaultProjectId={projectId}
        defaultGroupKey={createTaskGroupKey || undefined}
        taskGroups={taskGroups}
        onCreated={loadData}
      />

      <TaskDetailPanel
        task={selectedListTask}
        open={Boolean(selectedListTask)}
        onClose={() => setSelectedListTask(null)}
        projectId={projectId}
        users={users}
        onUpdate={(updatedTask) => {
          handleTaskUpdated(updatedTask);
          setSelectedListTask(updatedTask);
        }}
      />

      <Dialog open={showCreateGroup} onOpenChange={(open) => {
        setShowCreateGroup(open);
        if (!open) setNewGroupName('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tao nhom cong viec</DialogTitle>
            <DialogDescription>Nhom moi se xuat hien tren Workspace va co the chon khi giao task.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ten nhom</label>
              <Input
                value={newGroupName}
                onChange={(event) => setNewGroupName(event.target.value)}
                placeholder="Vi du: Phase 1, Backend, Kiem thu..."
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void handleCreateGroup();
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateGroup(false)}>Huy</Button>
              <Button onClick={handleCreateGroup} disabled={!newGroupName.trim() || isSavingGroup}>
                {isSavingGroup ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tao nhom'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMembers} onOpenChange={setShowMembers}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Quan tri thanh vien du an</DialogTitle>
            <DialogDescription>Chi dinh Project Owner va them/go thanh vien du an.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1">Project Owner</label>
              <Select value={selectedOwnerId} onValueChange={handleOwnerChange}>
                <SelectTrigger><SelectValue placeholder="Chon owner" /></SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={getEntityId(user)} value={getEntityId(user)}>{user.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="w-4 h-4" />
                  Thanh vien hien tai ({memberUsers.length})
                </div>
                <div className="border rounded-lg divide-y max-h-80 overflow-auto">
                  {memberUsers.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500">Chua co thanh vien.</div>
                  ) : memberUsers.map((member) => {
                    const memberId = getEntityId(member);
                    const blocking = blockingTaskCount(memberId);
                    const isOwner = memberId === ownerId;
                    return (
                      <div key={memberId} className="flex items-center justify-between gap-3 p-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{member.full_name}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {member.email}{isOwner ? ' - Owner' : ''}{blocking ? ` - ${blocking} task In Progress` : ''}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isOwner}
                          onClick={() => handleRemoveMember(member)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="Tim nhan su..."
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                />
                <div className="border rounded-lg divide-y max-h-80 overflow-auto">
                  {availableUsers.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500">Khong co nhan su phu hop.</div>
                  ) : availableUsers.map((user) => {
                    const userId = getEntityId(user);
                    return (
                      <label key={userId} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50">
                        <Checkbox
                          checked={selectedUserIds.includes(userId)}
                          onCheckedChange={(checked) => toggleSelectedUser(userId, checked === true)}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium truncate">{user.full_name}</span>
                          <span className="block text-xs text-slate-500 truncate">{user.email}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                <Button onClick={handleAddMembers} disabled={selectedUserIds.length === 0 || isSavingMembers} className="w-full">
                  {isSavingMembers ? <Loader2 className="w-4 h-4 animate-spin" /> : `Them ${selectedUserIds.length || ''} thanh vien`}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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

function MetricBar({
  label,
  value,
  percentage,
  color,
  compact = false,
}: {
  label: string;
  value: number;
  percentage: number;
  color: string;
  compact?: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className={cn('truncate font-bold text-slate-700', compact ? 'text-[11px]' : 'text-[12px]')}>{label}</span>
        <span className="text-[12px] font-extrabold text-slate-900">{value}</span>
      </div>
      <div className={cn('overflow-hidden rounded-full bg-slate-100', compact ? 'h-1.5' : 'h-2')}>
        <div className="h-full rounded-full transition-all" style={{ width: `${percentage}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="h-3.5 w-3.5 flex-shrink-0 text-slate-500" />
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
