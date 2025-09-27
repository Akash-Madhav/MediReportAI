import { BellRing, Check } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { mockReminders } from "@/lib/data"
import { Badge } from "../ui/badge"

export function Reminders() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Medication Reminders</CardTitle>
        <CardDescription>You have {mockReminders.filter(r => r.enabled).length} active reminders.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {mockReminders.map((reminder) => (
          <div key={reminder.id} className="flex items-center space-x-4 rounded-md border p-4">
            <BellRing className="h-5 w-5 text-primary" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">
                {reminder.medicineName}
              </p>
              <p className="text-sm text-muted-foreground">
                {reminder.recurrence} at {reminder.time}
              </p>
            </div>
            <Switch defaultChecked={reminder.enabled} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
