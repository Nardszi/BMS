import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in duration-500">
      <div className="rounded-2xl bg-gray-100 dark:bg-gray-800 p-5 mb-4">
        <Icon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
      </div>
      <p className="text-gray-600 dark:text-gray-300 font-medium text-base">{title}</p>
      {description && <p className="text-sm text-gray-400 dark:text-gray-500 mt-1.5 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
