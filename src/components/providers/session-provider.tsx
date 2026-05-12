"use client";

import { useEffect } from "react";
import { SessionProvider as NextAuthSessionProvider, useSession } from "next-auth/react";
import { setApiToken } from "@/services/api-client";

// Reads the session from context (no HTTP call) and keeps the api-client token in sync.
// Skips while status === "loading" so the _sessionReady gate only opens once the
// session is actually known, preventing a race on F5 / hard reload.
function ApiTokenSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    setApiToken(session?.accessToken ?? null);
  }, [session?.accessToken, status]);

  return null;
}

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextAuthSessionProvider>
      <ApiTokenSync />
      {children}
    </NextAuthSessionProvider>
  );
}
