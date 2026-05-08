"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const logout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const hasPermission = (permission: string): boolean => {
    const permissions = session?.user?.permissions ?? [];
    return permissions.includes("*") || permissions.includes(permission);
  };

  return {
    accessToken: session?.accessToken ?? null,
    user: session?.user ?? null,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    logout,
    hasPermission,
  };
}
