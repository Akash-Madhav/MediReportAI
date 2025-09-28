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
import { useState, useEffect, useMemo } from 'react';
import { ref, query, orderByChild, equalTo, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { Report } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface MetricDataPoint {
    date: string; // "MMM yy"
    value: number;
    [key: string]: any;
}

export function HealthMetricsChart() {
  const { user } = useAuth();
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<string>('');

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    // This ref should point to the user's specific reports
    const userReportsRef = ref(db, `reports/${user.uid}`);
    
    // We fetch all reports for the user once
    const unsubscribe = onValue(userReportsRef, (snapshot) => {
      const data = snapshot.val();
      const reports: Report[] = [];
      if (data) {
        Object.keys(data).forEach((key) => {
          reports.push({ id: key, ...data[key] });
        });
      }
      setAllReports(reports);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const { availableMetrics, chartData, unit } = useMemo(() => {
    if (allReports.length === 0) {
      return { availableMetrics: [], chartData: [], unit: '' };
    }

    const metricsMap: { [key: string]: { unit?: string; data: MetricDataPoint[] } } = {};
    const uniqueMetrics = new Set<string>();

    allReports.forEach(report => {
        report.extractedValues.forEach(v => {
            if (typeof v.value === 'number') {
                uniqueMetrics.add(v.test);
                if (!metricsMap[v.test]) {
                    metricsMap[v.test] = { unit: v.unit, data: [] };
                }
                metricsMap[v.test].data.push({
                    date: format(parseISO(report.uploadedAt), 'MMM yy'),
                    value: v.value,
                });
            }
        });
    });

    const metricsList = Array.from(uniqueMetrics);
    
    // Set default metric
    if (!selectedMetric && metricsList.length > 0) {
        const defaultMetric = metricsList.includes('Total Cholesterol') ? 'Total Cholesterol' : metricsList[0];
        setSelectedMetric(defaultMetric);
    }
    
    const currentMetricData = metricsMap[selectedMetric]?.data || [];
    // Sort by date chronologically
    currentMetricData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


    return {
      availableMetrics: metricsList,
      chartData: currentMetricData,
      unit: metricsMap[selectedMetric]?.unit || ''
    };
  }, [allReports, selectedMetric]);
  
  // Effect to handle when selectedMetric might become invalid after data changes
  useEffect(() => {
    if (availableMetrics.length > 0 && !availableMetrics.includes(selectedMetric)) {
      setSelectedMetric(availableMetrics.includes('Total Cholesterol') ? 'Total Cholesterol' : availableMetrics[0]);
    }
  }, [availableMetrics, selectedMetric]);


  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <CardTitle>Health Metrics Over Time</CardTitle>
                <CardDescription>
                    {selectedMetric ? `${selectedMetric} (${unit}) from your reports` : 'Select a metric to display'}
                </CardDescription>
            </div>
            {!loading && availableMetrics.length > 0 && (
                 <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                    <SelectTrigger className="w-full sm:w-[240px]">
                        <SelectValue placeholder="Select a metric" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableMetrics.map(metric => (
                            <SelectItem key={metric} value={metric}>{metric}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="h-[350px] w-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
            </div>
        ) : chartData.length === 0 ? (
            <div className="h-[350px] w-full flex items-center justify-center text-muted-foreground">
                <p>
                    {availableMetrics.length === 0 
                        ? 'No plottable data found in your reports yet.'
                        : `No data found for "${selectedMetric}".`
                    }
                </p>
            </div>
        ) : (
            <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                />
                <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
                domain={['dataMin - 10', 'dataMax + 10']}
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
                <Bar dataKey="value" name={selectedMetric} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
            </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
