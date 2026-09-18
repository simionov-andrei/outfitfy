"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { Cloud, CloudOff, Menu, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NAV_ITEMS } from "./nav-items";

export function Topbar({ cloudSyncEnabled }: { cloudSyncEnabled: boolean }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const current = NAV_ITEMS.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  );

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {NAV_ITEMS.map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link href={item.href} className="flex items-center gap-2">
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Link href="/" className="flex items-center gap-2 md:hidden">
          <Shirt className="size-5 text-primary" />
          <span className="font-semibold">Outfitfy</span>
        </Link>

        <div className="hidden md:block">
          <p className="text-sm font-semibold">{current?.label ?? "Outfitfy"}</p>
          <p className="text-xs text-muted-foreground">{current?.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!cloudSyncEnabled ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
                <CloudOff className="size-3.5" />
                Local only
              </span>
            </TooltipTrigger>
            <TooltipContent>
              Cloud sync is optional — configure an OAuth provider to enable it.
            </TooltipContent>
          </Tooltip>
        ) : session ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-xs hover:bg-muted">
                <Avatar className="size-6">
                  <AvatarImage src={session.user?.image ?? undefined} />
                  <AvatarFallback>{session.user?.name?.[0] ?? "U"}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">{session.user?.name ?? "Synced"}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="outline" size="sm" onClick={() => signIn()} disabled={status === "loading"}>
            <Cloud className="size-4" />
            Enable cloud sync
          </Button>
        )}
      </div>
    </header>
  );
}
