import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { Role } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "Masukkan email..." },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("==== MULAI PROSES LOGIN ====");
        console.log("1. Email input:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          throw new Error("KREDENSIAL_KOSONG: Email atau password tidak dikirim.");
        }

        let user;
        try {
          user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });
          console.log("2. User ditemukan di DB?:", !!user);
        } catch (dbError) {
          console.error("CRITICAL DB ERROR DI VERCEL:", dbError);
          throw new Error("GAGAL_KONEK_DATABASE: " + String(dbError));
        }

        if (!user || !user.passwordHash) {
          throw new Error("USER_TIDAK_DITEMUKAN_DI_DB: " + credentials.email);
        }

        console.log("3. Hash prefix di DB:", user.passwordHash.substring(0, 15) + "...");
        console.log("3. Role user:", user.role);

        let isValid = false;
        try {
          isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          console.log("4. Hasil bcrypt.compare():", isValid);
        } catch (bcryptErr) {
          console.error("BCRYPT ERROR:", bcryptErr);
          throw new Error("BCRYPT_GAGAL: " + String(bcryptErr));
        }

        if (!isValid) {
          throw new Error("PASSWORD_SALAH untuk email: " + credentials.email);
        }

        console.log("5. LOGIN SUKSES untuk role:", user.role);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login", // Route to our custom login page
  },
  secret: process.env.NEXTAUTH_SECRET,
  // trustHost adalah fitur NextAuth v5 — tidak tersedia di v4.
  // Di v4, pastikan env var NEXTAUTH_URL disetel di Vercel: https://your-app.vercel.app
};
