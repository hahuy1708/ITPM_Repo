interface EmployeeProgressBarProps {
  doneOnTime: number;
  doneLate: number;
  review: number;
  inProgress: number;
  overdue: number;
  total: number;
}

const segments = [
  { key: 'doneOnTime', color: '#22c55e' },
  { key: 'doneLate', color: '#f59e0b' },
  { key: 'review', color: '#7c3aed' },
  { key: 'inProgress', color: '#0ea5e9' },
  { key: 'overdue', color: '#ef4444' },
] as const;

export default function EmployeeProgressBar({
  doneOnTime,
  doneLate,
  review,
  inProgress,
  overdue,
  total,
}: EmployeeProgressBarProps) {
  const values = { doneOnTime, doneLate, review, inProgress, overdue };

  return (
    <div className="h-2.5 w-full min-w-[160px] overflow-hidden rounded-full bg-slate-100">
      {segments.map((segment) => {
        const width = total ? (values[segment.key] / total) * 100 : 0;
        if (width <= 0) return null;
        return (
          <span
            key={segment.key}
            className="inline-block h-full align-top"
            style={{ width: `${width}%`, backgroundColor: segment.color }}
          />
        );
      })}
    </div>
  );
}
