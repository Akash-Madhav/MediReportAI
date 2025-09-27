'use client';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { mockHealthMetrics } from '@/lib/data';
import { format } from 'date-fns';

const chartData = mockHealthMetrics
  .filter(m => m.metricType === 'Cholesterol')
  .map(m => ({
    date: format(new Date(m.timestamp), 'MMM yy'),
    value: m.value
  }));

export function HealthMetricsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Metrics Over Time</CardTitle>
        <CardDescription>Total Cholesterol (mg/dL)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
              domain={['dataMin - 20', 'dataMax + 10']}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Legend iconType="circle" />
            <Bar dataKey="value" name="Cholesterol" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
