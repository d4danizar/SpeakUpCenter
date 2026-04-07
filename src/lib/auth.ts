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
        if (!credentials?.email || !credentials?.password) {
          console.log("LOGIN ERROR: Email atau password kosong.");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          console.log(`LOGIN GAGAL: User dengan email "${credentials.email}" tidak ditemukan di database.`);
          return null;
        }

        if (typeof credentials.password !== 'string') {
          console.log("LOGIN ERROR: Password bukan string:", typeof credentials.password);
          return null;
        }

        // Proper bcryptjs comparison for hashed passwords
        const plainPassword = credentials.password.trim();
        let isValid = false;
        try {
          isValid = await bcrypt.compare(plainPassword, user.passwordHash);
        } catch (bcryptErr) {
          console.error("LOGIN ERROR: bcrypt.compare() melempar exception:", bcryptErr);
          return null;
        }

        if (!isValid) {
          console.log(`LOGIN GAGAL: Password tidak cocok untuk email "${credentials.email}". Hash di DB: ${user.passwordHash.substring(0, 10)}...`);
          return null;
        }

        console.log(`LOGIN SUKSES: Memasukkan user ${user.email} (role: ${user.role})`);
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
};
