import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        try {
          const result = await pool.query(
            "SELECT * FROM authentication WHERE username = $1 AND password = $2",
            [credentials.username, credentials.password]
          );

          if (result.rows.length === 0) {
            return null;
          }

          const user = result.rows[0];
          return {
            id: String(user.user_id),
            name: user.username,
            email: user.email,
            role: user.role, // Pass role here so it's available in jwt
            dbUsername: user.username
          };
        } catch (error) {
          console.error("Database error during credentials sign in:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          // Check if user email exists in authentication table
          const result = await pool.query(
            "SELECT * FROM authentication WHERE email = $1",
            [user.email]
          );

          if (result.rows.length === 0) {
            // User not authorized
            return false;
          }

          return true;
        } catch (error) {
          console.error("Database error during sign in:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, account, profile, user, trigger }) {
      // Is this the first sign in?
      if (account && profile) {
        // Google Sign In
        token.email = profile.email;
        token.name = profile.name;

        try {
          const result = await pool.query(
            "SELECT role, username FROM authentication WHERE email = $1",
            [profile.email]
          );

          if (result.rows.length > 0) {
            token.roles = result.rows.map(r => r.role);
            token.role = result.rows[0].role;
            token.dbUsername = result.rows[0].username;
          }
        } catch (error) {
          console.error("Database error fetching role:", error);
        }
      } else if (user) {
        // Credentials Sign In
        token.email = user.email;
        token.name = user.name;
        // User object from authorize() has these fields
        token.role = (user as any).role;
        token.roles = [(user as any).role]; // Credentials user usually has one role row
        token.dbUsername = (user as any).dbUsername;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        (session.user as any).role = token.role as string;
        (session.user as any).roles = token.roles as string[];
        (session.user as any).dbUsername = token.dbUsername as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/", // Redirect to home on error (unauthorized)
  },
});
