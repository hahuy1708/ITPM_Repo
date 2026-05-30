import { Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

interface UserSearchDropdownProps {
  users: User[];
  query: string;
  selectedUserId?: string;
  onQueryChange: (value: string) => void;
  onSelect: (user: User) => void;
}

const getUserId = (user: User) => user._id || user.id || '';

export default function UserSearchDropdown({
  users,
  query,
  selectedUserId,
  onQueryChange,
  onSelect,
}: UserSearchDropdownProps) {
  const keyword = query.trim().toLowerCase();
  const filteredUsers = users.filter((user) => (
    !keyword
    || user.full_name.toLowerCase().includes(keyword)
    || user.email.toLowerCase().includes(keyword)
    || (user.position_title || '').toLowerCase().includes(keyword)
  ));

  return (
    <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-[320px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
      <div className="border-b border-slate-100 p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            autoFocus
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Tim nguoi nhan viec"
            className="h-8 border-slate-200 pl-8 text-[12px]"
          />
        </div>
      </div>
      <div className="max-h-72 overflow-y-auto py-1">
        {filteredUsers.map((user) => {
          const userId = getUserId(user);
          return (
            <button
              key={userId}
              type="button"
              onClick={() => onSelect(user)}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-slate-50',
                selectedUserId === userId && 'bg-emerald-50'
              )}
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-slate-100 text-[10px] font-bold text-slate-600">
                  {user.full_name?.[0] || user.email[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-bold text-slate-800">{user.full_name || user.email}</span>
                <span className="block truncate text-[11px] text-slate-500">{user.position_title || user.role || user.email}</span>
              </span>
            </button>
          );
        })}
        {filteredUsers.length === 0 && (
          <div className="px-3 py-6 text-center text-[12px] font-medium text-slate-400">
            Khong tim thay nhan su.
          </div>
        )}
      </div>
    </div>
  );
}
