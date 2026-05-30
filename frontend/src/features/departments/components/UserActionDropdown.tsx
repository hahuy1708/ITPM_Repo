import { MoreHorizontal, Shield, Trash2, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { User } from '@/types';

interface UserActionDropdownProps {
  user: User;
  canManage: boolean;
  onRemove: (user: User) => void;
}

export default function UserActionDropdown({ user, canManage, onRemove }: UserActionDropdownProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-1">
        <button type="button" disabled className="flex w-full cursor-not-allowed items-center gap-2 rounded px-2.5 py-2 text-left text-[13px] font-medium text-slate-400 opacity-70">
          <UserCircle className="h-4 w-4 text-slate-400" />
          Xem chi tiet
        </button>
        <button type="button" disabled className="flex w-full cursor-not-allowed items-center gap-2 rounded px-2.5 py-2 text-left text-[13px] font-medium text-slate-400 opacity-70">
          <Shield className="h-4 w-4 text-slate-400" />
          Chinh sua quyen
        </button>
        <button
          type="button"
          disabled={!canManage}
          onClick={() => onRemove(user)}
          className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-[13px] font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
          Xoa khoi phong ban
        </button>
      </PopoverContent>
    </Popover>
  );
}
