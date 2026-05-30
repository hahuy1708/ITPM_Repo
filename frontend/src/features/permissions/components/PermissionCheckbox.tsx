import { Checkbox } from '@/components/ui/checkbox';

interface PermissionCheckboxProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export default function PermissionCheckbox({ checked, disabled, onChange }: PermissionCheckboxProps) {
  return (
    <Checkbox
      checked={checked}
      disabled={disabled}
      onCheckedChange={(value) => onChange(value === true)}
      className="h-4 w-4 data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-500 disabled:data-[state=checked]:border-slate-300 disabled:data-[state=checked]:bg-slate-400"
    />
  );
}
