"use client";

import { LoadingPage } from "@/components/loading-page";
import { useUserContext } from "@/contexts/user";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = useUserContext();

  if (user === undefined) {
    return <LoadingPage />;
  }

  if (user) {
    window.location.assign(
      process.env.NEXT_PUBLIC_AUTHORIZED_REDIRECT_PATH || "/"
    );
    return null;
  }

  return children;
}
