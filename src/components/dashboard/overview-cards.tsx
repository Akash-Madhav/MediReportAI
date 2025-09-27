'use client';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { Activity, Syringe, Users } from "lucide-react"
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Report, Prescription } from "@/lib/types";
  
  export function OverviewCards() {
    const { user } = useAuth();
    const [latestReport, setLatestReport] = useState<Report | null>(null);
    const [activePrescriptions, setActivePrescriptions] = useState<Prescription[]>([]);

    useEffect(() => {
        if (!user) return;
        
        // Fetch latest report
        const reportsQuery = query(
            collection(db, "reports"),
            where("patientId", "==", user.uid),
            orderBy("uploadedAt", "desc"),
            limit(1)
        );
        const unsubscribeReports = onSnapshot(reportsQuery, (snapshot) => {
            if (!snapshot.empty) {
                const reportDoc = snapshot.docs[0];
                setLatestReport({ id: reportDoc.id, ...reportDoc.data() } as Report);
            }
        });

        // Fetch active prescriptions (for simplicity, let's take latest 2)
         const prescriptionsQuery = query(
            collection(db, "prescriptions"),
            where("patientId", "==", user.uid),
            orderBy("uploadedAt", "desc"),
            limit(2) // This is a simplification
        );
        const unsubscribePrescriptions = onSnapshot(prescriptionsQuery, (snapshot) => {
             const prescData: Prescription[] = [];
            snapshot.forEach((doc) => {
                prescData.push({ id: doc.id, ...doc.data() } as Prescription);
            });
            setActivePrescriptions(prescData);
        });

        return () => {
            unsubscribeReports();
            unsubscribePrescriptions();
        }

    }, [user]);

    const abnormalResultsCount = latestReport?.extractedValues.filter(v => v.status === 'abnormal').length ?? 0;
    const interactionCount = activePrescriptions.reduce((acc, p) => acc + p.interactions.length, 0);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Abnormal Results
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${abnormalResultsCount > 0 ? 'text-destructive' : ''}`}>{abnormalResultsCount}</div>
                <p className="text-xs text-muted-foreground">
                  From your latest report
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Prescriptions
                </CardTitle>
                <Syringe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activePrescriptions.length}</div>
                <p className="text-xs text-muted-foreground">
                  {interactionCount} interaction{interactionCount !== 1 && 's'} found
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Doctors with Access</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1</div>
                <p className="text-xs text-muted-foreground">Dr. Emily Carter</p>
              </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Upcoming Appointment
                    </CardTitle>
                    <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                    >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">Nov 15</div>
                    <p className="text-xs text-muted-foreground">
                        at 10:30 AM with Dr. Carter
                    </p>
                </CardContent>
            </Card>
      </div>
    )
  }
  