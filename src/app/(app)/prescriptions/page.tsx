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
  import { mockPrescriptions } from "@/lib/data"
  import { Badge } from "@/components/ui/badge"
  import { ClipboardType, PlusCircle, CheckCircle, AlertTriangle } from "lucide-react"
  import Link from "next/link"
  import { format, parseISO } from "date-fns"
  
  export default function PrescriptionsPage() {
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
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Upload Prescription
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Prescriptions</CardTitle>
                    <CardDescription>
                        {mockPrescriptions.length} prescriptions found.
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
                        {mockPrescriptions.map((presc) => {
                            const interactionCount = presc.interactions.length;
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
                        })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
  }
  