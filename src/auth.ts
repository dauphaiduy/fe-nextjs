import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/v1";

function decodeJwtPayload(token: string): {
  sub: number;
  username: string;
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
          const res = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            console.error("[auth] login failed", res.status, errBody);
            return null;
          }

          const data = await res.json();
          const accessToken: string = data.data?.accessToken;
          if (!accessToken) {
            console.error("[auth] no accessToken in response", data);
            return null;
          }

          const payload = decodeJwtPayload(accessToken);

          return {
            id: String(payload.sub),
            name: payload.username,
            accessToken,
            permissions: payload.permissions,
          };
        } catch (err) {
          console.error("[auth] authorize error:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken as string;
        token.permissions = user.permissions as string[];
      }
      return token;
    },
    session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.permissions = token.permissions as string[];
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
