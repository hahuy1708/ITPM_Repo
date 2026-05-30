import { useEffect, useMemo, useState } from 'react';
import { Loader2, UsersRound } from 'lucide-react';
import { analyticsService, type AnalyticsParams } from '@/features/analytics/api/analytics.api';
import EmployeePerformanceTable, { type EmployeeSortKey } from '@/features/analytics/components/EmployeePerformanceTable';
import EmployeeWorkloadBarChart from '@/features/analytics/components/EmployeeWorkloadBarChart';
import TaskStatusDonutChart from '@/features/analytics/components/TaskStatusDonutChart';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { EmployeeAnalyticsResponse } from '@/features/analytics/api/analytics.api';
import type { Project } from '@/types';

const toDateInput = (date: Date) => date.toISOString().slice(0, 10);
const getProjectId = (project: Project) => project._id || project.id || '';

export default function MyEmployeesDashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState<EmployeeAnalyticsResponse>({
    rows: [],
    totals: { total: 0, done_on_time: 0, done_late: 0, review: 0, in_progress: 0, overdue: 0 },
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('all');
  const [dateField, setDateField] = useState<AnalyticsParams['dateField']>('createdAt');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    return toDateInput(new Date(date.getFullYear(), date.getMonth(), 1));
  });
  const [endDate, setEndDate] = useState(() => toDateInput(new Date()));
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<EmployeeSortKey>('total');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    let active = true;

    const load = async () => {
      try {
        setIsLoading(true);
        setError('');
        const [employeeData, projectData] = await Promise.all([
          analyticsService.getEmployees(token, {
            range: 'month',
            projectId,
            startDate,
            endDate,
            dateField,
          }),
          analyticsService.getProjects(token),
        ]);
        if (!active) return;
        setData(employeeData);
        setProjects(projectData);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Khong tai duoc dashboard nhan vien');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [token, projectId, startDate, endDate, dateField]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return data.rows
      .filter((row) => !keyword || row.full_name.toLowerCase().includes(keyword) || row.email.toLowerCase().includes(keyword))
      .sort((left, right) => {
        if (sortKey === 'completion_rate') return right.completion_rate - left.completion_rate;
        if (sortKey === 'overdue') return right.overdue - left.overdue;
        return right.total - left.total;
      });
  }, [data.rows, search, sortKey]);

  return (
    <div className="flex h-[calc(100vh-101px)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex-shrink-0 border-b border-slate-200 bg-white px-5 pt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <UsersRound className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-[18px] font-extrabold text-slate-950">Nhan vien cua toi</h1>
              <div className="mt-1 flex gap-5 text-[12px] font-bold text-slate-400">
                <span className="border-b-2 border-blue-600 pb-2 text-blue-600">TONG QUAN</span>
                <span>DANH SACH</span>
                <span>TIEN TRINH</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-8 w-36 text-[12px]" />
            <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-8 w-36 text-[12px]" />
            <Select value={dateField} onValueChange={(value) => setDateField(value as AnalyticsParams['dateField'])}>
              <SelectTrigger className="h-8 w-36 bg-white text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Ngay tao</SelectItem>
                <SelectItem value="updatedAt">Cap nhat</SelectItem>
                <SelectItem value="due_date">Deadline</SelectItem>
              </SelectContent>
            </Select>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="h-8 w-44 bg-white text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tat ca du an</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={getProjectId(project)} value={getProjectId(project)}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white p-4">
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] font-medium text-red-700">{error}</div>
        )}
        {isLoading ? (
          <div className="flex h-80 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(420px,40%)]">
              <EmployeeWorkloadBarChart rows={filteredRows} />
              <TaskStatusDonutChart totals={data.totals} />
            </div>

            <EmployeePerformanceTable
              rows={filteredRows}
              search={search}
              sortKey={sortKey}
              onSearchChange={setSearch}
              onSortChange={setSortKey}
            />
          </div>
        )}
      </div>
    </div>
  );
}
