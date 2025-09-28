'use client';
import { BellRing, Check } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import type { Reminder } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { ref, onValue, update, query, orderByChild } from "firebase/database";
import { db } from "@/lib/firebase";

export function Reminders() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    if (!user) return;
    
    // Order by medicine name to group them visually
    const remindersRef = query(ref(db, `reminders/${user.uid}`), orderByChild('medicineName'));
    const unsubscribe = onValue(remindersRef, (snapshot) => {
      const data = snapshot.val();
      const remindersList: Reminder[] = [];
      if (data) {
        Object.keys(data).forEach(key => {
          remindersList.push({ id: key, ...data[key] });
        });
      }
      setReminders(remindersList);
    });

    return () => unsubscribe();
  }, [user]);

  const handleToggleReminder = (id: string, enabled: boolean) => {
    if(!user) return;
    const reminderRef = ref(db, `reminders/${user.uid}/${id}`);
    update(reminderRef, { enabled });
  }

  const activeRemindersCount = reminders.filter(r => r.enabled).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medication Reminders</CardTitle>
        <CardDescription>You have {activeRemindersCount} active reminder{activeRemindersCount !== 1 && 's'}.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {reminders.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground p-4">No medication reminders found. Upload a prescription to get started.</p>
        ) : (
          reminders.map((reminder) => (
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
              <Switch checked={reminder.enabled} onCheckedChange={(checked) => handleToggleReminder(reminder.id, checked)} />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
