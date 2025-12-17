
"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import CashierClient from "./CashierClient";
import LoginModal from "../../components/LoginModal";

export default function CashierPageClient({ menuItems, session }: { menuItems: any, session: any }) {
  // If session exists passed from server, we are logged in.
  const [showLogin, setShowLogin] = useState(!session?.user);

  useEffect(() => {
    if (session?.user) {
      sessionStorage.setItem("userRole", "Cashier");
      const fallbackUsername = session.user.name || session.user.email || "Cashier";
      sessionStorage.setItem("username", fallbackUsername);
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
