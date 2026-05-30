import { ChevronRight, Download, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EmployeeProgressBar from './EmployeeProgressBar';
import type { EmployeeAnalyticsRow } from '@/features/analytics/api/analytics.api';

export type EmployeeSortKey = 'total' | 'overdue' | 'completion_rate';

interface EmployeePerformanceTableProps {
  rows: EmployeeAnalyticsRow[];
  search: string;
  sortKey: EmployeeSortKey;
  onSearchChange: (value: string) => void;
  onSortChange: (value: EmployeeSortKey) => void;
}

export default function EmployeePerformanceTable({
  rows,
  search,
  sortKey,
  onSearchChange,
  onSortChange,
}: EmployeePerformanceTableProps) {
  const exportCsv = () => {
    const headers = ['Nhan vien', 'Email', 'Tong so', 'HT dung han', 'Hoan thanh muon', 'Dang danh gia', 'Dang xu ly', 'Qua han', 'Du an'];
    const body = rows.map((row) => [
      row.full_name,
      row.email,
      row.total,
      row.done_on_time,
      row.done_late,
      row.review,
      row.in_progress,
      row.overdue,
      row.project_count,
    ]);
    const csv = [headers, ...body]
      .map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'itpm-nhan-vien.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="enterprise-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-[15px] font-extrabold text-slate-900">Nhan vien cua toi ({rows.length})</h2>
          <p className="mt-0.5 text-[12px] font-medium text-slate-500">Trang thai cong viec cua cac nhan su o tat ca cac du an.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={exportCsv} className="h-8 gap-1.5 bg-white text-[12px]">
            <Download className="h-3.5 w-3.5" />
            Xuat Excel
          </Button>
          <Select value={sortKey} onValueChange={(value) => onSortChange(value as EmployeeSortKey)}>
            <SelectTrigger className="h-8 w-44 bg-white text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="total">Sap xep theo: Tong so</SelectItem>
              <SelectItem value="overdue">Sap xep theo: Qua han</SelectItem>
              <SelectItem value="completion_rate">Sap xep theo: Ti le HT</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Tim kiem theo nhan vien"
              className="h-8 w-56 border-slate-200 pl-8 text-[12px]"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {['Nhan vien', 'Ti le hoan thanh', 'Tong so', 'HT dung han', 'Hoan thanh muon', 'Dang danh gia', 'Dang xu ly', 'Qua han', 'Du an', ''].map((label) => (
                <th key={label || 'action'} className="px-4 py-2.5 text-[11px] font-extrabold text-slate-500">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.user_id} className="transition hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={row.avatar} />
                      <AvatarFallback className="bg-slate-100 text-[10px] font-bold text-slate-600">{row.full_name[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold text-slate-900">{row.full_name}</p>
                      <p className="truncate text-[11px] text-slate-500">{row.position_title || row.role || row.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <EmployeeProgressBar
                    doneOnTime={row.done_on_time}
                    doneLate={row.done_late}
                    review={row.review}
                    inProgress={row.in_progress}
                    overdue={row.overdue}
                    total={row.total}
                  />
                </td>
                <td className="px-4 py-3 text-[12px] font-extrabold text-slate-800">{row.total}</td>
                <td className="px-4 py-3 text-[12px] font-extrabold text-emerald-600">{row.done_on_time}</td>
                <td className="px-4 py-3 text-[12px] font-extrabold text-amber-500">{row.done_late}</td>
                <td className="px-4 py-3 text-[12px] font-extrabold text-violet-600">{row.review}</td>
                <td className="px-4 py-3 text-[12px] font-extrabold text-sky-600">{row.in_progress}</td>
                <td className="px-4 py-3 text-[12px] font-extrabold text-red-500">{row.overdue}</td>
                <td className="px-4 py-3 text-[12px] font-bold text-slate-600">{row.project_count}</td>
                <td className="px-4 py-3 text-right"><ChevronRight className="ml-auto h-4 w-4 text-slate-300" /></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="py-16 text-center text-[13px] font-medium text-slate-400">Chua co du lieu nhan vien phu hop.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
