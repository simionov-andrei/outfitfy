"use client";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { DbInit } from "./db-init";

export function AppShell({
  children,
  cloudSyncEnabled,
}: {
  children: React.ReactNode;
  cloudSyncEnabled: boolean;
}) {
  return (
    <div className="flex min-h-screen w-full">
      <DbInit />
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar cloudSyncEnabled={cloudSyncEnabled} />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
