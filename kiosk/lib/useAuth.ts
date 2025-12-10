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
      
      // Check if there's a pending role from the login flow
      let finalRole = user.role;
      let finalUsername = user.dbUsername || user.name;
      
      if (typeof window !== 'undefined') {
        const pendingRole = sessionStorage.getItem('pendingRole');
        const pendingUsername = sessionStorage.getItem('pendingUsername');
        
        if (pendingRole) {
          // Use the role that was verified during login
          finalRole = pendingRole;
          finalUsername = pendingUsername || finalUsername;
          
          // Clear the pending values and store as active
          sessionStorage.removeItem('pendingRole');
          sessionStorage.removeItem('pendingUsername');
          sessionStorage.setItem('userRole', finalRole);
          sessionStorage.setItem('username', finalUsername || '');
        }
      }
      
      if (finalRole) {
        // Store in sessionStorage for consistency
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('userRole', finalRole);
          sessionStorage.setItem('username', finalUsername || '');
        }
        
        return {
          role: finalRole,
          username: finalUsername || null,
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
