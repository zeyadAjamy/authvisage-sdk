import { ProtectedRoute } from "@/components/protected";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => (
  <ProtectedRoute>
    <main className="flex-1 overflow-auto p-4">{children}</main>
  </ProtectedRoute>
);

export default DashboardLayout;
