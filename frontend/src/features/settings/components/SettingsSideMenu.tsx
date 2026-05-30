import { Bell, FileClock, History, Image, KeyRound, Mail, Pencil, Users, Webhook } from 'lucide-react';
import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';

export interface SettingsMenuItem {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
}

interface SettingsSideMenuProps {
  activeItem: string;
  onSelect?: (itemId: string) => void;
}

const menuItems: SettingsMenuItem[] = [
  { id: 'edit', label: 'Chinh sua phong ban', icon: Pencil },
  { id: 'members', label: 'Quan ly thanh vien', icon: Users },
  { id: 'permissions', label: 'Phan quyen su dung', icon: KeyRound },
  { id: 'fields', label: 'Truong du lieu tuy chinh', icon: Bell },
  { id: 'email', label: 'Email thong bao', icon: Mail },
  { id: 'background', label: 'Tuy chinh hinh nen', icon: Image },
  { id: 'recurring', label: 'CV lap lai', icon: FileClock },
  { id: 'webhook-history', label: 'Lich su webhook', icon: Webhook },
  { id: 'webhook-traces', label: 'Webhook traces', icon: Webhook },
  { id: 'history', label: 'Lich su chinh sua', icon: History },
];

const quickActions = [
  'Xuat CV ra file excel',
  'Nhap CV tu file excel',
  'Cap nhat truong tuy chinh ...',
  'Cap nhat thoi gian cua CV ...',
  'Nhap du lieu mau',
  'Xuat cac truong tuy chinh ...',
  'Xuat CV voi du lieu dang b...',
];

export default function SettingsSideMenu({ activeItem, onSelect }: SettingsSideMenuProps) {
  return (
    <aside className="w-[250px] shrink-0 border-r border-slate-200 bg-slate-50">
      <div className="border-b border-slate-200 px-4 py-4">
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">Tuy chinh</p>
      </div>
      <div className="space-y-1 p-3">
        {menuItems.map((item) => {
          const Icon = item.icon || Pencil;
          const active = activeItem === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect?.(item.id)}
              className={cn(
                'flex h-8 w-full items-center gap-2 rounded px-2.5 text-left text-[13px] font-semibold transition',
                active ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-white hover:text-slate-900'
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 border-t border-slate-200 px-4 py-4">
        <p className="mb-3 text-[11px] font-extrabold uppercase tracking-wide text-slate-400">Thao tac nhanh</p>
        <div className="space-y-1.5">
          {quickActions.map((action) => (
            <button key={action} type="button" disabled className="block w-full cursor-not-allowed truncate rounded px-1 py-1 text-left text-[12px] font-medium text-slate-400 opacity-70">
              {action}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
