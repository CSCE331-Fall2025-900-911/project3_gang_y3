"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";

interface AuthUser {
  role: string | null;
  username: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface SessionUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  dbUsername?: string;
}

export function useAuth(): AuthUser {
  const { data: session, status } = useSession();

  const authUser = useMemo(() => {
    // Check session storage first (for username/password login)
    if (typeof window !== 'undefined') {
      const storedRole = sessionStorage.getItem('userRole');
      const storedUsername = sessionStorage.getItem('username');

      if (storedRole && storedUsername) {
        return {
          role: storedRole,
          username: storedUsername,
          isAuthenticated: true,
          isLoading: false,
        };
      }
    }

    // Check OAuth session
    if (status === "loading") {
      return {
        role: null,
        username: null,
        isAuthenticated: false,
        isLoading: true,
      };
    }

    if (session?.user) {
      const user = session.user as SessionUser;
      const oauthRole = user.role;
      const oauthUsername = user.dbUsername || user.name;
      
      if (oauthRole) {
        // Store in sessionStorage for consistency
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('userRole', oauthRole);
          sessionStorage.setItem('username', oauthUsername || '');
        }
        
        return {
          role: oauthRole,
          username: oauthUsername || null,
          isAuthenticated: true,
          isLoading: false,
        };
      }
    }

    return {
      role: null,
      username: null,
      isAuthenticated: false,
      isLoading: false,
    };
  }, [session, status]);

  return authUser;
}
