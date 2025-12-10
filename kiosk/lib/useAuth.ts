"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

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
  const [authState, setAuthState] = useState<AuthUser>(() => {
    // Initialize from sessionStorage if available (only on client)
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
    return {
      role: null,
      username: null,
      isAuthenticated: false,
      isLoading: true,
    };
  });

  useEffect(() => {
    // Check session storage first (for username/password login)
    const storedRole = sessionStorage.getItem('userRole');
    const storedUsername = sessionStorage.getItem('username');

    if (storedRole && storedUsername) {
      setAuthState({
        role: storedRole,
        username: storedUsername,
        isAuthenticated: true,
        isLoading: false,
      });
      return;
    }

    // Check OAuth session - wait until status is not loading
    if (status === "loading") {
      // Keep loading state, don't change anything yet
      return;
    }

    if (session?.user) {
      const user = session.user as SessionUser;
      
      // Check if there's a pending role from the login flow
      const pendingRole = sessionStorage.getItem('pendingRole');
      const pendingUsername = sessionStorage.getItem('pendingUsername');
      
      let finalRole = pendingRole || user.role;
      let finalUsername = pendingUsername || user.dbUsername || user.name;
      
      if (pendingRole) {
        // Clear the pending values
        sessionStorage.removeItem('pendingRole');
        sessionStorage.removeItem('pendingUsername');
      }
      
      if (finalRole) {
        // Store in sessionStorage for persistence
        sessionStorage.setItem('userRole', finalRole);
        sessionStorage.setItem('username', finalUsername || '');
        
        setAuthState({
          role: finalRole,
          username: finalUsername || null,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }
    }

    // Only set to not loading/not authenticated if we've finished checking everything
    setAuthState({
      role: null,
      username: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, [session, status]);

  return authState;
}
