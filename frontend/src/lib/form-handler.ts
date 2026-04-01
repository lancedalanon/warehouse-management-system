import type { ServerValidationError } from '@/types/server-validation-errors.types';
import type { FieldValues, UseFormSetError, Path } from 'react-hook-form';

export function applyServerValidationErrors<T extends FieldValues>(
  errors: ServerValidationError[],
  setError: UseFormSetError<T>,
) {
  const mergedErrors: Record<string, string[]> = {};

  errors.forEach(({ field, message }) => {
    if (!mergedErrors[field]) mergedErrors[field] = [];
    mergedErrors[field].push(message);
  });

  Object.entries(mergedErrors).forEach(([field, messages]) => {
    setError(field as Path<T>, {
      type: 'server',
      message: messages.join('\n'),
    });
  });
}
