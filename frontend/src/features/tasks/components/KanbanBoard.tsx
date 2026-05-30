import { useEffect, useMemo, useState } from 'react';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { CheckCircle2, CircleDashed, ClipboardCheck, Clock3, GripVertical, Plus, RotateCcw, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { projectService } from '@/features/projects/api/project.api';
import { taskService } from '@/features/tasks/api/task.api';
import { type Task, type TaskGroup, type TaskStatus, type User } from '@/types';
import TaskCard from './TaskCard.tsx';
import TaskDetailPanel from './TaskDetailPanel.tsx';
import { cn } from '@/lib/utils';

const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'review', 'needs_revision', 'done'];

const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: LucideIcon; dot: string; border: string }> = {
  todo: { label: 'Todo', icon: CircleDashed, dot: 'bg-slate-400', border: 'border-slate-200' },
  in_progress: { label: 'In Progress', icon: Clock3, dot: 'bg-blue-500', border: 'border-blue-200' },
  review: { label: 'Cho nghiem thu', icon: ClipboardCheck, dot: 'bg-amber-500', border: 'border-amber-200' },
  needs_revision: { label: 'Can sua', icon: RotateCcw, dot: 'bg-red-500', border: 'border-red-200' },
  done: { label: 'Done', icon: CheckCircle2, dot: 'bg-emerald-500', border: 'border-emerald-200' },
};

interface KanbanBoardProps {
  projectId: string;
  tasks: Task[];
  taskGroups?: TaskGroup[];
  users: User[];
  onTaskUpdated?: (task: Task) => void;
  initialTaskId?: string;
  onTaskDetailClose?: () => void;
  onCreateTask?: (groupKey?: string) => void;
  persistGroupOrder?: boolean;
  onTaskGroupsReordered?: (groups: TaskGroup[]) => void;
}

const GROUP_DROPPABLE_ID = 'task-groups';
const GROUP_DRAG_PREFIX = 'task-group::';
const getTaskId = (task: Task) => task.id || task._id || '';
const getEntityId = (value?: string | { _id?: string; id?: string }) => (
  typeof value === 'string' ? value : value?._id || value?.id || ''
);
const getTaskProjectId = (task: Task) => getEntityId(task.project_id) || getEntityId(task.project);
const getGroupKey = (task: Task) => task.group_key || 'general';
const getGroupName = (task: Task) => task.group_name || 'Chung';
const getDroppableId = (groupKey: string, status: TaskStatus) => `${groupKey}::${status}`;
const parseDroppableId = (value: string) => {
  const [groupKey, status] = value.split('::');
  return { groupKey: groupKey || 'general', status: status as TaskStatus };
};

