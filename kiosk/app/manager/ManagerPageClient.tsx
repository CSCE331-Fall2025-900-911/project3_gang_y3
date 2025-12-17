
"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import ManagerClient from "./ManagerClient";
import LoginModal from "../../components/LoginModal";

export default function ManagerPageClient({ initialData }: { initialData: any }) {
  const [showLogin, setShowLogin] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    // Check if session exists (email might be missing for credential users)
    if (session?.user) {
      sessionStorage.setItem("userRole", "Manager");
      setShowLogin(false);
    } else if (typeof window !== "undefined") {
      const role = sessionStorage.getItem("userRole");
      setShowLogin(role !== "Manager");
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
