import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function SettingsPage() {
  return (
      <div className="flex flex-col gap-8">
          <div>
              <h1 className="text-3xl font-bold font-headline tracking-tight">
              Settings
              </h1>
              <p className="text-muted-foreground">
              Manage your account and application settings.
              </p>
          </div>

          <Card>
              <CardHeader>
                  <CardTitle>Coming Soon</CardTitle>
                  <CardDescription>
                      This section is under construction.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <p>In the future, you will be able to manage your profile, notification preferences, data privacy, and connected doctors here.</p>
              </CardContent>
          </Card>
      </div>
  )
}
