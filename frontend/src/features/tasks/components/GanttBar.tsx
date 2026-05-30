import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface GanttBarProps extends HTMLAttributes<HTMLDivElement> {
  color: string;
  left: number;
  width: number;
}

export default function GanttBar({ color, left, width, className, style, ...props }: GanttBarProps) {
  return (
    <div
      className={cn('absolute h-7 rounded px-2 text-[10px] font-extrabold text-white shadow-sm', className)}
      style={{ left, width, backgroundColor: color, ...style }}
      {...props}
    />
  );
}
