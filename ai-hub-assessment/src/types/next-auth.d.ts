import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      authProvider: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    authProvider: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    authProvider: string;
  }
}
