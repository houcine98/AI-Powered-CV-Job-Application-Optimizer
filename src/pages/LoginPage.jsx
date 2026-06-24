import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bootstrapping, isAuthenticated, login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (bootstrapping) {
    return <div className="glass-panel rounded-2xl p-6 text-slate-300">Loading your workspace...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(form);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-brand-100/80">Secure Workspace</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Sign in to optimize and track every application.</h1>
        <p className="mt-4 text-slate-300">
          Your CV uploads, analysis history, rewritten resumes, and cover letters now stay tied to your account.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6">
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-brand-500"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-brand-500"
              required
            />
          </div>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
          <p className="text-center text-sm text-slate-400">
            New here?{" "}
            <Link to="/register" className="font-semibold text-brand-100 hover:text-white">
              Create an account
            </Link>
          </p>
        </div>
      </form>
    </section>
  );
}
