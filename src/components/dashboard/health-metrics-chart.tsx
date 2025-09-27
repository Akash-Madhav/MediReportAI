'use client';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';
import { ref, query, orderByChild, equalTo, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { Report } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

export function HealthMetricsChart() {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<{ date: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const reportsRef = ref(db, 'reports');
    const userReportsQuery = query(reportsRef, orderByChild('patientId'), equalTo(user.uid));

    const unsubscribe = onValue(userReportsQuery, (snapshot) => {
      const data = snapshot.val();
      const metrics: { date: string; value: number }[] = [];
      if (data) {
        Object.keys(data).forEach((key) => {
          const report: Report = { id: key, ...data[key] };
          const cholesterol = report.extractedValues.find(
            (v) => v.test.toLowerCase().includes('total cholesterol')
          );
          if (cholesterol && typeof cholesterol.value === 'number') {
            metrics.push({
              date: format(parseISO(report.uploadedAt), 'MMM yy'),
              value: cholesterol.value,
            });
          }
        });
      }
      // Sort by date chronologically
      metrics.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setChartData(metrics);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Metrics Over Time</CardTitle>
        <CardDescription>Total Cholesterol (mg/dL) from your reports</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="h-[350px] w-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
            </div>
        ) : chartData.length === 0 ? (
            <div className="h-[350px] w-full flex items-center justify-center text-muted-foreground">
                <p>No cholesterol data found in your reports yet.</p>
            </div>
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
}
