import { AppShell } from "@/components/layout/app-shell";
import { cloudSyncConfigured } from "@/lib/env";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return <AppShell cloudSyncEnabled={cloudSyncConfigured()}>{children}</AppShell>;
}
