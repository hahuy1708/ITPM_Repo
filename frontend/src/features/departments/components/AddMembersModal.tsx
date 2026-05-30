import { useMemo, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { User } from '@/types';

interface AddMembersModalProps {
  open: boolean;
  users: User[];
  existingUserIds: Set<string>;
  title: string;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (userIds: string[]) => void;
}

const getUserId = (user: User) => user._id || user.id || '';

export default function AddMembersModal({
  open,
  users,
  existingUserIds,
  title,
  isSaving,
  onClose,
  onSubmit,
}: AddMembersModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const availableUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return users.filter((user) => {
      const id = getUserId(user);
      return !existingUserIds.has(id)
        && (!keyword || user.full_name.toLowerCase().includes(keyword) || user.email.toLowerCase().includes(keyword));
    });
  }, [users, existingUserIds, query]);

  const toggle = (userId: string, checked: boolean) => {
    setSelectedIds((current) => checked ? [...new Set([...current, userId])] : current.filter((id) => id !== userId));
  };

  const handleClose = () => {
    setSelectedIds([]);
    setQuery('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tim theo ten hoac email" className="pl-9" />
        </div>
        <div className="max-h-80 overflow-y-auto rounded-md border border-slate-200">
          {availableUsers.map((user) => {
            const userId = getUserId(user);
            return (
              <label key={userId} className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-2.5 last:border-b-0 hover:bg-slate-50">
                <Checkbox checked={selectedIds.includes(userId)} onCheckedChange={(checked) => toggle(userId, checked === true)} />
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-slate-100 text-[10px] font-bold">{user.full_name?.[0] || user.email[0]}</AvatarFallback>
                </Avatar>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-bold text-slate-900">{user.full_name || user.email}</span>
                  <span className="block truncate text-[12px] text-slate-500">{user.position_title || user.email}</span>
                </span>
              </label>
            );
          })}
          {availableUsers.length === 0 && (
            <div className="px-4 py-10 text-center text-[13px] font-medium text-slate-400">Khong co nhan su phu hop.</div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>Dong</Button>
          <Button type="button" disabled={selectedIds.length === 0 || isSaving} onClick={() => onSubmit(selectedIds)}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : `Them ${selectedIds.length || ''} nguoi`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
