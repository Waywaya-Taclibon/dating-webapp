import type { JSX, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

/** Route guard — redirects signed-out users to /, shows loading while Clerk loads. */
export default function RequireAuth({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading...
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}
