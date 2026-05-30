import GanttChart from './GanttChart';
import type { Task, User } from '@/types';

interface GanttViewProps {
  projectId: string;
  tasks: Task[];
  users: User[];
  onTaskUpdated?: (task: Task) => void;
}

export default function GanttView(props: GanttViewProps) {
  return <GanttChart {...props} />;
}
