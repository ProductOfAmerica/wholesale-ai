'use client';

import type { DailyTask, DailyTaskType } from '@wholesale-ai/shared';
import { CheckCircle2, Circle, FileText, Phone, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TaskListProps {
  initialTasks: DailyTask[];
}

const taskTypeConfig: Record<
  DailyTaskType,
  { icon: typeof Phone; color: string }
> = {
  call: { icon: Phone, color: 'text-green-500' },
  follow_up: { icon: RefreshCw, color: 'text-blue-500' },
  review: { icon: FileText, color: 'text-purple-500' },
  other: { icon: Circle, color: 'text-slate-400' },
};

export function TaskList({ initialTasks }: TaskListProps) {
  const [tasks, setTasks] = useState(initialTasks);

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Today&apos;s Tasks</span>
          <span className="text-sm font-normal text-muted-foreground">
            {completedCount}/{tasks.length} done
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task) => {
            const config = taskTypeConfig[task.type];
            const Icon = config.icon;
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => toggleTask(task.id)}
                className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-slate-50 ${
                  task.completed ? 'opacity-60' : ''
                }`}
              >
                {task.completed ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 text-slate-300" />
                )}
                <div className="flex-1">
                  <div
                    className={`font-medium ${task.completed ? 'line-through' : ''}`}
                  >
                    {task.title}
                  </div>
                  {task.description && (
                    <div className="text-sm text-muted-foreground">
                      {task.description}
                    </div>
                  )}
                </div>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
