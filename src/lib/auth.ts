import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { firestore } from "@/lib/firestore";

type FirebasePasswordSignInResponse = {
  localId: string;
  email: string;
  displayName?: string;
};

type FirebaseErrorResponse = {
  error?: {
    message?: string;
  };
};

async function signInWithFirebasePassword(
  email: string,
  password: string
): Promise<FirebasePasswordSignInResponse | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!apiKey) {
    console.error("[auth] Missing NEXT_PUBLIC_FIREBASE_API_KEY for credentials sign-in");
    return null;
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
      cache: "no-store",
    }
  );

  const payload = (await response.json()) as FirebasePasswordSignInResponse | FirebaseErrorResponse;

  if (!response.ok) {
    const code = "error" in payload ? payload.error?.message : undefined;

    if (code === "INVALID_LOGIN_CREDENTIALS" || code === "EMAIL_NOT_FOUND" || code === "INVALID_PASSWORD") {
      console.warn(`[auth] Invalid login credentials for ${email}`);
      return null;
    }

    console.error("[auth] Firebase credentials sign-in failed:", code ?? response.statusText);
    return null;
  }

  if (!("localId" in payload)) {
    console.error("[auth] Firebase credentials sign-in returned an unexpected payload");
    return null;
  }

  return payload;
}

export const { handlers, signIn, signOut, auth: nextAuth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const normalizedEmail = email.trim().toLowerCase();

        try {
          const user = await signInWithFirebasePassword(normalizedEmail, password);

          if (!user) {
            return null;
          }

          console.info(`[auth] Firebase credentials verified for ${normalizedEmail}`);

          const appUser =
            (await firestore.user.findUnique({
              where: { id: user.localId },
              include: { perguruan: true },
            })) ??
            (await firestore.user.findUnique({
              where: { email: normalizedEmail },
              include: { perguruan: true },
            }));

          if (!appUser) {
            console.error("[auth] User not found in database for Firebase UID:", user.localId);
            return null;
          }

          return {
            id: appUser.id,
            email: appUser.email,
            name: appUser.name ?? user.displayName,
            role: appUser.role,
            perguruanId: appUser.perguruan?.id ?? null,
          };
        } catch (error) {
          console.error("[auth] Error in authorize:", error instanceof Error ? error.message : error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = (user as { role?: string }).role;
        token.perguruanId = (user as { perguruanId?: string | null }).perguruanId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; email?: string; name?: string; role?: string; perguruanId?: string | null }).id = token.id as string;
        (session.user as { id?: string; email?: string; name?: string; role?: string; perguruanId?: string | null }).email = token.email as string;
        (session.user as { id?: string; email?: string; name?: string; role?: string; perguruanId?: string | null }).name = token.name as string;
        (session.user as { id?: string; email?: string; name?: string; role?: string; perguruanId?: string | null }).role = token.role as string;
        (session.user as { id?: string; email?: string; name?: string; role?: string; perguruanId?: string | null }).perguruanId = token.perguruanId as string | null;
      }
      return session;
    },
  },
});
