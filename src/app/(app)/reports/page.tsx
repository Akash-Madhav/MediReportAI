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
  import { mockReports } from "@/lib/data"
  import { Badge } from "@/components/ui/badge"
  import { File, PlusCircle } from "lucide-react"
  import Link from "next/link"
  import { format, parseISO } from "date-fns"
  
  export default function ReportsPage() {
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
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Upload Report
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Documents</CardTitle>
                    <CardDescription>
                        {mockReports.length} reports found.
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
                        {mockReports.map((report) => {
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
                        })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
  }
  