import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User } from '@/types';
import UserActionDropdown from './UserActionDropdown';

interface MemberRowProps {
  user: User;
  canManage: boolean;
  onRemove: (user: User) => void;
}

export default function MemberRow({ user, canManage, onRemove }: MemberRowProps) {
  return (
    <div className="grid grid-cols-[34px_minmax(0,1fr)_32px] items-center gap-3 py-3">
      <Avatar className="h-8 w-8">
        <AvatarImage src={user.avatar} />
        <AvatarFallback className="bg-slate-100 text-[10px] font-bold text-slate-600">
          {user.full_name?.[0] || user.email[0] || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-extrabold text-slate-950">{user.full_name || user.email}</p>
        <p className="truncate text-[12px] font-medium text-slate-500">
          {user.position_title || user.role || 'Thanh vien'}
        </p>
        <p className="truncate text-[12px] text-slate-500">
          {user.email}{user.company_email ? ` - ${user.company_email}` : ''}
        </p>
      </div>
      <UserActionDropdown user={user} canManage={canManage} onRemove={onRemove} />
    </div>
  );
}
