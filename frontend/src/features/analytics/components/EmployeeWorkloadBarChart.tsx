import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { EmployeeAnalyticsRow } from '@/features/analytics/api/analytics.api';

interface EmployeeWorkloadBarChartProps {
  rows: EmployeeAnalyticsRow[];
}

export default function EmployeeWorkloadBarChart({ rows }: EmployeeWorkloadBarChartProps) {
  const data = rows.map((row) => ({
    name: row.full_name,
    projects: row.project_count,
  }));

  return (
    <section className="enterprise-panel p-4">
      <h2 className="text-[13px] font-extrabold text-slate-900">Phan bo du an theo nhan vien</h2>
      <div className="mt-3 h-[220px]">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[13px] font-medium text-slate-400">Chua co du lieu.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} label={{ value: 'So luong du an', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="projects" fill="#76ace6" radius={[2, 2, 0, 0]} maxBarSize={92} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
