import { DefaultSession } from "next-auth";

// Augment the session/user types so `session.user.id` is strongly typed.
declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
