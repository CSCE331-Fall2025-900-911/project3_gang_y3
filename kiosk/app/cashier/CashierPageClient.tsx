
"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import CashierClient from "./CashierClient";
import LoginModal from "../../components/LoginModal";

export default function CashierPageClient({ menuItems }: { menuItems: any }) {
  const [showLogin, setShowLogin] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    // If NextAuth session exists, we consider them authenticated as Cashier
    // We check session.user (email might be missing for credentials)
    if (session?.user) {
      sessionStorage.setItem("userRole", "Cashier");
      if (!sessionStorage.getItem("username")) {
        const fallbackUsername = session.user.name || session.user.email || "Cashier";
        sessionStorage.setItem("username", fallbackUsername);
      }
      setShowLogin(false);
    } else if (typeof window !== "undefined") {
      const role = sessionStorage.getItem("userRole");
      const username = sessionStorage.getItem("username");
      // Show login if either role is not Cashier OR username is missing
      setShowLogin(role !== "Cashier" || !username);
    }
  }, [session]);

  if (showLogin) {
    return (
      <LoginModal
        role="Cashier"
        onClose={() => {
          // LoginModal sets sessionStorage items (role, username)
          setShowLogin(false);
        }}
      />
    );
  }

  return (
    <>
      <CashierClient menuItems={menuItems} />
    </>
  );
}
