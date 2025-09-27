'use client';

import { notFound } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import React, { useEffect, useState } from 'react';
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";
import type { Report } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";


const statusVariantMap: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    normal: 'secondary',
    abnormal: 'destructive',
};

const statusColorMap: { [key: string]: string } = {
    normal: 'text-green-800 bg-green-100 dark:text-green-300 dark:bg-green-900/50',
    abnormal: '',
};

export default function ReportDetailPage({ params }: { params: { id: string } }) {
    const { displayUser } = useAuth();
    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);
    const { id } = params;

    useEffect(() => {
        if (id) {
            const getReport = async (reportId: string) => {
                setLoading(true);
                const docRef = ref(db, `reports/${reportId}`);
                const docSnap = await get(docRef);
                if (!docSnap.exists()) {
                  notFound();
                } else {
                    setReport({ id: docSnap.key, ...docSnap.val() } as Report);
                }
                setLoading(false);
            }

            getReport(id).catch(() => {
                setLoading(false);
                notFound();
            })
        }
    }, [id]);


    if (loading || !report || !displayUser) return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-80" />
                </div>
            </div>
            <div className="grid md:grid-cols-3 gap-8 items-start">
                <div className="md:col-span-2">
                    <Skeleton className="h-96 w-full" />
                </div>
                <div className="md:col-span-1 flex flex-col gap-8">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
             <Skeleton className="h-32 w-full" />
        </div>
    );

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/reports">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold font-headline tracking-tight">
                            {report.name}
                        </h1>
                        <p className="text-muted-foreground">
                            Analysis for {displayUser.displayName} uploaded on {format(parseISO(report.uploadedAt), "MMM d, yyyy")}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><Share2 className="mr-2 h-4 w-4"/>Share</Button>
                    <Button><Download className="mr-2 h-4 w-4" />Download PDF</Button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Extracted Lab Results</CardTitle>
                        <CardDescription>Key data points identified by the AI from your report.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Test</TableHead>
                                    <TableHead>Value</TableHead>
                                    <TableHead>Reference Range</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {report.extractedValues.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{item.test}</TableCell>
                                        <TableCell>{item.value} {item.unit}</TableCell>
                                        <TableCell>
                                            {item.referenceRange?.low && item.referenceRange?.high 
                                                ? `${item.referenceRange.low} - ${item.referenceRange.high}`
                                                : item.referenceRange?.low ? `> ${item.referenceRange.low}`
                                                : item.referenceRange?.high ? `< ${item.referenceRange.high}`
                                                : 'N/A'
                                            }
                                        </TableCell>
                                        <TableCell>
                                            {item.status && (
                                                <Badge variant={statusVariantMap[item.status]} className={statusColorMap[item.status]}>
                                                    {item.status}
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                </div>
                <div className="md:col-span-1 flex flex-col gap-8">
                    <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900">
                        <CardHeader>
                            <CardTitle>AI Risk Summary</CardTitle>
                            <CardDescription>Potential conditions based on results.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {report.riskSummary.map((risk, i) => (
                                <div key={i}>
                                    <p className="font-semibold">{risk.condition} <span className="text-sm text-muted-foreground">({risk.confidence} confidence)</span></p>
                                    <p className="text-sm text-muted-foreground">{risk.note}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Suggested Follow-ups</CardTitle>
                            <CardDescription>Recommended next steps.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {report.suggestedFollowUps.map((followUp, i) => (
                                <div key={i}>
                                    <p className="font-semibold">{followUp.test} <span className="text-sm text-muted-foreground">(Priority: {followUp.priority})</span></p>
                                    <p className="text-sm text-muted-foreground">{followUp.reason}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Patient-Friendly Explanation</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-foreground/80 leading-relaxed">{report.patientExplanation}</p>
                </CardContent>
            </Card>

        </div>
    )
}
