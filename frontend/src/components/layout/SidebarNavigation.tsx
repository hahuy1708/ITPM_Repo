import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderKanban,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type NavEntityType = 'project' | 'department';

export interface NavFolder {
  id: string;
  name: string;
  created_by: string;
}

export interface NavEntity {
  id: string;
  type: NavEntityType;
  name: string;
  description: string;
  color: string;
  folder_id: string | null;
}

export interface EntityFormState {
  name: string;
  description: string;
  color: string;
  folder_id: string;
}

interface MoveDialogState {
  entity: NavEntity;
  folder_id: string;
}

interface SidebarNavigationProps {
  searchQuery: string;
  folders: NavFolder[];
  entities: NavEntity[];
  setEntities: Dispatch<SetStateAction<NavEntity[]>>;
  isLoading?: boolean;
  error?: string;
  onMoveEntity?: (entity: NavEntity, folderId: string | null) => Promise<void> | void;
}

export const emptyProjectForm: EntityFormState = {
  name: '',
  description: '',
  color: '#2563eb',
  folder_id: 'none',
};

export const emptyDepartmentForm: EntityFormState = {
  name: '',
  description: '',
  color: '#16a34a',
  folder_id: 'none',
};

const getEntityPath = (entity: NavEntity) => (
  entity.type === 'project' ? `/projects/${entity.id}` : `/departments/${entity.id}`
);

export const normalizeId = (value: string) => (
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
);

