import { useMemo, useRef, useState } from 'react';
import { UserRound, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { User } from '@/types';
import UserSearchDropdown from './UserSearchDropdown';

interface AssigneeSelectProps {
  users: User[];
  value: string;
  onChange: (userId: string) => void;
  disabled?: boolean;
}

const getUserId = (user: User) => user._id || user.id || '';

export default function AssigneeSelect({ users, value, onChange, disabled }: AssigneeSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectedUser = useMemo(() => users.find((user) => getUserId(user) === value), [users, value]);

  return (
    <div ref={rootRef} className="relative">
      {selectedUser ? (
        <div className="flex min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={selectedUser.avatar} />
            <AvatarFallback className="bg-emerald-100 text-[9px] font-bold text-emerald-700">
              {selectedUser.full_name?.[0] || selectedUser.email[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen(true)}
            className="min-w-0 flex-1 truncate text-left text-[13px] font-semibold text-slate-800 disabled:cursor-not-allowed"
          >
            {selectedUser.full_name || selectedUser.email}
          </button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="h-6 w-6 text-slate-400 hover:text-red-600"
            onClick={() => onChange('none')}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(true)}
          className={cn(
            'flex h-9 w-full items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-left text-[13px] font-medium text-slate-500 transition hover:border-emerald-300',
            disabled && 'cursor-not-allowed opacity-60'
          )}
        >
          <UserRound className="h-3.5 w-3.5 text-slate-400" />
          Chon nguoi phu trach
        </button>
      )}

      {open && (
        <>
          <button
            type="button"
            aria-label="Close assignee picker"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-50">
            <UserSearchDropdown
              users={users}
              query={query}
              selectedUserId={selectedUser ? getUserId(selectedUser) : undefined}
              onQueryChange={setQuery}
              onSelect={(user) => {
                onChange(getUserId(user));
                setOpen(false);
                setQuery('');
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
