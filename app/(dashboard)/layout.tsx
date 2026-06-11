import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 overflow-auto">
          {children}
          <Footer />
        </div>
      </div>
    </div>
  );
}
