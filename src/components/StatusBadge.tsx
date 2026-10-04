import React from 'react';
import type { SubmissionStatus } from '../types';

interface StatusBadgeProps {
  status: SubmissionStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const styles = {
    TODO: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 ring-amber-500/20',
    WAITING: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800 ring-blue-500/20',
    APPROVED: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 ring-emerald-500/20',
    REJECTED: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 ring-rose-500/20',
  };

  const labels: Record<SubmissionStatus, string> = {
    TODO: 'TODO',
    WAITING: 'WAITING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      data-testid={`status-badge-${status.toLowerCase()}`}
      className={`inline-flex items-center font-semibold rounded-full border ring-1 ring-inset ${styles[status]} ${sizeClasses}`}
    >
      <span
        className={`w-1.5 h-1.5 mr-1.5 rounded-full ${
          status === 'TODO'
            ? 'bg-amber-500'
            : status === 'WAITING'
            ? 'bg-blue-500'
            : status === 'APPROVED'
            ? 'bg-emerald-500'
            : 'bg-rose-500'
        }`}
      />
      {labels[status]}
    </span>
  );
};
