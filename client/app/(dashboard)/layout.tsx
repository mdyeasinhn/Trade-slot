import Link from "next/link";
import { requireTrader } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings, LayoutDashboard, Calendar, CreditCard } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireTrader();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <nav className="flex items-center gap-6">
            <Link href="/dashboard" className="text-xl font-bold">
              TradeSlot
            </Link>
            <div className="hidden md:flex md:gap-4">
              <Link href="/dashboard" className="text-sm font-medium hover:text-primary flex items-center gap-1">
                <LayoutDashboard className="h-4 w-4" />
                Overview
              </Link>
              <Link href="/dashboard/work-area" className="text-sm font-medium hover:text-primary flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Work Area
              </Link>
              <Link href="/dashboard/bookings" className="text-sm font-medium hover:text-primary flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Bookings
              </Link>
              <Link href="/settings/stripe" className="text-sm font-medium hover:text-primary flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                Stripe
              </Link>
              <Link href="/dashboard/profile" className="text-sm font-medium hover:text-primary flex items-center gap-1">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </div>
          </nav>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.email} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings/stripe" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action={logoutAction}>
                  <DropdownMenuItem asChild>
                    <button type="submit" className="w-full text-destructive focus:text-destructive flex items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}