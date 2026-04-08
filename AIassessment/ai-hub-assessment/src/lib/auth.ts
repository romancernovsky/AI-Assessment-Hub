import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import AzureADProvider from "next-auth/providers/azure-ad";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      authProvider: string;
    }
  }
  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    authProvider: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: "openid profile email User.Read",
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.isActive) {
          return null;
        }

        if (user.authProvider !== "credentials") {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.userId,
          email: user.email,
          name: user.displayName,
          role: user.role,
          authProvider: user.authProvider,
        };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "azure-ad") {
        const email = user.email;
        if (!email) return false;

        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          if (!existingUser.isActive) return false;
          await prisma.user.update({
            where: { email },
            data: { lastLoginAt: new Date() },
          });
        } else {
          await prisma.user.create({
            data: {
              email,
              password: "",
              displayName: user.name || email.split("@")[0],
              role: "user",
              authProvider: "azure-ad",
              externalId: account.providerAccountId,
              lastLoginAt: new Date(),
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "azure-ad") {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.id = dbUser.userId;
          token.authProvider = "azure-ad";
        }
      } else if (user) {
        token.role = user.role;
        token.id = user.id;
        token.authProvider = "credentials";
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.authProvider = (token.authProvider as string) || "credentials";
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
