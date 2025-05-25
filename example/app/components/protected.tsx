import { useUser } from "~/contexts/user";
import { Loading } from "~/components/loading";
import { Navigate } from "react-router";

export function Protected({ children }: { children: React.ReactNode }) {
  const { user } = useUser();

  if (user === undefined) {
    // User state is still loading
    return <Loading />;
  }

  if (user === null) {
    // User is not authenticated
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}
