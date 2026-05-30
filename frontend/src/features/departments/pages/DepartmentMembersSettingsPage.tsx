import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { departmentService } from '@/features/departments/api/department.api';
import { userService } from '@/features/users/api/user.api';
import SettingsSideMenu from '@/features/settings/components/SettingsSideMenu';
import AddMembersModal from '@/features/departments/components/AddMembersModal';
import MemberListSection from '@/features/departments/components/MemberListSection';
import type { Department, User } from '@/types';

const getEntityId = (value?: string | { _id?: string; id?: string }) => (
  typeof value === 'string' ? value : value?._id || value?.id || ''
);

const asUser = (value?: string | User): User | null => (
  typeof value === 'object' && value ? value : null
);

export default function DepartmentMembersSettingsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [department, setDepartment] = useState<Department | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [modalMode, setModalMode] = useState<'manager' | 'member' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    if (!token || !id) return;
    try {
      setIsLoading(true);
      setError('');
      const [departmentResponse, userResponse] = await Promise.all([
        departmentService.getDepartment(id, token),
        userService.getUsers(token),
      ]);
      setDepartment(departmentResponse.data || null);
      setUsers(userResponse.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong tai duoc thanh vien phong ban');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [token, id]);

  const manager = useMemo(() => asUser(department?.manager_id || department?.managerId), [department]);
  const managerId = getEntityId(department?.manager_id || department?.managerId);
  const memberUsers = useMemo(() => (
    (department?.member_ids || [])
      .map(asUser)
      .filter((member): member is User => Boolean(member))
      .filter((member) => getEntityId(member) !== managerId)
  ), [department, managerId]);
  const currentUserId = user?._id || user?.id || '';
  const canManage = user?.role === 'admin' || (user?.role === 'manager' && managerId === currentUserId);
  const existingIds = useMemo(() => new Set([
    managerId,
    ...memberUsers.map(getEntityId),
  ].filter(Boolean)), [managerId, memberUsers]);

  const handleAdd = async (userIds: string[]) => {
    if (!token || !department || userIds.length === 0) return;
    try {
      setIsSaving(true);
      setError('');
      if (modalMode === 'manager') {
        if (user?.role !== 'admin') throw new Error('Chi admin duoc doi quan ly phong ban.');
        const response = await departmentService.updateDepartment(id, { managerId: userIds[0] }, token);
        if (response.data) setDepartment(response.data);
      } else {
        const response = await departmentService.addMembers(id, userIds, token);
        if (response.data) setDepartment(response.data);
      }
      setModalMode(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong cap nhat duoc thanh vien');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (targetUser: User) => {
    if (!token || !canManage) return;
    const targetId = getEntityId(targetUser);
    if (targetId === managerId) {
      setError('Khong the xoa quan ly phong ban. Hay chi dinh quan ly khac truoc.');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      const response = await departmentService.removeMember(id, targetId, token);
      if (response.data) setDepartment(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong xoa duoc thanh vien');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-101px)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <SettingsSideMenu
        activeItem="members"
        onSelect={(item) => {
          if (item === 'permissions') navigate(`/departments/${id}/settings/permissions`);
          if (item === 'members') navigate(`/departments/${id}/settings/members`);
        }}
      />

      <main className="flex-1 overflow-auto bg-white">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
          </div>
        ) : (
          <>
            <div className="border-b border-slate-200 px-10 py-5">
              <h1 className="text-[18px] font-semibold text-slate-900">Quan ly phong ban</h1>
              <p className="mt-1 text-[12px] font-medium text-slate-500">{department?.name || 'Phong ban'} - phan tach quan ly va thanh vien thuong.</p>
              {error && <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] font-medium text-red-700">{error}</div>}
            </div>

            <MemberListSection
              title="Quan ly phong ban"
              users={manager ? [manager] : []}
              addLabel="Them Quan ly phong ban"
              canManage={canManage}
              onAdd={() => setModalMode('manager')}
              onRemove={handleRemove}
            />
            <MemberListSection
              title="Thanh vien"
              users={memberUsers}
              addLabel="Them Thanh vien"
              canManage={canManage}
              onAdd={() => setModalMode('member')}
              onRemove={handleRemove}
            />
          </>
        )}
      </main>

      <AddMembersModal
        open={Boolean(modalMode)}
        users={users}
        existingUserIds={existingIds}
        title={modalMode === 'manager' ? 'Them Quan ly phong ban' : 'Them Thanh vien'}
        isSaving={isSaving}
        onClose={() => setModalMode(null)}
        onSubmit={handleAdd}
      />
    </div>
  );
}
