"use client";

import { useRouter } from "next/navigation";
import { useUserContext } from "@/contexts/user";
import { LoadingPage } from "@/components/loading-page";

export default function Home() {
  const router = useRouter();
  const { user } = useUserContext();

  if (user === undefined) {
    return <LoadingPage />;
  }

  if (user) {
    router.push("/dashboard");
    return null;
  }

  router.push("/login");
  return null;
}
