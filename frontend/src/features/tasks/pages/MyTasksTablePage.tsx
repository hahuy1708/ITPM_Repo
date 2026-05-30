import { useEffect, useMemo, useState } from 'react';
import { CheckSquare, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { projectService } from '@/features/projects/api/project.api';
import { taskService } from '@/features/tasks/api/task.api';
import { userService } from '@/features/users/api/user.api';
import CreateTaskModal from '@/features/tasks/components/CreateTaskModal';
import TaskDetailPanel from '@/features/tasks/components/TaskDetailPanel';
import TaskTableView, { groupTasksByDeadline, TaskToolbar } from '@/features/tasks/components/TaskTableView';
import type { Project, Task, TaskStatus, User } from '@/types';

const getEntityId = (value?: string | { _id?: string; id?: string }) => (
  typeof value === 'string' ? value : value?._id || value?.id || ''
);
const getTaskProjectId = (task: Task) => getEntityId(task.project_id) || getEntityId(task.project);

export default function MyTasksTablePage() {
  const { token, user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [createDueDate, setCreateDueDate] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const userId = user?._id || user?.id || '';

  const loadData = async () => {
    if (!token || !userId) return;
    try {
      setIsLoading(true);
      setError('');
      const canLoadUsers = user?.role === 'admin' || user?.role === 'manager';
      const [taskList, projectResponse, userResponse] = await Promise.all([
        taskService.getTasks(token, { assigneeId: userId, limit: 200 }),
        projectService.getProjects(token, { page: 1, limit: 100 }),
        canLoadUsers ? userService.getUsers(token) : Promise.resolve({ success: true, data: user ? [user] : [] }),
      ]);
      setTasks(taskList);
      setProjects(projectResponse.data || []);
      setUsers(userResponse.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong tai duoc cong viec cua toi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [token, userId, user?.role]);

  const filteredTasks = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesProject = projectFilter === 'all' || getTaskProjectId(task) === projectFilter;
      const matchesKeyword = !keyword
        || task.title.toLowerCase().includes(keyword)
        || (task.group_name || '').toLowerCase().includes(keyword)
        || (task.project?.name || '').toLowerCase().includes(keyword);
      return matchesStatus && matchesProject && matchesKeyword;
    });
  }, [tasks, statusFilter, projectFilter, search]);

  const groups = useMemo(() => groupTasksByDeadline(filteredTasks), [filteredTasks]);

  const openCreateTask = (dueDate?: string) => {
    setCreateDueDate(dueDate);
    setShowCreateTask(true);
  };

  const handleTaskUpdated = (updated: Task) => {
    const updatedId = updated.id || updated._id;
    setTasks((current) => current.map((task) => (task.id || task._id) === updatedId ? updated : task));
    setSelectedTask(updated);
  };

  return (
    <div className="flex h-[calc(100vh-101px)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex-shrink-0 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-4 px-5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <CheckSquare className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-[18px] font-extrabold text-slate-950">Cong viec cua toi</h1>
              <div className="mt-1 flex gap-5 text-[12px] font-bold text-slate-400">
                <span className="border-b-2 border-blue-600 pb-2 text-blue-600">GIAO CHO TOI</span>
                <span>TOI GIAO DI</span>
                <span>DANG THEO DOI</span>
                <span>TIEN DO CONG VI...</span>
                <span>TIMESHEET THAN...</span>
                <span>Tat ca view</span>
                <span>+ Them view</span>
              </div>
            </div>
          </div>
        </div>

        <TaskToolbar
          statusFilter={statusFilter}
          projectFilter={projectFilter}
          groupBy="Thoi han"
          assigneeFilterLabel="Giao cho toi"
          projects={projects}
          onStatusChange={setStatusFilter}
          onProjectChange={setProjectFilter}
          onSearchChange={setSearch}
          onCreate={() => openCreateTask()}
        />
      </div>

      {error && <div className="mx-4 mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] font-medium text-red-700">{error}</div>}

      <div className="flex-1 overflow-hidden bg-white">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
          </div>
        ) : (
          <TaskTableView
            groups={groups}
            projects={projects}
            users={users}
            onOpenTask={setSelectedTask}
            onCreateTask={openCreateTask}
          />
        )}
      </div>

      <CreateTaskModal
        open={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        defaultDueDate={createDueDate}
        onCreated={loadData}
      />
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
