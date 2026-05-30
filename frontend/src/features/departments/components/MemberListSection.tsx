import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';
import MemberRow from './MemberRow';

interface MemberListSectionProps {
  title: string;
  users: User[];
  addLabel: string;
  canManage: boolean;
  onAdd: () => void;
  onRemove: (user: User) => void;
}

export default function MemberListSection({
  title,
  users,
  addLabel,
  canManage,
  onAdd,
  onRemove,
}: MemberListSectionProps) {
  return (
    <section className="border-b border-slate-200 px-10 py-6 last:border-b-0">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-[16px] font-semibold text-slate-800">{title}</h2>
        {canManage && (
          <button type="button" onClick={onAdd} className="text-[13px] font-bold text-blue-600 hover:underline">
            Them nhieu
          </button>
        )}
      </div>

      <div className="max-w-[760px] divide-y divide-slate-100">
        {users.map((user) => (
          <MemberRow key={user._id || user.id} user={user} canManage={canManage} onRemove={onRemove} />
        ))}
        {users.length === 0 && (
          <div className="rounded-md border border-dashed border-slate-200 px-4 py-8 text-center text-[13px] font-medium text-slate-400">
            Chua co du lieu.
          </div>
        )}
      </div>

      {canManage && (
        <Button type="button" variant="ghost" onClick={onAdd} className="mt-4 h-9 gap-2 px-0 text-[13px] font-semibold text-blue-600 hover:bg-transparent hover:text-blue-700">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-400">
            <Plus className="h-4 w-4" />
          </span>
          {addLabel}
        </Button>
      )}
    </section>
  );
}
