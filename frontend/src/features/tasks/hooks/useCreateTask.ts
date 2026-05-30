import { useRef, useState } from 'react';
import { taskService } from '@/features/tasks/api/task.api';
import { createTaskValidationSchema, type CreateTaskFormValues } from '@/features/tasks/validation/task.validation';
import type { Attachment } from '@/types';

export function useCreateTask(token?: string | null) {
  const inFlightRef = useRef(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const createTask = async (
    values: CreateTaskFormValues,
    attachments: Attachment[] = [],
    dependencyIds: string[] = []
  ) => {
    if (!token) throw new Error('Missing auth token');
    if (inFlightRef.current) return null;

    const validationErrors = createTaskValidationSchema.validate(values);
    if (validationErrors.length > 0) {
      const message = validationErrors[0];
      setError(message);
      throw new Error(message);
    }

    try {
      inFlightRef.current = true;
      setIsCreating(true);
      setError('');
      return await taskService.createTask(
        createTaskValidationSchema.toPayload(values, attachments, dependencyIds),
        token
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Khong tao duoc cong viec';
      setError(message);
      throw err;
    } finally {
      inFlightRef.current = false;
      setIsCreating(false);
    }
  };

  return {
    createTask,
    error,
    isCreating,
    setError,
  };
}
