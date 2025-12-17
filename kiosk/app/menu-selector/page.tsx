import { auth } from "../../lib/auth";
import MenuSelectorClient from "./MenuSelectorClient";

export default async function MenuSelectorPage() {
  const session = await auth();

  // Get user role(s) to determine what they can see
  // Default to what's in the session, which might be a single role or array
  const userRole = (session?.user as any)?.role;
  const userRoles = (session?.user as any)?.roles || [];

  // Helper to check role access
  const hasRole = (role: string) => {
    return userRole === role || userRoles.includes(role);
  };

  const isManager = hasRole('Manager');
  const isCashier = hasRole('Cashier');

  return <MenuSelectorClient session={session} userRole={userRole} isManager={isManager} isCashier={isCashier} />;
}
