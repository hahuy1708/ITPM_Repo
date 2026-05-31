import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AlertCircle,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Folder as FolderIcon,
  FolderKanban,
  LayoutDashboard,
  Mail,
  Search,
  Settings,
  UserCheck,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppContext } from '@/app/providers/AppStateProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { departmentService } from '@/features/departments/api/department.api';
import { folderService, type Folder as FolderRecord } from '@/features/folders/api/folder.api';
import { projectService } from '@/features/projects/api/project.api';
import SidebarNavigation, {
  SidebarEntityDialog,
  emptyDepartmentForm,
  emptyProjectForm,
  normalizeId,
  type EntityFormState,
  type NavEntity,
  type NavEntityType,
  type NavFolder,
} from '@/components/layout/SidebarNavigation';
import { cn } from '@/lib/utils';
import type { Department, Project } from '@/types';

interface NavItemProps {
  path: string;
  icon: LucideIcon;
  label: string;
  roles?: string[];
}

const getRecordId = (value?: string | { _id?: string; id?: string } | null) => (
  typeof value === 'string' ? value : value?._id || value?.id || ''
);

const getUserLabel = (value?: string | { full_name?: string; email?: string } | null) => (
  typeof value === 'string' ? value : value?.full_name || value?.email || ''
);

const mapFolderToNavFolder = (folder: FolderRecord): NavFolder | null => {
  const id = getRecordId(folder);
  if (!id) return null;

  return {
    id,
    name: folder.name,
    created_by: getUserLabel(folder.created_by) || 'System',
  };
};

const mapProjectToNavEntity = (project: Project): NavEntity | null => {
  const id = getRecordId(project);
  if (!id) return null;

  return {
    id,
    type: 'project',
    name: project.name,
    description: project.description || '',
    color: project.color || '#2563eb',
    folder_id: getRecordId(project.folder_id) || null,
  };
};

const mapDepartmentToNavEntity = (department: Department): NavEntity | null => {
  const id = getRecordId(department);
  if (!id) return null;

  return {
    id,
    type: 'department',
    name: department.name,
    description: department.description || '',
    color: department.color || '#16a34a',
    folder_id: getRecordId(department.folder_id) || null,
  };
};

