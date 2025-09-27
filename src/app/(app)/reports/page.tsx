'use client';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import { Button } from "@/components/ui/button"
  import { Badge } from "@/components/ui/badge"
  import { File, PlusCircle } from "lucide-react"
  import Link from "next/link"
  import { format, parseISO } from "date-fns"
  import { useAuth } from "@/hooks/use-auth";
  import { useState, useEffect } from "react";
  import { ref, onValue } from "firebase/database";
  import { db } from "@/lib/firebase";
  import type { Report } from "@/lib/types";
  import { UploadReportDialog } from "@/components/reports/upload-report-dialog";
  
  export default function ReportsPage() {
    const { user } = useAuth();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

    useEffect(() => {
        if (!user) return;

        setLoading(true);
        // Fetch reports from the user-specific path
        const userReportsRef = ref(db, `reports/${user.uid}`);

        const unsubscribe = onValue(userReportsRef, (snapshot) => {
            const data = snapshot.val();
            const reportsData: Report[] = [];
            if (data) {
                Object.keys(data).forEach((key) => {
                    reportsData.push({ id: key, ...data[key] });
                });
            }
             // Realtime DB doesn't support descending order, so we sort client-side
            reportsData.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
            setReports(reportsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline tracking-tight">
                    Medical Reports
                    </h1>
                    <p className="text-muted-foreground">
                    A list of your uploaded and analyzed medical reports.
                    </p>
                </div>
                <Button onClick={() => setIsUploadDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Upload Report
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Documents</CardTitle>
                    <CardDescription>
                        {loading ? 'Loading reports...' : `${reports.length} reports found.`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Report Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="hidden md:table-cell">Abnormal Results</TableHead>
                            <TableHead className="hidden md:table-cell">Uploaded On</TableHead>
                            <TableHead>
                            <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {loading ? (
                            Array.from({length: 3}).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={5} className="text-center p-4">
                                        <div className="h-8 bg-muted rounded-md animate-pulse"></div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : reports.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center p-8 text-muted-foreground">
                                    You haven&apos;t uploaded any reports yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            reports.map((report) => {
                                const abnormalCount = report.extractedValues.filter(v => v.status === 'abnormal').length;
                                return (
                                    <TableRow key={report.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <File className="h-4 w-4 text-muted-foreground"/>
                                                {report.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={abnormalCount > 0 ? "destructive" : "secondary"} className={abnormalCount > 0 ? "" : "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"}>
                                                {abnormalCount > 0 ? "Action Required" : "Normal"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            {abnormalCount}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            {format(parseISO(report.uploadedAt), "MMMM d, yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/reports/${report.id}`}>
                                                <Button variant="outline" size="sm">View Analysis</Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <UploadReportDialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen} />
        </div>
    )
  }
  
