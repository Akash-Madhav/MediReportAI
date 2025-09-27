import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { mockReports, mockPrescriptions } from "@/lib/data"
import { ArrowUpRight, FileText, ClipboardType } from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"

const recentUploads = [
    ...mockReports.slice(0, 1).map(r => ({ ...r, type: 'report' })),
    ...mockPrescriptions.slice(0, 1).map(p => ({ ...p, type: 'prescription' })),
].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

export function RecentUploads() {
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
        {recentUploads.map((item) => (
          <div key={item.id} className="flex items-center gap-4">
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
        ))}
      </CardContent>
    </Card>
  )
}
