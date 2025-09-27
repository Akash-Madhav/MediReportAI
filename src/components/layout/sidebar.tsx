'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  ClipboardType,
  Map,
  Settings,
  Bell,
  Stethoscope,
  MessageCircle,
  Bot,
} from 'lucide-react';
import { Logo } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/reports', icon: FileText, label: 'Reports', badge: 2 },
  { href: '/prescriptions', icon: ClipboardType, label: 'Prescriptions', badge: 1 },
  { href: '/pharmacies', icon: Map, label: 'Find Pharmacies' },
  { href: '/chatbot', icon: Bot, label: 'Chatbot' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-card md:flex">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Logo className="h-8 w-8" />
            <span className="font-headline text-lg">MediReportAI</span>
          </Link>
          <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Toggle notifications</span>
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            {navItems.map(({ href, icon: Icon, label, badge }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-foreground/70 transition-all hover:text-foreground hover:bg-muted',
                  (pathname === href || (href !== '/dashboard' && pathname.startsWith(href))) && 'bg-muted text-primary font-semibold'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                {badge && (
                  <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    {badge}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4">
           <Card>
            <CardHeader className="p-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Stethoscope className="h-5 w-5 text-primary" />
                Doctor Access
              </CardTitle>
              <CardDescription className="text-xs">
                Share your records securely with your healthcare provider.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Button size="sm" className="w-full">
                Manage Access
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </aside>
  );
}

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
