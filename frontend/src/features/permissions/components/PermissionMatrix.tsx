import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import PermissionCheckbox from './PermissionCheckbox';
import type { PermissionEntry } from '@/features/permissions/api/permission.api';
import type { PermissionSectionDefinition } from '@itpm/shared';

interface PermissionMatrixProps {
  sections: PermissionSectionDefinition[];
  entries: PermissionEntry[];
  onChange: (entry: PermissionEntry) => void;
}

const roleLabels: Record<string, string> = {
  manager: 'Quan ly',
  member: 'Thanh vien',
  guest: 'Khach',
  assignee: 'Nguoi giao-nhan viec',
  follower: 'Nguoi theo doi',
  other: 'Khac',
};

export default function PermissionMatrix({ sections, entries, onChange }: PermissionMatrixProps) {
  const entryMap = new Map(entries.map((entry) => [`${entry.role_key}:${entry.permission_key}`, entry]));

  return (
    <div className="space-y-10">
      {sections.map((section) => (
        <section key={section.key}>
          <h2 className="mb-5 text-[12px] font-extrabold uppercase text-emerald-600">{section.title}</h2>
          <div className="overflow-hidden rounded-md border border-slate-200">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-white">
                  <th className="px-4 py-3 text-[12px] font-semibold text-slate-500">Phan quyen</th>
                  {section.roleKeys.map((roleKey) => (
                    <th key={roleKey} className="w-36 px-4 py-3 text-center text-[12px] font-semibold text-slate-500">
                      {roleLabels[roleKey] || roleKey}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {section.permissions.map((permission) => (
                  <tr key={permission.key} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <div>
                          <p className="text-[13px] font-bold text-slate-800">{permission.label}</p>
                          <p className="mt-0.5 text-[11px] font-medium text-slate-400">{permission.description}</p>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />
                          </TooltipTrigger>
                          <TooltipContent>{permission.description}</TooltipContent>
                        </Tooltip>
                      </div>
                    </td>
                    {section.roleKeys.map((roleKey) => {
                      const entry = entryMap.get(`${roleKey}:${permission.key}`) || {
                        role_key: roleKey,
                        permission_key: permission.key,
                        allowed: false,
                      };
                      return (
                        <td key={`${roleKey}-${permission.key}`} className="px-4 py-3 text-center">
                          <PermissionCheckbox
                            checked={entry.allowed}
                            disabled={entry.locked}
                            onChange={(checked) => onChange({ ...entry, allowed: checked })}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
