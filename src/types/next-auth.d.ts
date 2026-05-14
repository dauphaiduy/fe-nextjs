import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken: string;
    user: {
      permissions: string[];
      userType: string;
    } & DefaultSession["user"];
  }

  interface User {
    accessToken: string;
    permissions: string[];
    userType: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    permissions?: string[];
    userType?: string;
  }
}
