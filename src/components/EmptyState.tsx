import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description, 
  icon, 
  actionText, 
  onAction 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-premium">
      {icon && (
        <div className="w-16 h-16 mb-4 flex items-center justify-center bg-secondary-50 dark:bg-slate-800 rounded-full text-secondary-500 dark:text-slate-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-secondary-500 dark:text-slate-400 max-w-sm mb-6">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-premium transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
