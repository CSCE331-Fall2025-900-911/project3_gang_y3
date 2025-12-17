
import { auth, signIn, signOut } from "../lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function MenuSelector() {
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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {!session ? (
          // Unauthenticated State
          <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="space-y-4">
              <h1 className="text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Welcome to our Boba Shop
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
                Please sign in or continue as a guest.
              </p>
            </div>

            <div className="w-full max-w-md space-y-6">
              {/* Username/Password Login Form */}
              <form
                action={async (formData) => {
                  "use server";
                  await signIn("credentials", formData);
                }}
                className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-md border border-zinc-200 dark:border-zinc-800 space-y-4"
              >
                <div className="space-y-2 text-left">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Username</label>
                  <input
                    name="username"
                    type="text"
                    required
                    className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Enter username"
                  />
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
                  <input
                    name="password"
                    type="password"
                    required
                    className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Enter password"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-bold hover:opacity-90 transition-opacity"
                >
                  Sign In
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-300 dark:border-zinc-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-zinc-50 dark:bg-zinc-950 px-2 text-zinc-500">Or</span>
                </div>
              </div>

              {/* Google Sign In */}
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/menu-selector" });
                }}
              >
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 px-8 py-3 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg font-medium shadow-sm border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign in with Google
                </button>
              </form>

              {/* Guest Access */}
              <Link
                href="/kiosk"
                className="block w-full text-center py-3 px-8 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
              >
                Continue to Customer Kiosk
              </Link>
            </div>
          </div>
        ) : (
          // Authenticated State
          <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700">
            <header className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                  Dashboard
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                  Logged in as <span className="font-semibold text-zinc-800 dark:text-zinc-200">{session.user?.name || session.user?.email}</span>
                  {userRole && <span className="ml-2 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs uppercase tracking-wider font-bold">{userRole}</span>}
                </p>
              </div>
              <form
                action={async () => {
                  "use server";
                  await signOut();
                }}
              >
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/10 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </form>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Everyone can access Customer Kiosk */}
              <Link
                href="/kiosk"
                className="group relative overflow-hidden bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-300 border border-zinc-100 dark:border-zinc-800 hover:-translate-y-1"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <svg className="w-24 h-24 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-12 h-12 mb-6 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Customer Kiosk</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 mb-8 flex-grow">
                    Launch the self-service ordering interface for customers.
                  </p>
                  <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium group-hover:translate-x-1 transition-transform">
                    Launch Kiosk <span className="ml-2">→</span>
                  </div>
                </div>
              </Link>

              {/* Manager Portal - Only Managers */}
              {isManager && (
                <Link
                  href="/manager"
                  className="group relative overflow-hidden bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-300 border border-zinc-100 dark:border-zinc-800 hover:-translate-y-1"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-24 h-24 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="w-12 h-12 mb-6 rounded-2xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Manager Portal</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-8 flex-grow">
                      Manage menu items, prices, inventory, and view reports.
                    </p>
                    <div className="flex items-center text-teal-600 dark:text-teal-400 font-medium group-hover:translate-x-1 transition-transform">
                      Enter Portal <span className="ml-2">→</span>
                    </div>
                  </div>
                </Link>
              )}

              {/* Cashier Station - Managers and Cashiers */}
              {(isManager || isCashier) && (
                <Link
                  href="/cashier"
                  className="group relative overflow-hidden bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-300 border border-zinc-100 dark:border-zinc-800 hover:-translate-y-1"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-24 h-24 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="w-12 h-12 mb-6 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Cashier Station</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-8 flex-grow">
                      Process orders and handle payments manually at the counter.
                    </p>
                    <div className="flex items-center text-amber-600 dark:text-amber-400 font-medium group-hover:translate-x-1 transition-transform">
                      Open Station <span className="ml-2">→</span>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
