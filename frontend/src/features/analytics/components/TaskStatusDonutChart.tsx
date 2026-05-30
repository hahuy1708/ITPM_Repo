import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { EmployeeAnalyticsResponse } from '@/features/analytics/api/analytics.api';

interface TaskStatusDonutChartProps {
  totals: EmployeeAnalyticsResponse['totals'];
}

const statusItems = [
  { key: 'done_on_time', label: 'HT dung han', color: '#22c55e' },
  { key: 'done_late', label: 'Hoan thanh muon', color: '#facc15' },
  { key: 'review', label: 'Dang danh gia', color: '#7c3aed' },
  { key: 'in_progress', label: 'Dang xu ly', color: '#0ea5e9' },
  { key: 'overdue', label: 'Qua han', color: '#ef4444' },
] as const;

export default function TaskStatusDonutChart({ totals }: TaskStatusDonutChartProps) {
  const data = statusItems.map((item) => ({
    ...item,
    value: totals[item.key],
  }));

  return (
    <section className="enterprise-panel p-4">
      <h2 className="text-[13px] font-extrabold text-slate-900">Trang thai cong viec</h2>
      <div className="mt-3 grid h-[220px] grid-cols-[minmax(0,1fr)_190px] items-center gap-4">
        <div className="relative h-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <PieChart>
              <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={58} outerRadius={86} strokeWidth={0}>
                {data.map((entry) => <Cell key={entry.key} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-[28px] font-semibold text-slate-950">{totals.total}</span>
          </div>
        </div>
        <div className="space-y-2">
          {data.map((item) => (
            <div key={item.key} className="flex items-center gap-2 text-[12px] font-semibold text-slate-700">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="min-w-0 flex-1 truncate">{item.value} {item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
