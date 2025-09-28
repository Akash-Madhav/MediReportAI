
'use client';
import Link from "next/link"
import {
  Bell,
  FileText,
  ClipboardType,
  LayoutDashboard,
  Map,
  Menu,
  MessageCircle,
  Search,
  Settings,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { UserNav } from "./user-nav"
import { Logo } from "../icons"
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

export function Header() {
  const { user } = useAuth();
  const [reportCount, setReportCount] = useState(0);
  const [prescriptionCount, setPrescriptionCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const reportsRef = ref(db, `reports/${user.uid}`);
    const prescriptionsRef = ref(db, `prescriptions/${user.uid}`);

    const unsubscribeReports = onValue(reportsRef, (snapshot) => {
      setReportCount(snapshot.exists() ? Object.keys(snapshot.val()).length : 0);
    });

    const unsubscribePrescriptions = onValue(prescriptionsRef, (snapshot) => {
      setPrescriptionCount(snapshot.exists() ? Object.keys(snapshot.val()).length : 0);
    });

    return () => {
      unsubscribeReports();
      unsubscribePrescriptions();
    };
  }, [user]);

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/reports', icon: FileText, label: 'Reports', badge: reportCount },
    { href: '/prescriptions', icon: ClipboardType, label: 'Prescriptions', badge: prescriptionCount },
    { href: '/pharmacies', icon: Map, label: 'Find Pharmacies' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 sticky top-0 z-10">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        {/* Desktop header content can go here if needed, but sidebar is primary */}
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
        <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="#"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Logo className="h-8 w-8" />
              <span className="sr-only">MediReportAI</span>
            </Link>
            {navItems.map(({ href, icon: Icon, label, badge }) => (
                <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Icon className="h-5 w-5" />
                {label}
                {badge !== undefined && badge > 0 && (
                  <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                    {badge}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <form className="ml-auto flex-1 sm:flex-initial">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search reports, prescriptions..."
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-background"
            />
          </div>
        </form>
        <UserNav />
      </div>
    </header>
  )
}
