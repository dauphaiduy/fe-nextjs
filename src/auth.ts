import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/v1";

class AdminLoginError extends CredentialsSignin {
  constructor(code: string) {
    super();
    this.code = code;
  }
}

function decodeJwtPayload(token: string): {
  sub: number;
  username: string;
  userType: string;
  permissions: string[];
} {
  const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const json = Buffer.from(base64, "base64").toString("utf-8");
  return JSON.parse(json);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const res = await fetch(`${BASE_URL}/auth/admin/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            const message: string = errBody?.message ?? "";
            console.error("[auth] admin login failed", res.status, errBody);

            if (res.status === 401) {
              const lower = message.toLowerCase();
              if (lower.includes("inactive") || lower.includes("not active")) {
                throw new AdminLoginError("account_inactive");
              }
              if (lower.includes("customer")) {
                throw new AdminLoginError("admin_only");
              }
              throw new AdminLoginError("invalid_credentials");
            }

            throw new AdminLoginError("invalid_credentials");
          }

          const data = await res.json();
          const accessToken: string = data.data?.accessToken;
          if (!accessToken) {
            console.error("[auth] no accessToken in response", data);
            throw new AdminLoginError("invalid_credentials");
          }

          const payload = decodeJwtPayload(accessToken);

          if (payload.userType === "CUSTOMER") {
            console.error("[auth] customer account rejected");
            throw new AdminLoginError("admin_only");
          }

          return {
            id: String(payload.sub),
            name: payload.username,
            accessToken,
            permissions: payload.permissions,
            userType: payload.userType,
          };
        } catch (err) {
          if (err instanceof CredentialsSignin) throw err;
          console.error("[auth] authorize error:", err);
          throw new AdminLoginError("invalid_credentials");
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken as string;
        token.permissions = user.permissions as string[];
        token.userType = user.userType as string;
      }
      return token;
    },
    session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.permissions = token.permissions as string[];
      session.user.userType = token.userType as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