export default function SidebarNavigation({
  searchQuery,
  folders,
  entities,
  setEntities,
  isLoading = false,
  error = '',
  onMoveEntity,
}: SidebarNavigationProps) {
  const location = useLocation();
  const [openFolderIds, setOpenFolderIds] = useState<Record<string, boolean>>(() => (
    Object.fromEntries(folders.map((folder) => [folder.id, true]))
  ));
  const [moveDialog, setMoveDialog] = useState<MoveDialogState | null>(null);

  useEffect(() => {
    setOpenFolderIds((current) => ({
      ...Object.fromEntries(folders.map((folder) => [folder.id, true])),
      ...current,
    }));
  }, [folders]);

  const filteredEntities = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return entities;
    return entities.filter((entity) => (
      entity.name.toLowerCase().includes(keyword)
      || entity.description.toLowerCase().includes(keyword)
    ));
  }, [entities, searchQuery]);

  const groupedEntities = useMemo(() => {
    const groups = new Map<string, NavEntity[]>();
    folders.forEach((folder) => groups.set(folder.id, []));
    filteredEntities.forEach((entity) => {
      if (!entity.folder_id) return;
      if (!groups.has(entity.folder_id)) groups.set(entity.folder_id, []);
      groups.get(entity.folder_id)?.push(entity);
    });
    return groups;
  }, [filteredEntities, folders]);

  const rootEntities = useMemo(() => (
    filteredEntities.filter((entity) => !entity.folder_id || !folders.some((folder) => folder.id === entity.folder_id))
  ), [filteredEntities, folders]);

  const toggleFolder = (folderId: string) => {
    setOpenFolderIds((current) => ({ ...current, [folderId]: !(current[folderId] ?? true) }));
  };

  const moveEntity = async () => {
    if (!moveDialog) return;
    const previousEntities = entities;
    const nextFolderId = moveDialog.folder_id === 'none' ? null : moveDialog.folder_id;

    setEntities((current) => current.map((entity) => (
      entity.id === moveDialog.entity.id && entity.type === moveDialog.entity.type
        ? { ...entity, folder_id: nextFolderId }
        : entity
    )));
    const movedEntity = moveDialog.entity;
    setMoveDialog(null);

    try {
      await onMoveEntity?.(movedEntity, nextFolderId);
    } catch {
      setEntities(previousEntities);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {isLoading && (
          <div className="px-2 py-2 text-[12px] font-medium text-slate-500">Dang tai workspace...</div>
        )}
        {!isLoading && error && (
          <div className="mb-2 rounded border border-red-400/20 bg-red-500/10 px-2 py-1.5 text-[11px] font-medium text-red-200">
            {error}
          </div>
        )}
        <div className="space-y-1">
          {folders.map((folder) => {
            const children = groupedEntities.get(folder.id) || [];
            const open = openFolderIds[folder.id] ?? true;

            return (
              <section key={folder.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleFolder(folder.id)}
                  className="group flex h-7 w-full items-center gap-1.5 rounded px-2 text-left transition hover:bg-slate-100/10"
                >
                  {open ? <ChevronDown className="h-3.5 w-3.5 text-slate-500" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-500" />}
                  <Folder className="h-3.5 w-3.5 text-slate-500" />
                  <span className="min-w-0 flex-1 truncate text-[12px] font-semibold uppercase text-slate-500">
                    {folder.name}
                  </span>
                  <span className="rounded bg-white/8 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{children.length}</span>
                </button>

                {open && (
                  <div className="space-y-0.5 pl-3">
                    {children.map((entity) => (
                      <SidebarEntityRow
                        key={`${entity.type}-${entity.id}`}
                        entity={entity}
                        active={location.pathname === getEntityPath(entity)}
                        onMove={() => setMoveDialog({ entity, folder_id: entity.folder_id || 'none' })}
                      />
                    ))}
                    {children.length === 0 && (
                      <div className="px-2 py-1.5 text-[12px] font-medium text-slate-600">Chua co muc nao.</div>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <div className="mt-4 space-y-1 border-t border-white/8 pt-3">
          <p className="px-2 text-[12px] font-semibold uppercase text-slate-500">ROOT</p>
          {rootEntities.map((entity) => (
            <SidebarEntityRow
              key={`${entity.type}-${entity.id}`}
              entity={entity}
              active={location.pathname === getEntityPath(entity)}
              onMove={() => setMoveDialog({ entity, folder_id: entity.folder_id || 'none' })}
            />
          ))}
          {rootEntities.length === 0 && (
            <div className="px-2 py-1.5 text-[12px] font-medium text-slate-600">Khong co muc root.</div>
          )}
        </div>
      </div>

      <Dialog open={Boolean(moveDialog)} onOpenChange={(open) => !open && setMoveDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Di chuyen vao thu muc</DialogTitle>
            <DialogDescription>
              Chon thu muc dich cho {moveDialog?.entity.name}. Chon Khong co de dua ve root.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Thu muc</Label>
            <Select
              value={moveDialog?.folder_id || 'none'}
              onValueChange={(value) => moveDialog && setMoveDialog({ ...moveDialog, folder_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chon thu muc" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Khong co</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMoveDialog(null)}>Huy</Button>
            <Button type="button" onClick={moveEntity}>Di chuyen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SidebarEntityRow({
  entity,
  active,
  onMove,
}: {
  entity: NavEntity;
  active: boolean;
  onMove: () => void;
}) {
  const Icon = entity.type === 'project' ? FolderKanban : Building2;

  return (
    <div
      className={cn(
        'group flex h-8 items-center gap-2 rounded px-2 text-[13px] font-semibold transition',
        active
          ? 'bg-emerald-500/14 text-emerald-200'
          : 'text-slate-300 hover:bg-slate-100 hover:text-slate-900'
      )}
    >
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entity.color }} />
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <Link to={getEntityPath(entity)} className="min-w-0 flex-1 truncate">
        {entity.name}
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded opacity-0 transition group-hover:opacity-100',
              active ? 'text-emerald-200 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-900'
            )}
            onClick={(event) => event.preventDefault()}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem className="gap-2 text-[13px]" onSelect={onMove}>
            <Folder className="h-3.5 w-3.5" />
            Di chuyen vao thu muc
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled className="gap-2 text-[13px]">
            <Plus className="h-3.5 w-3.5" />
            Them thao tac sau
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function SidebarEntityDialog({
  title,
  description,
  open,
  folders,
  form,
  onOpenChange,
  onFormChange,
  onSubmit,
  isSubmitting = false,
}: {
  title: string;
  description: string;
  open: boolean;
  folders: NavFolder[];
  form: EntityFormState;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: EntityFormState) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}) {
  const set = <K extends keyof EntityFormState>(key: K, value: EntityFormState[K]) => {
    onFormChange({ ...form, [key]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <label className="space-y-2">
            <Label>Ten</Label>
            <Input value={form.name} onChange={(event) => set('name', event.target.value)} placeholder="Nhap ten..." />
          </label>

          <label className="space-y-2">
            <Label>Mo ta</Label>
            <Input value={form.description} onChange={(event) => set('description', event.target.value)} placeholder="Mo ta ngan..." />
          </label>

          <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3">
            <label className="space-y-2">
              <Label>Mau</Label>
              <Input
                type="color"
                value={form.color}
                onChange={(event) => set('color', event.target.value)}
                className="h-9 p-1"
              />
            </label>

            <label className="space-y-2">
              <Label>Chon thu muc</Label>
              <Select value={form.folder_id} onValueChange={(value) => set('folder_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Khong co" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Khong co</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Huy</Button>
          <Button type="button" disabled={!form.name.trim() || isSubmitting} onClick={onSubmit}>{title}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
