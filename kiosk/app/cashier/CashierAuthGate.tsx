"use client";
import LoginModal from "../../components/LoginModal";
import { useState, useEffect } from "react";

export default function CashierAuthGate({ children }: { children: React.ReactNode }) {
  const [showLogin, setShowLogin] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = sessionStorage.getItem('userRole');
      if (role === 'Cashier') setShowLogin(false);
    }
  }, []);

  const handleClose = () => {
    // Wait a tick to let sessionStorage update
    setTimeout(() => {
      const role = sessionStorage.getItem('userRole');
      setShowLogin(role !== 'Cashier');
    }, 50);
  };
  return showLogin ? (
    <LoginModal role="Cashier" onClose={handleClose} />
  ) : (
    <>{children}</>
  );
}
