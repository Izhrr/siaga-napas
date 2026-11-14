import { DataProvider } from "@/components/DataProvider";
import { Shell } from "@/components/shell/Shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      <Shell>{children}</Shell>
    </DataProvider>
  );
}
