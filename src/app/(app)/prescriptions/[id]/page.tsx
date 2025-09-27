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
import { ArrowLeft, Download, Share2, AlertTriangle, CheckCircle, Pill } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/hooks/use-auth";
import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Prescription } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";


export default function PrescriptionDetailPage({ params }: { params: { id: string } }) {
    const { displayUser } = useAuth();
    const [presc, setPresc] = useState<Prescription | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!params.id) return;
        const fetchPrescription = async () => {
            setLoading(true);
            const docRef = doc(db, "prescriptions", params.id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setPresc({ id: docSnap.id, ...docSnap.data() } as Prescription);
            } else {
                notFound();
            }
            setLoading(false);
        };

        fetchPrescription();
    }, [params.id]);


    if (loading || !presc || !displayUser) return (
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
                    <Skeleton className="h-64 w-full" />
                </div>
                <div className="md:col-span-1">
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/prescriptions">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold font-headline tracking-tight">
                            {presc.name}
                        </h1>
                        <p className="text-muted-foreground">
                            Analysis for {displayUser.displayName} uploaded on {format(parseISO(presc.uploadedAt), "MMM d, yyyy")}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><Share2 className="mr-2 h-4 w-4"/>Share</Button>
                    <Button><Download className="mr-2 h-4 w-4" />Download PDF</Button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 items-start">
                <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Extracted Medications</CardTitle>
                        <CardDescription>Medicines identified by the AI from your prescription.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Medicine</TableHead>
                                    <TableHead>Dosage</TableHead>
                                    <TableHead>Frequency</TableHead>
                                    <TableHead>Route</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {presc.medicines.map((med, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium flex items-center gap-2"><Pill className="h-4 w-4 text-primary"/>{med.name}</TableCell>
                                        <TableCell>{med.dosage}</TableCell>
                                        <TableCell>{med.frequency}</TableCell>
                                        <TableCell>{med.route}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                </div>
                <div className="md:col-span-1 flex flex-col gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Drug Interaction Check</CardTitle>
                            <CardDescription>Potential interactions found.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {presc.interactions.length > 0 ? (
                                presc.interactions.map((interaction, i) => (
                                    <Alert key={i} variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>
                                            {interaction.drugA} & {interaction.drugB}
                                        </AlertTitle>
                                        <AlertDescription>
                                            <span className="capitalize font-semibold">[{interaction.severity} Risk]</span> {interaction.message}
                                        </AlertDescription>
                                    </Alert>
                                ))
                            ) : (
                                <Alert className="border-green-300 dark:border-green-800">
                                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    <AlertTitle>No Interactions Found</AlertTitle>
                                    <AlertDescription>
                                        No potential drug interactions were found among the prescribed medications.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
