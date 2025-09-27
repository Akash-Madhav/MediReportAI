import { OverviewCards } from "@/components/dashboard/overview-cards";
import { HealthMetricsChart } from "@/components/dashboard/health-metrics-chart";
import { Reminders } from "@/components/dashboard/reminders";
import { RecentUploads } from "@/components/dashboard/recent-uploads";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Welcome back, Jane!
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s a summary of your health dashboard.
        </p>
      </div>

      <OverviewCards />

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
            <HealthMetricsChart />
        </div>
        <div className="lg:col-span-3">
          <div className="grid gap-8">
            <Reminders />
            <RecentUploads />
          </div>
        </div>
      </div>
    </div>
  );
}
