'use client';

import type {
  DailyTask,
  DashboardStats,
  HeatAlert,
  PipelineStage,
} from '@wholesale-ai/shared';
import { useEffect, useState } from 'react';
import {
  HeatAlerts,
  PipelineChart,
  StatsCard,
  TaskList,
} from '@/components/dashboard';
import { AppLayout } from '@/components/layout';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pipeline, setPipeline] = useState<PipelineStage[]>([]);
  const [alerts, setAlerts] = useState<HeatAlert[]>([]);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, pipelineRes, alertsRes, tasksRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/pipeline'),
          fetch('/api/dashboard/alerts'),
          fetch('/api/dashboard/tasks'),
        ]);

        const [statsData, pipelineData, alertsData, tasksData] =
          await Promise.all([
            statsRes.json(),
            pipelineRes.json(),
            alertsRes.json(),
            tasksRes.json(),
          ]);

        setStats(statsData);
        setPipeline(pipelineData);
        setAlerts(alertsData);
        setTasks(tasksData);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <AppLayout title="Dashboard">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-80 lg:col-span-2" />
            <Skeleton className="h-80" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard
            title="Leads This Week"
            value={stats?.leadsThisWeek ?? 0}
            change={stats?.leadsChange ?? 0}
          />
          <StatsCard
            title="Calls Today"
            value={stats?.callsToday ?? 0}
            change={stats?.callsChange ?? 0}
          />
          <StatsCard
            title="Deals in Pipeline"
            value={stats?.dealsInPipeline ?? 0}
            change={stats?.dealsChange ?? 0}
          />
          <StatsCard
            title="Revenue This Month"
            value={stats?.revenueThisMonth ?? 0}
            change={stats?.revenueChange ?? 0}
            format="currency"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PipelineChart stages={pipeline} />
          </div>
          <HeatAlerts alerts={alerts} />
        </div>

        <TaskList initialTasks={tasks} />
      </div>
    </AppLayout>
  );
}
