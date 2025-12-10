import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
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
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.email = profile.email;
        token.name = profile.name;
        
        // Fetch role from database
        try {
          const result = await pool.query(
            "SELECT role, username FROM authentication WHERE email = $1",
            [profile.email]
          );
          
          if (result.rows.length > 0) {
            token.role = result.rows[0].role;
            token.dbUsername = result.rows[0].username;
          }
        } catch (error) {
          console.error("Database error fetching role:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        (session.user as any).role = token.role as string;
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
