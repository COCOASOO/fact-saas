import SaasNavbar from "@/components/SaasNavbar";
import { Sidebar } from "@/components/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:pl-64 transition-[padding] duration-300 ease-in-out">
        <SaasNavbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

