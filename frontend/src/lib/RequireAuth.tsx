import type { JSX, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import LoadingScreen from "./LoadingScreen";

/** Route guard — redirects signed-out users to /, shows loading while Clerk loads. */
export default function RequireAuth({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <LoadingScreen message="Checking sign-in…" />;
  }
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}
