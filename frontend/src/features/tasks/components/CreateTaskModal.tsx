import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { FileText, Loader2, Paperclip, UploadCloud, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { projectService } from '@/features/projects/api/project.api';
import { taskService } from '@/features/tasks/api/task.api';
import { userService } from '@/features/users/api/user.api';
import { useCreateTask } from '@/features/tasks/hooks/useCreateTask';
import RichTextEditor from '@/features/tasks/components/RichTextEditor';
import AssigneeSelect from '@/features/tasks/components/AssigneeSelect';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Attachment, Project, Task, TaskGroup, User } from '@/types';
import type { CreateTaskFormValues } from '@/features/tasks/validation/task.validation';

type TaskForm = CreateTaskFormValues;

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  defaultGroupKey?: string;
  defaultDueDate?: string;
  taskGroups?: TaskGroup[];
  onCreated?: () => void;
}

const emptyForm: TaskForm = {
  title: '',
  content_html: '',
  project_id: '',
  assignee_id: 'none',
  reviewer_id: 'none',
  priority: 'medium',
  group_key: 'general',
  group_name: 'Chung',
  kpi_weight: '',
  start_date: '',
  due_date: '',
};

const getEntityId = (value: { _id?: string; id?: string }) => value._id || value.id || '';

export default function CreateTaskModal({
  open,
  onClose,
  defaultProjectId,
  defaultGroupKey,
  defaultDueDate,
  taskGroups = [],
  onCreated,
}: CreateTaskModalProps) {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadedTaskGroups, setLoadedTaskGroups] = useState<TaskGroup[]>([]);
  const [dependencyOptions, setDependencyOptions] = useState<Task[]>([]);
  const [dependencyIds, setDependencyIds] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [form, setForm] = useState<TaskForm>({ ...emptyForm, project_id: defaultProjectId || '', due_date: defaultDueDate || '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const { createTask, isCreating } = useCreateTask(token);
  const usesProvidedTaskGroups = Boolean(defaultProjectId && form.project_id === defaultProjectId && taskGroups.length > 0);

  useEffect(() => {
    if (!open) return;
    setForm((current) => ({
      ...current,
      project_id: defaultProjectId || current.project_id,
      group_key: defaultGroupKey || current.group_key,
      due_date: defaultDueDate || current.due_date,
    }));
    void loadOptions();
  }, [open, defaultProjectId, defaultGroupKey, defaultDueDate, token]);

  useEffect(() => {
    if (!open || !token || !form.project_id) {
      setDependencyOptions([]);
      setDependencyIds([]);
      return;
    }

    let cancelled = false;
    setDependencyIds([]);
    taskService.getProjectTasks(form.project_id, token)
      .then((tasks) => {
        if (!cancelled) setDependencyOptions(tasks);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load dependencies');
      });

    return () => {
      cancelled = true;
    };
  }, [open, token, form.project_id]);

  useEffect(() => {
    if (!open || !token || !form.project_id || usesProvidedTaskGroups) {
      if (!form.project_id || usesProvidedTaskGroups) setLoadedTaskGroups([]);
      return;
    }

    let cancelled = false;
    projectService.getTaskGroups(form.project_id, token)
      .then((response) => {
        if (!cancelled) setLoadedTaskGroups(response.data || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load task groups');
      });

    return () => {
      cancelled = true;
    };
  }, [open, token, form.project_id, usesProvidedTaskGroups]);

  const loadOptions = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const [projectResponse, userResponse] = await Promise.all([
        projectService.getProjects(token, { page: 1, limit: 100 }),
        userService.getUsers(token),
      ]);
      setProjects(projectResponse.data || []);
      setUsers(userResponse.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load task form data');
    } finally {
      setIsLoading(false);
    }
  };

  const availableTaskGroups = useMemo(() => {
    const groups = usesProvidedTaskGroups ? taskGroups : loadedTaskGroups;
    if (groups.length > 0) return groups;
    return [{ key: 'general', name: 'Chung' }];
  }, [usesProvidedTaskGroups, taskGroups, loadedTaskGroups]);

  const groupOptions = useMemo(() => {
    const map = new Map<string, TaskGroup>();
    availableTaskGroups.forEach((group) => {
      if (group.key && !map.has(group.key)) map.set(group.key, group);
    });
    if (form.group_key && !map.has(form.group_key)) {
      map.set(form.group_key, { key: form.group_key, name: form.group_name || form.group_key });
    }
    if (map.size === 0) map.set('general', { key: 'general', name: 'Chung' });
    return [...map.values()].sort((left, right) => left.name.localeCompare(right.name, 'vi'));
  }, [availableTaskGroups, form.group_key, form.group_name]);

  useEffect(() => {
    if (!open || !form.project_id || availableTaskGroups.length === 0) return;
    const selected = availableTaskGroups.find((group) => group.key === form.group_key) || availableTaskGroups[0];
    if (!selected) return;
    if (selected.key !== form.group_key || selected.name !== form.group_name) {
      setForm((current) => ({ ...current, group_key: selected.key, group_name: selected.name }));
    }
  }, [open, form.project_id, form.group_key, form.group_name, availableTaskGroups]);

  const set = <K extends keyof TaskForm>(key: K, value: TaskForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleGroupChange = (groupKey: string) => {
    const group = groupOptions.find((item) => item.key === groupKey);
    setForm((current) => ({
      ...current,
      group_key: group?.key || groupKey,
      group_name: group?.name || current.group_name,
    }));
  };

  const reset = () => {
    setForm({ ...emptyForm, project_id: defaultProjectId || '', due_date: defaultDueDate || '' });
    setDependencyIds([]);
    setDependencyOptions([]);
    setAttachments([]);
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFiles = async (files: FileList | File[]) => {
    if (!token) return;

    try {
      setIsUploading(true);
      setError('');
      const uploaded = await Promise.all(Array.from(files).map((file) => taskService.uploadFile(file, token)));
      setAttachments((current) => [...current, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = (fileUrl: string) => {
    setAttachments((current) => current.filter((attachment) => attachment.file_url !== fileUrl));
  };

  const toggleDependency = (taskId: string, checked: boolean) => {
    setDependencyIds((current) => (
      checked ? [...new Set([...current, taskId])] : current.filter((id) => id !== taskId)
    ));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;

    try {
      setError('');
      await createTask(form, attachments, dependencyIds);
      reset();
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tao cong viec moi</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <div>
            <Label>Tieu de *</Label>
            <Input
              value={form.title}
              onChange={(event) => set('title', event.target.value)}
              placeholder="Nhap tieu de cong viec..."
            />
          </div>

          <div>
            <Label>Mo ta</Label>
            <RichTextEditor value={form.content_html} onChange={(value) => set('content_html', value)} disabled={isCreating} />
          </div>

          <div
            className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (event.dataTransfer.files.length) void handleFiles(event.dataTransfer.files);
            }}
          >
            <UploadCloud className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm font-medium text-slate-700">Keo tha file vao day</p>
            <p className="text-xs text-slate-500">Toi da 10MB/file, chan .exe va .sh</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.webp"
              onChange={(event) => event.target.files && handleFiles(event.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 gap-2"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
              Chon file
            </Button>
          </div>

          {attachments.length > 0 && (
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div key={attachment.file_url} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 flex-shrink-0 text-slate-500" />
                    <span className="truncate text-sm font-medium">{attachment.file_name}</span>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeAttachment(attachment.file_url)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Du an *</Label>
              <Select value={form.project_id} onValueChange={(value) => set('project_id', value)}>
                <SelectTrigger><SelectValue placeholder={isLoading ? 'Dang tai...' : 'Chon du an'} /></SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={getEntityId(project)} value={getEntityId(project)}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Do uu tien</Label>
              <Select value={form.priority} onValueChange={(value) => set('priority', value as CreateTaskFormValues['priority'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Thap</SelectItem>
                  <SelectItem value="medium">Trung binh</SelectItem>
                  <SelectItem value="high">Cao</SelectItem>
                  <SelectItem value="urgent">Khan cap</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Nhom cong viec</Label>
              <Select value={form.group_key} onValueChange={handleGroupChange} disabled={!form.project_id || groupOptions.length === 0}>
                <SelectTrigger><SelectValue placeholder={form.project_id ? 'Chon nhom cong viec' : 'Chon du an truoc'} /></SelectTrigger>
                <SelectContent>
                  {groupOptions.map((group) => (
                    <SelectItem key={group.key} value={group.key}>{group.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Diem KPI</Label>
              <Input type="number" min="0" value={form.kpi_weight} onChange={(event) => set('kpi_weight', event.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Assignee</Label>
              <AssigneeSelect users={users} value={form.assignee_id} onChange={(value) => set('assignee_id', value)} disabled={isCreating} />
            </div>

            <div>
              <Label>Reviewer</Label>
              <Select value={form.reviewer_id} onValueChange={(value) => set('reviewer_id', value)}>
                <SelectTrigger><SelectValue placeholder="Chon nguoi duyet" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Chua co reviewer</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={getEntityId(user)} value={getEntityId(user)}>{user.full_name || user.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Ngay bat dau</Label>
              <Input type="date" value={form.start_date} onChange={(event) => set('start_date', event.target.value)} />
            </div>
            <div>
              <Label>Han chot</Label>
              <Input type="date" value={form.due_date} onChange={(event) => set('due_date', event.target.value)} />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-4">
            <Label>Dependencies</Label>
            <div className="mt-3 max-h-44 space-y-2 overflow-y-auto pr-1">
              {dependencyOptions.map((dependency) => {
                const dependencyId = dependency.id || dependency._id || '';
                return (
                  <label key={dependencyId} className="flex items-start gap-3 rounded-md px-2 py-1.5 hover:bg-slate-50">
                    <Checkbox
                      checked={dependencyIds.includes(dependencyId)}
                      onCheckedChange={(checked) => toggleDependency(dependencyId, checked === true)}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{dependency.title}</span>
                      <span className="block text-xs text-slate-500">{dependency.status.replace('_', ' ')}</span>
                    </span>
                  </label>
                );
              })}
              {form.project_id && dependencyOptions.length === 0 && (
                <p className="text-sm text-slate-500">Du an chua co task de chon dependency.</p>
              )}
              {!form.project_id && (
                <p className="text-sm text-slate-500">Chon du an truoc khi thiet lap dependency.</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Huy</Button>
            <Button type="submit" disabled={!form.title.trim() || !form.project_id || isCreating || isUploading}>
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tao cong viec'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
