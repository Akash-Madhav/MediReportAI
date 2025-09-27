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
  import { ClipboardType, PlusCircle, CheckCircle, AlertTriangle } from "lucide-react"
  import Link from "next/link"
  import { format, parseISO } from "date-fns"
  import { useAuth } from "@/hooks/use-auth";
  import { useState, useEffect } from "react";
  import { ref, query, orderByChild, equalTo, onValue } from "firebase/database";
  import { db } from "@/lib/firebase";
  import type { Prescription } from "@/lib/types";
import { UploadPrescriptionDialog } from "@/components/prescriptions/upload-prescription-dialog";
  
  export default function PrescriptionsPage() {
    const { user } = useAuth();
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

    useEffect(() => {
        if (!user) return;

        setLoading(true);
        const prescriptionsRef = ref(db, 'prescriptions');
        const userPrescriptionsQuery = query(prescriptionsRef, orderByChild('patientId'), equalTo(user.uid));

        const unsubscribe = onValue(userPrescriptionsQuery, (snapshot) => {
            const data = snapshot.val();
            const prescData: Prescription[] = [];
            if (data) {
                Object.keys(data).forEach((key) => {
                    prescData.push({ id: key, ...data[key] });
                });
            }
            // Realtime DB doesn't support descending order, so we sort client-side
            prescData.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
            setPrescriptions(prescData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline tracking-tight">
                    Prescriptions
                    </h1>
                    <p className="text-muted-foreground">
                    A list of your uploaded and analyzed prescriptions.
                    </p>
                </div>
                <Button onClick={() => setIsUploadDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Upload Prescription
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Prescriptions</CardTitle>
                    <CardDescription>
                        {loading ? 'Loading prescriptions...' : `${prescriptions.length} prescriptions found.`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Prescription</TableHead>
                            <TableHead>Medicines</TableHead>
                            <TableHead className="hidden md:table-cell">Interactions</TableHead>
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
                        ) : prescriptions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center p-8 text-muted-foreground">
                                    You haven&apos;t uploaded any prescriptions yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            prescriptions.map((presc) => {
                                const interactionCount = presc.interactions?.length || 0;
                                return (
                                    <TableRow key={presc.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <ClipboardType className="h-4 w-4 text-muted-foreground"/>
                                                {presc.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {presc.medicines.map(m => m.name).join(', ')}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            {interactionCount > 0 ? 
                                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                                <AlertTriangle className="h-3 w-3" /> {interactionCount} Found
                                            </Badge> : 
                                            <Badge variant="secondary" className="flex items-center gap-1 w-fit bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                                                <CheckCircle className="h-3 w-3" /> None
                                            </Badge>}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            {format(parseISO(presc.uploadedAt), "MMMM d, yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/prescriptions/${presc.id}`}>
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
            <UploadPrescriptionDialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen} />
        </div>
    )
  }
  