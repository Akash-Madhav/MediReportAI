'use client';
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowUpRight, FileText, ClipboardType } from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Report, Prescription } from "@/lib/types";

type Upload = (Report & { type: 'report' }) | (Prescription & { type: 'prescription' });

export function RecentUploads() {
    const { user } = useAuth();
    const [recentUploads, setRecentUploads] = useState<Upload[]>([]);

    useEffect(() => {
        if (!user) return;

        const reportsQuery = query(
            collection(db, "reports"),
            where("patientId", "==", user.uid),
            orderBy("uploadedAt", "desc"),
            limit(2)
        );
        const prescriptionsQuery = query(
            collection(db, "prescriptions"),
            where("patientId", "==", user.uid),
            orderBy("uploadedAt", "desc"),
            limit(2)
        );

        const unsubscribeReports = onSnapshot(reportsQuery, (snapshot) => {
            const reports = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'report' } as Upload));
            setRecentUploads(prev => [...reports, ...prev.filter(u => u.type !== 'report')].sort((a,b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()).slice(0, 3));
        });

        const unsubscribePrescriptions = onSnapshot(prescriptionsQuery, (snapshot) => {
            const prescriptions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'prescription' } as Upload));
            setRecentUploads(prev => [...prescriptions, ...prev.filter(u => u.type !== 'prescription')].sort((a,b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()).slice(0, 3));
        });


        return () => {
            unsubscribeReports();
            unsubscribePrescriptions();
        }
    }, [user]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
          <CardTitle>Recent Uploads</CardTitle>
          <CardDescription>
            Your latest analyzed documents.
          </CardDescription>
        </div>
        <Button asChild size="sm" className="ml-auto gap-1">
          <Link href="/reports">
            View All
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4">
        {recentUploads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No recent uploads found.</p>
        ) : (
            recentUploads.map((item) => (
                <div key={`${item.type}-${item.id}`} className="flex items-center gap-4">
                    <div className="rounded-lg bg-secondary p-3">
                        {item.type === 'report' ? 
                            <FileText className="h-5 w-5 text-primary" /> : 
                            <ClipboardType className="h-5 w-5 text-primary" />
                        }
                    </div>
                    <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Uploaded on {format(parseISO(item.uploadedAt), "MMM d, yyyy")}</p>
                    </div>
                    <Link href={`/${item.type}s/${item.id}`} className="ml-auto">
                        <Button variant="outline" size="sm">View</Button>
                    </Link>
                </div>
            ))
        )}
      </CardContent>
    </Card>
  )
}
