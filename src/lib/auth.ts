import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { getDbState, saveDbState, recordActivityLog } from "@/lib/db";
import { RoleType } from "@/lib/seed-data";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email dan password wajib diisi");
        }

        const state = getDbState();
        const user = state.users.find(
          (u) => u.email.toLowerCase() === credentials.email.trim().toLowerCase()
        );

        if (!user) {
          throw new Error("Email tidak ditemukan. Silakan daftar terlebih dahulu.");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("Password salah. Silakan coba lagi.");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          storeName: user.storeName,
          phone: user.phone,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const state = getDbState();
        const existing = state.users.find(
          (u) => u.email.toLowerCase() === user.email!.toLowerCase()
        );
        if (!existing) {
          const newId = `usr-google-${Date.now()}`;
          state.users.push({
            id: newId,
            name: user.name || "Penjual Google",
            email: user.email.toLowerCase(),
            passwordHash: "",
            phone: "081200000000",
            role: "SELLER",
            storeName: `Toko ${user.name || "UMKM"}`,
            businessType: "Lainnya",
            address: "Belum dilengkapi",
            createdAt: new Date().toISOString(),
          });
          recordActivityLog(state, {
            actorId: newId,
            action: "REGISTER_OAUTH",
            entityType: "User",
            entityId: newId,
            summary: `${user.name} mendaftar menggunakan Google OAuth`,
          });
          saveDbState(state);
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role: RoleType }).role || "SELLER";
        token.storeName =
          (user as unknown as { storeName: string }).storeName || "";
      }
      // Refresh dari DB agar perubahan role/profil selalu sinkron
      if (token.email) {
        const state = getDbState();
        const dbUser = state.users.find(
          (u) => u.email.toLowerCase() === String(token.email).toLowerCase()
        );
        if (dbUser) {
          token.id = dbUser.id;
          token.name = dbUser.name;
          token.role = dbUser.role;
          token.storeName = dbUser.storeName;
        }
      }
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = String(token.id || "");
        (session.user as { role?: RoleType }).role =
          (token.role as RoleType) || "SELLER";
        (session.user as { storeName?: string }).storeName = String(
          token.storeName || ""
        );
      }
      return session;
    },
  },
  secret:
    process.env.NEXTAUTH_SECRET ||
    "consolio-super-secret-jwt-key-2026-umkm-indonesia",
};

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  storeName: string;
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const state = getDbState();
  const dbUser = state.users.find(
    (u) => u.email.toLowerCase() === session.user!.email!.toLowerCase()
  );
  if (!dbUser) return null;

  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    storeName: dbUser.storeName,
  };
}