export default function KanbanBoard({
  projectId,
  tasks = [],
  taskGroups = [],
  users = [],
  onTaskUpdated,
  initialTaskId = '',
  onTaskDetailClose,
  onCreateTask,
  persistGroupOrder = false,
  onTaskGroupsReordered,
}: KanbanBoardProps) {
  const { token, user } = useAuth();
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const [orderedGroupKeys, setOrderedGroupKeys] = useState<string[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [autoOpenedTaskId, setAutoOpenedTaskId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    if (!initialTaskId) {
      setAutoOpenedTaskId('');
      return;
    }
    if (autoOpenedTaskId === initialTaskId) return;
    const task = localTasks.find((item) => item.id === initialTaskId || item._id === initialTaskId);
    if (task) {
      setSelectedTask(task);
      setAutoOpenedTaskId(initialTaskId);
    }
  }, [initialTaskId, localTasks, autoOpenedTaskId]);

  const baseGroups = useMemo(() => {
    const map = new Map<string, { key: string; name: string; tasks: Task[] }>();
    taskGroups.forEach((group) => {
      if (group.key && !map.has(group.key)) map.set(group.key, { key: group.key, name: group.name, tasks: [] });
    });
    localTasks.forEach((task) => {
      const key = getGroupKey(task);
      if (!map.has(key)) map.set(key, { key, name: getGroupName(task), tasks: [] });
      map.get(key)?.tasks.push(task);
    });
    if (map.size === 0) map.set('general', { key: 'general', name: 'Chung', tasks: [] });
    return [...map.values()].sort((left, right) => {
      const leftIndex = taskGroups.findIndex((group) => group.key === left.key);
      const rightIndex = taskGroups.findIndex((group) => group.key === right.key);
      if (leftIndex !== -1 && rightIndex !== -1) return leftIndex - rightIndex;
      if (leftIndex !== -1) return -1;
      if (rightIndex !== -1) return 1;
      return left.name.localeCompare(right.name, 'vi');
    });
  }, [localTasks, taskGroups]);

  useEffect(() => {
    setOrderedGroupKeys((current) => {
      const nextGroupKeys = baseGroups.map((group) => group.key);
      const preserved = current.filter((key) => nextGroupKeys.includes(key));
      const added = nextGroupKeys.filter((key) => !preserved.includes(key));
      return [...preserved, ...added];
    });
  }, [baseGroups]);

  const groups = useMemo(() => {
    const map = new Map(baseGroups.map((group) => [group.key, group]));
    const ordered = orderedGroupKeys
      .map((key) => map.get(key))
      .filter((group): group is { key: string; name: string; tasks: Task[] } => Boolean(group));
    const orderedSet = new Set(ordered.map((group) => group.key));
    const missing = baseGroups.filter((group) => !orderedSet.has(group.key));
    return [...ordered, ...missing];
  }, [baseGroups, orderedGroupKeys]);

  const currentUserId = user?._id || user?.id || '';
  const canMoveTask = (task: Task) => (
    user?.role === 'admin'
    || user?.role === 'manager'
    || Boolean(task.assignee_id && task.assignee_id === currentUserId)
  );

  const canDragTask = (task: Task) => (
    canMoveTask(task)
    && task.status !== 'review'
    && task.status !== 'done'
  );

  const persistTaskMove = async (task: Task, nextGroupKey: string, nextStatus: TaskStatus) => {
    if (!token) throw new Error('Missing auth token');
    const group = groups.find((item) => item.key === nextGroupKey);
    const response = await taskService.updateTask(getTaskId(task), {
      status: nextStatus,
      group_key: nextGroupKey,
      group_name: group?.name || task.group_name || 'Chung',
    }, token);
    if (!response.data) throw new Error(response.message || 'Task update failed');
    return response.data;
  };

  const handleGroupDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination || source.index === destination.index) return;

    const nextGroups = [...groups];
    const [moved] = nextGroups.splice(source.index, 1);
    nextGroups.splice(destination.index, 0, moved);

    const previousKeys = groups.map((group) => group.key);
    const nextKeys = nextGroups.map((group) => group.key);
    setOrderedGroupKeys(nextKeys);

    if (!persistGroupOrder) return;

    try {
      if (!token) throw new Error('Missing auth token');
      const response = await projectService.reorderTaskGroups(projectId, nextKeys, token);
      if (response.data) {
        setOrderedGroupKeys(response.data.map((group) => group.key));
        onTaskGroupsReordered?.(response.data);
      }
      setError('');
    } catch (err) {
      setOrderedGroupKeys(previousKeys);
      setError(err instanceof Error ? err.message : 'Khong luu duoc thu tu nhom cong viec');
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { draggableId, destination, source, type } = result;
    if (!destination) return;

    if (type === 'GROUP' || source.droppableId === GROUP_DROPPABLE_ID) {
      await handleGroupDragEnd(result);
      return;
    }

    const task = localTasks.find((item) => getTaskId(item) === draggableId);
    if (!task || !canMoveTask(task)) {
      setLocalTasks(tasks);
      return;
    }

    const { groupKey: nextGroupKey, status: nextStatus } = parseDroppableId(destination.droppableId);
    if (!STATUS_ORDER.includes(nextStatus)) return;

    const statusChanged = task.status !== nextStatus;
    const groupChanged = getGroupKey(task) !== nextGroupKey;
    if (!statusChanged && !groupChanged) return;

    if ((nextStatus === 'review' || nextStatus === 'done') && statusChanged) {
      setSelectedTask(task);
      setError('Hay dung luong Submit nghiem thu / Approve de chuyen sang Review hoac Done.');
      return;
    }

    const group = groups.find((item) => item.key === nextGroupKey);
    const optimisticTask = {
      ...task,
      status: nextStatus,
      group_key: nextGroupKey,
      group_name: group?.name || task.group_name || 'Chung',
    };

    setError('');
    setLocalTasks((current) => current.map((item) => (getTaskId(item) === draggableId ? optimisticTask : item)));

    try {
      const updated = await persistTaskMove(task, nextGroupKey, nextStatus);
      setLocalTasks((current) => current.map((item) => (getTaskId(item) === draggableId ? updated : item)));
      onTaskUpdated?.(updated);
    } catch (err) {
      setLocalTasks(tasks);
      setError(err instanceof Error ? err.message : 'Khong cap nhat duoc task');
    }
  };

  return (
    <>
      {error && <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="h-full overflow-x-auto pb-4">
          <Droppable droppableId={GROUP_DROPPABLE_ID} direction="horizontal" type="GROUP">
            {(groupDropProvided) => (
              <div
                ref={groupDropProvided.innerRef}
                {...groupDropProvided.droppableProps}
                className="flex min-h-[620px] items-start gap-5 pr-2"
              >
                {groups.map((group, groupIndex) => (
                  <Draggable key={group.key} draggableId={`${GROUP_DRAG_PREFIX}${group.key}`} index={groupIndex} isDragDisabled={groups.length <= 1}>
                    {(groupDragProvided, groupDragSnapshot) => (
                      <section
                        ref={groupDragProvided.innerRef}
                        {...groupDragProvided.draggableProps}
                        style={groupDragProvided.draggableProps.style}
                        className={cn(
                          'flex h-full w-[360px] flex-shrink-0 flex-col rounded-lg border border-slate-200 bg-white',
                          groupDragSnapshot.isDragging && 'z-40 rotate-[0.5deg] shadow-xl'
                        )}
                      >
                        <div className="border-b border-slate-200 px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-2">
                              <button
                                type="button"
                                {...(groupDragProvided.dragHandleProps || {})}
                                className="mt-0.5 flex h-7 w-7 flex-shrink-0 cursor-grab items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing"
                                aria-label="Keo de sap xep nhom cong viec"
                              >
                                <GripVertical className="h-4 w-4" />
                              </button>
                              <div className="min-w-0">
                                <h3 className="truncate text-[13px] font-extrabold uppercase tracking-wide text-slate-900">{group.name}</h3>
                                <p className="mt-0.5 text-[11px] font-medium text-slate-500">{group.tasks.length} cong viec trong nhom</p>
                              </div>
                            </div>
                            {onCreateTask && (
                              <button
                                type="button"
                                onClick={() => onCreateTask(group.key)}
                                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                                aria-label="Them cong viec"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-3">
                          {STATUS_ORDER.map((status) => {
                            const config = STATUS_CONFIG[status];
                            const Icon = config.icon;
                            const sectionTasks = group.tasks.filter((task) => task.status === status);

                            return (
                              <div key={`${group.key}-${status}`} className={cn('rounded-md border bg-white', config.border)}>
                                <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <Icon className="h-3.5 w-3.5 text-slate-500" />
                                    <span className="truncate text-[11px] font-extrabold uppercase text-slate-700">{config.label}</span>
                                    <span className={cn('h-2 w-2 rounded-full', config.dot)} />
                                  </div>
                                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">{sectionTasks.length}</span>
                                </div>
                                <Droppable droppableId={getDroppableId(group.key, status)} type="TASK">
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.droppableProps}
                                      className={cn(
                                        'min-h-[86px] space-y-2 p-2 transition-colors',
                                        snapshot.isDraggingOver && 'bg-emerald-50'
                                      )}
                                    >
                                      {sectionTasks.map((task, index) => (
                                        <Draggable key={getTaskId(task)} draggableId={getTaskId(task)} index={index} isDragDisabled={!canDragTask(task)}>
                                          {(dragProvided, dragSnapshot) => (
                                            <div
                                              ref={dragProvided.innerRef}
                                              {...dragProvided.draggableProps}
                                              {...dragProvided.dragHandleProps}
                                              className={cn('transition-transform', dragSnapshot.isDragging && 'z-50 rotate-1 scale-[1.02]')}
                                            >
                                              <TaskCard task={task} users={users} onClick={setSelectedTask} isDragging={dragSnapshot.isDragging} />
                                            </div>
                                          )}
                                        </Draggable>
                                      ))}
                                      {provided.placeholder}
                                      {sectionTasks.length === 0 && !snapshot.isDraggingOver && (
                                        <div className="flex h-16 items-center justify-center rounded border border-dashed border-slate-200 text-[11px] text-slate-400">
                                          Keo task vao day
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </Droppable>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    )}
                  </Draggable>
                ))}
                {groupDropProvided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          open={!!selectedTask}
          onClose={() => {
            setSelectedTask(null);
            onTaskDetailClose?.();
          }}
          projectId={getTaskProjectId(selectedTask) || projectId}
          users={users}
          taskGroups={taskGroups}
          onUpdate={(updated) => {
            setSelectedTask(updated);
            setLocalTasks((current) => current.map((task) => (getTaskId(task) === getTaskId(updated) ? updated : task)));
            onTaskUpdated?.(updated);
          }}
        />
      )}
    </>
  );
}
