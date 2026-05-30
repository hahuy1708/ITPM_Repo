import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Loader2, Save } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import SettingsSideMenu from '@/features/settings/components/SettingsSideMenu';
import PermissionMatrix from '@/features/permissions/components/PermissionMatrix';
import { permissionService, type PermissionEntry, type PermissionMatrixResponse, type PermissionScopeType } from '@/features/permissions/api/permission.api';
import { TooltipProvider } from '@/components/ui/tooltip';

const importantPermissions = new Set([
  'assign_task_to_others',
  'edit_task_schedule',
  'edit_task_title',
  'view_workspace_reports',
]);

export default function PermissionSettingsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const scopeType: PermissionScopeType = location.pathname.startsWith('/projects') ? 'project' : 'department';
  const [matrix, setMatrix] = useState<PermissionMatrixResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    if (!token || !id) return;
    try {
      setIsLoading(true);
      setError('');
      setMatrix(await permissionService.getPermissions(scopeType, id, token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong tai duoc ma tran phan quyen');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [token, id, scopeType]);

  const handleChange = async (entry: PermissionEntry) => {
    if (!token || !matrix || entry.locked) return;
    if (importantPermissions.has(entry.permission_key)) {
      const confirmed = window.confirm('Day la quyen quan trong. Ban co chac muon thay doi?');
      if (!confirmed) return;
    }

    const nextEntries = matrix.entries.map((current) => (
      current.permission_key === entry.permission_key && current.role_key === entry.role_key
        ? { ...current, allowed: entry.allowed }
        : current
    ));

    setMatrix({ ...matrix, entries: nextEntries });
    try {
      setIsSaving(true);
      setError('');
      setSuccess('');
      const updated = await permissionService.updatePermissions(scopeType, id, nextEntries, token);
      setMatrix(updated);
      setSuccess('Da luu phan quyen');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong luu duoc phan quyen');
      void loadData();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-101px)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <SettingsSideMenu
        activeItem="permissions"
        onSelect={(item) => {
          if (item === 'permissions') navigate(`/${scopeType === 'project' ? 'projects' : 'departments'}/${id}/settings/permissions`);
          if (item === 'members') navigate(scopeType === 'project' ? `/projects/${id}` : `/departments/${id}/settings/members`);
        }}
      />
      <main className="flex-1 overflow-auto bg-white">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-10 py-5">
          <div>
            <h1 className="text-[18px] font-semibold text-slate-900">Phan quyen su dung</h1>
            <p className="mt-1 text-[12px] font-medium text-slate-500">Cau hinh quyen theo loai tai khoan va theo quan he voi task.</p>
          </div>
          <div className="flex items-center gap-2 text-[12px] font-bold text-slate-500">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />}
            {!isSaving && success && <Save className="h-4 w-4 text-emerald-600" />}
            {isSaving ? 'Dang luu...' : success || 'Luu tu dong'}
          </div>
        </div>

        <div className="px-10 py-7">
          {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] font-medium text-red-700">{error}</div>}
          {isLoading ? (
            <div className="flex h-80 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
            </div>
          ) : matrix ? (
            <TooltipProvider>
              <PermissionMatrix sections={matrix.sections} entries={matrix.entries} onChange={handleChange} />
            </TooltipProvider>
          ) : (
            <div className="py-20 text-center text-[13px] font-medium text-slate-400">Khong co du lieu phan quyen.</div>
          )}
        </div>
      </main>
    </div>
  );
}