const makeDepartmentCode = (name: string) => {
  const normalized = normalizeId(name).replace(/-/g, '').toUpperCase();
  return normalized.slice(0, 16) || `DEPT${Date.now()}`;
};

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppContext();
  const { token, user } = useAuth();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [folders, setFolders] = useState<NavFolder[]>([]);
  const [entities, setEntities] = useState<NavEntity[]>([]);
  const [isNavigationLoading, setIsNavigationLoading] = useState(true);
  const [navigationError, setNavigationError] = useState('');
  const [creatingEntityType, setCreatingEntityType] = useState<NavEntityType | null>(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createDepartmentOpen, setCreateDepartmentOpen] = useState(false);
  const [projectForm, setProjectForm] = useState<EntityFormState>(emptyProjectForm);
  const [departmentForm, setDepartmentForm] = useState<EntityFormState>(emptyDepartmentForm);
  const currentUserId = user ? getRecordId(user) : '';
  const canCreateProject = user?.role === 'admin' || user?.role === 'manager';
  const canCreateFolder = user?.role === 'admin' || user?.role === 'manager';
  const canCreateDepartment = user?.role === 'admin';

  useEffect(() => {
    let cancelled = false;

    const loadNavigation = async () => {
      if (!token) {
        setFolders([]);
        setEntities([]);
        setIsNavigationLoading(false);
        return;
      }

      try {
        setIsNavigationLoading(true);
        setNavigationError('');

        const [folderResponse, projectResponse, departmentResponse] = await Promise.all([
          folderService.getFolders(token),
          projectService.getProjects(token, { page: 1, limit: 100 }),
          departmentService.getDepartments(token),
        ]);

        if (cancelled) return;

        setFolders((folderResponse.data || []).map(mapFolderToNavFolder).filter(Boolean) as NavFolder[]);
        setEntities([
          ...(projectResponse.data || []).map(mapProjectToNavEntity),
          ...(departmentResponse.data || []).map(mapDepartmentToNavEntity),
        ].filter(Boolean) as NavEntity[]);
      } catch (err) {
        if (!cancelled) {
          setFolders([]);
          setEntities([]);
          setNavigationError(err instanceof Error ? err.message : 'Khong tai duoc workspace');
        }
      } finally {
        if (!cancelled) setIsNavigationLoading(false);
      }
    };

    void loadNavigation();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const navItems: NavItemProps[] = [
    { path: '/', icon: LayoutDashboard, label: 'Tong quan' },
    { path: '/employees', icon: UsersRound, label: 'Nhan vien cua toi', roles: ['admin', 'manager'] },
    { path: '/my-tasks', icon: UserCheck, label: 'Viec cua toi' },
    { path: '/projects', icon: FolderKanban, label: 'Du an' },
    { path: '/departments', icon: Building2, label: 'Phong ban' },
    { path: '/invitations', icon: Mail, label: 'Nhan su', roles: ['admin'] },
    { path: '/settings', icon: Settings, label: 'Cai dat' },
  ].filter((item) => !item.roles || (user?.role && item.roles.includes(user.role)));

  const createEntity = async (type: NavEntityType) => {
    const form = type === 'project' ? projectForm : departmentForm;
    const name = form.name.trim();
    const folderId = form.folder_id === 'none' ? null : form.folder_id;

    if (!name || !token || !currentUserId) return;

    try {
      setCreatingEntityType(type);
      setNavigationError('');

      if (type === 'project') {
        const response = await projectService.createProject({
          name,
          description: form.description.trim(),
          color: form.color,
          status: 'planning',
          visibility: 'private',
          folder_id: folderId,
          owner_id: currentUserId,
          member_ids: [currentUserId],
        }, token);
        const entity = response.data ? mapProjectToNavEntity(response.data) : null;
        if (entity) setEntities((current) => [entity, ...current]);
        setProjectForm(emptyProjectForm);
        setCreateProjectOpen(false);
      } else {
        const response = await departmentService.createDepartment({
          name,
          code: makeDepartmentCode(name),
          managerId: currentUserId,
          description: form.description.trim(),
          color: form.color,
          folder_id: folderId,
        }, token);
        const entity = response.data ? mapDepartmentToNavEntity(response.data) : null;
        if (entity) setEntities((current) => [entity, ...current]);
        setDepartmentForm(emptyDepartmentForm);
        setCreateDepartmentOpen(false);
      }
    } catch (err) {
      setNavigationError(err instanceof Error ? err.message : 'Khong tao duoc muc moi');
    } finally {
      setCreatingEntityType(null);
    }
  };

  const createFolder = async () => {
    const name = folderName.trim();
    if (!name || !token) return;

    try {
      setIsCreatingFolder(true);
      setNavigationError('');
      const response = await folderService.createFolder(name, token);
      const folder = response.data ? mapFolderToNavFolder(response.data) : null;
      if (folder) setFolders((current) => [folder, ...current]);
      setFolderName('');
      setCreateFolderOpen(false);
    } catch (err) {
      setNavigationError(err instanceof Error ? err.message : 'Khong tao duoc thu muc');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const moveEntity = async (entity: NavEntity, folderId: string | null) => {
    if (!token) return;

    try {
      setNavigationError('');
      if (entity.type === 'project') {
        await projectService.updateProject(entity.id, { folder_id: folderId }, token);
      } else {
        await departmentService.updateDepartment(entity.id, { folder_id: folderId }, token);
      }
    } catch (err) {
      setNavigationError(err instanceof Error ? err.message : 'Khong di chuyen duoc muc nay');
      throw err;
    }
  };

  const NavItem = ({ path, icon: Icon, label }: NavItemProps) => {
    const content = (
      <Link
        to={path}
        className={cn(
          'group flex h-9 items-center gap-3 rounded-md px-3 text-[13px] font-semibold transition-colors',
          isActive(path)
            ? 'bg-white/10 text-white shadow-[inset_3px_0_0_#16c784]'
            : 'text-slate-300 hover:bg-white/6 hover:text-white'
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        {!sidebarCollapsed && <span className="truncate">{label}</span>}
      </Link>
    );

    if (!sidebarCollapsed) return content;

    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
        'fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-white/5 bg-[#202832] text-slate-100 transition-all duration-300',
        sidebarCollapsed ? 'w-[72px]' : 'w-[256px]'
      )}>
        <div className="flex h-[61px] flex-shrink-0 items-center gap-3 border-b border-white/8 px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500 text-sm font-black text-white shadow-sm">
            I
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight text-white">WeWork Workspace</p>
              <p className="truncate text-[11px] font-medium text-slate-400">Enterprise task & KPI</p>
            </div>
          )}
        </div>

        <div className={cn('border-b border-white/8 p-4', sidebarCollapsed && 'px-3')}>
          <div className={cn('flex items-center gap-3', sidebarCollapsed && 'justify-center')}>
            <Avatar className="h-9 w-9 border border-white/10">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-slate-700 text-xs font-bold text-white">
                {user?.full_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-white">{user?.full_name || 'User'}</p>
                <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-emerald-300">{user?.role || 'member'}</p>
              </div>
            )}
          </div>

          {!sidebarCollapsed && (
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tim nhanh du an..."
                className="h-9 w-full rounded-md border border-white/8 bg-slate-900/30 pl-9 pr-3 text-[12px] text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/70"
              />
            </div>
          )}
        </div>

        <div className="flex-shrink-0 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {!sidebarCollapsed && <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Navigation</p>}
            {navItems.map((item) => (
              <NavItem key={item.path} {...item} />
            ))}
          </div>
        </div>

        {!sidebarCollapsed && (
          <SidebarNavigation
            searchQuery={query}
            folders={folders}
            entities={entities}
            setEntities={setEntities}
            isLoading={isNavigationLoading}
            error={navigationError}
            onMoveEntity={moveEntity}
          />
        )}

        {!sidebarCollapsed && (canCreateProject || canCreateDepartment || canCreateFolder) && (
          <div className="flex-shrink-0 border-t border-white/8 bg-[#202832] p-3">
            {navigationError && (
              <div className="mb-2 flex items-start gap-2 rounded-md border border-red-400/20 bg-red-500/10 px-2 py-1.5 text-[11px] font-medium text-red-200">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <span className="min-w-0">{navigationError}</span>
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-full justify-between border-white/10 bg-slate-900/40 px-3 text-[13px] font-semibold text-slate-100 shadow-none hover:bg-slate-800 hover:text-white"
                >
                  <span className="flex items-center gap-2">
                    <Settings className="h-3.5 w-3.5" />
                    Tùy chỉnh
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-[232px]">
                {canCreateFolder && (
                  <DropdownMenuItem className="gap-2 py-2 text-[13px] font-semibold" onSelect={() => setCreateFolderOpen(true)}>
                    <FolderIcon className="h-3.5 w-3.5 text-slate-600" />
                    Them thu muc
                  </DropdownMenuItem>
                )}
                {canCreateProject && (
                  <DropdownMenuItem className="gap-2 py-2 text-[13px] font-semibold" onSelect={() => setCreateProjectOpen(true)}>
                    <FolderKanban className="h-3.5 w-3.5 text-blue-600" />
                  Thêm dự án
                  </DropdownMenuItem>
                )}
                {canCreateDepartment && (
                  <DropdownMenuItem className="gap-2 py-2 text-[13px] font-semibold" onSelect={() => setCreateDepartmentOpen(true)}>
                    <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                  Thêm phòng ban
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <SidebarEntityDialog
          title="Tạo dự án mới"
          description="Chọn thư mục nếu muốn dự án nằm trong một folder. Bỏ trống để nằm ở root."
          open={createProjectOpen}
          folders={folders}
          form={projectForm}
          onOpenChange={setCreateProjectOpen}
          onFormChange={setProjectForm}
          onSubmit={() => createEntity('project')}
          isSubmitting={creatingEntityType === 'project'}
        />

        <SidebarEntityDialog
          title="Tạo phòng ban mới"
          description="Chọn thư mục nếu muốn phòng ban nằm trong một folder. Bỏ trống để nằm ở root."
          open={createDepartmentOpen}
          folders={folders}
          form={departmentForm}
          onOpenChange={setCreateDepartmentOpen}
          onFormChange={setDepartmentForm}
          onSubmit={() => createEntity('department')}
          isSubmitting={creatingEntityType === 'department'}
        />

        <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tao thu muc</DialogTitle>
              <DialogDescription>Dat ten folder de gom du an va phong ban trong sidebar.</DialogDescription>
            </DialogHeader>
            <label className="space-y-2">
              <Label>Ten thu muc</Label>
              <Input
                value={folderName}
                onChange={(event) => setFolderName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void createFolder();
                }}
                placeholder="VD: Du an noi bo"
              />
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateFolderOpen(false)}>Huy</Button>
              <Button type="button" disabled={!folderName.trim() || isCreatingFolder} onClick={() => void createFolder()}>
                Tao thu muc
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-emerald-600"
        >
          {sidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </aside>
    </TooltipProvider>
  );
}
