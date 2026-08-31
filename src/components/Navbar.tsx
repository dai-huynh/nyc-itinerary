"use client";

import { useRouter, usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const isBuilder = pathname.startsWith("/plan/builder");

  if (isBuilder) return null;

  return (
    <nav className="border-b border-border bg-card">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <span className="font-bold text-lg">NextStop NYC</span>
        </button>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {session ? (
            <>
              <Button
                variant={pathname === "/plan/new" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => router.push("/plan/new")}
              >
                New Plan
              </Button>
              <Button
                variant={pathname.startsWith("/itineraries") ? "secondary" : "ghost"}
                size="sm"
                onClick={() => router.push("/itineraries")}
              >
                My Itineraries
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarImage src={session.user?.image || undefined} />
                    <AvatarFallback className="text-xs">
                      {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-xs text-muted-foreground cursor-default">
                    {session.user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/plan/new")}
              >
                New Plan
              </Button>
              <Button variant="outline" size="sm" onClick={() => signIn()}>
                Sign In
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
