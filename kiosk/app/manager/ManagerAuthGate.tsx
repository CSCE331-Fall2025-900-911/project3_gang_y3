"use client";
import LoginModal from "../../components/LoginModal";
import { useState, useEffect } from "react";

export default function ManagerAuthGate({ children }: { children: React.ReactNode }) {
  const [showLogin, setShowLogin] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = sessionStorage.getItem('userRole');
      if (role === 'Manager') setShowLogin(false);
    }
  }, []);

  const handleClose = () => {
    setTimeout(() => {
      const role = sessionStorage.getItem('userRole');
      setShowLogin(role !== 'Manager');
    }, 50);
  };
  return showLogin ? (
    <LoginModal role="Manager" onClose={handleClose} />
  ) : (
    <>{children}</>
  );
}
