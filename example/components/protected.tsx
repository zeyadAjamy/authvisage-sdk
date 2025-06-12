"use client";

import { useUserContext } from "@/contexts/user";
import { LoadingPage } from "@/components/loading-page";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user } = useUserContext();

  if (user === undefined) {
    return <LoadingPage />;
  }

  if (user === null) {
    window.location.assign("/login");
    return null;
  }

  if (user) return children;
};
