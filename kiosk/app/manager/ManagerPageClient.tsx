
"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import ManagerClient from "./ManagerClient";
import LoginModal from "../../components/LoginModal";

export default function ManagerPageClient({ initialData, session }: { initialData: any, session: any }) {
  // If session exists passed from server, we are logged in.
  const [showLogin, setShowLogin] = useState(!session?.user);

  useEffect(() => {
    // Sync legacy sessionStorage for other components if needed
    if (session?.user) {
      sessionStorage.setItem("userRole", "Manager");
    }
  }, [session]);

  if (showLogin) {
    return (
      <LoginModal
        role="Manager"
        onClose={() => {
          setShowLogin(false);
          sessionStorage.setItem("userRole", "Manager");
        }}
      />
    );
  }

  return (
    <>
      <ManagerClient initialData={initialData} />
    </>
  );
}
