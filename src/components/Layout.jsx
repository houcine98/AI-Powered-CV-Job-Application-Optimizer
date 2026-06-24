import { Link, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-slate-950/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <Link to="/" className="text-lg font-semibold tracking-tight text-white">
            AI CV Optimizer
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            {user ? (
              <>
                <Link to="/" className="rounded-full border border-white/15 px-4 py-2 text-slate-300 transition hover:border-brand-500 hover:text-white">
                  Workspace
                </Link>
                {user.is_admin ? (
                  <Link to="/admin" className="rounded-full border border-brand-500/40 px-4 py-2 font-semibold text-brand-100 transition hover:bg-brand-500/10">
                    Admin
                  </Link>
                ) : null}
                <span className="rounded-full border border-white/15 px-4 py-2 text-slate-300">{user.full_name}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full border border-white/15 px-4 py-2 text-slate-300 transition hover:border-rose-300 hover:text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-full border border-white/15 px-4 py-2 text-slate-300 transition hover:border-brand-500 hover:text-white">
                  Login
                </Link>
                <Link to="/register" className="rounded-full bg-brand-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-brand-600">
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
