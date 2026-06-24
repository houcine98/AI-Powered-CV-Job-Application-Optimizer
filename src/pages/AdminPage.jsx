import { useEffect, useState } from "react";

import {
  deleteAdminAnalysis,
  deleteAdminCv,
  deleteAdminUser,
  fetchAdminDashboard,
  updateAdminUser,
} from "../api/client";

const STATUS_STYLES = {
  pending: "bg-amber-500/15 text-amber-100",
  running: "bg-sky-500/15 text-sky-100",
  completed: "bg-brand-500/15 text-brand-100",
  failed: "bg-rose-500/15 text-rose-100",
};

function StatCard({ label, value }) {
  return (
    <div className="glass-panel rounded-2xl p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="overflow-x-auto rounded-2xl border border-white/10">{children}</div>
    </section>
  );
}

function ActionButton({ tone = "neutral", children, ...props }) {
  const tones = {
    neutral: "border-white/15 text-slate-100 hover:border-brand-500 hover:bg-white/5",
    danger: "border-rose-400/30 text-rose-100 hover:border-rose-300 hover:bg-rose-500/10",
  };

  return (
    <button
      type="button"
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default function AdminPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyAction, setBusyAction] = useState("");

  async function loadDashboard() {
    try {
      const data = await fetchAdminDashboard();
      setDashboard(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const runAction = async (actionKey, action) => {
    setBusyAction(actionKey);
    setError("");
    try {
      await action();
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyAction("");
    }
  };

  if (loading) {
    return <div className="glass-panel rounded-2xl p-6 text-slate-300">Loading admin dashboard...</div>;
  }

  if (error && !dashboard) {
    return <div className="glass-panel rounded-2xl p-6 text-rose-300">{error}</div>;
  }

  const stats = dashboard.stats;
  const analysisStateCount = stats.pending_analyses + stats.running_analyses + stats.failed_analyses;

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-brand-100/80">Admin Console</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Site operations dashboard</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Manage accounts, uploaded CVs, analysis jobs, role access, and cleanup from a separate admin workspace.
          </p>
        </div>
        {error ? <p className="rounded-full border border-rose-400/30 px-4 py-2 text-sm text-rose-100">{error}</p> : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Users" value={`${stats.active_users}/${stats.total_users}`} />
        <StatCard label="CV uploads" value={stats.total_cvs} />
        <StatCard label="Analyses" value={stats.total_analyses} />
        <StatCard label="Needs attention" value={analysisStateCount} />
        <StatCard label="Average score" value={stats.average_match_score === null ? "N/A" : `${stats.average_match_score}%`} />
      </section>

      <Section title="Users">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Usage</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {dashboard.users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 text-white">{user.full_name}</td>
                <td className="px-4 py-3 text-slate-300">{user.email}</td>
                <td className="px-4 py-3 text-slate-300">{user.is_admin ? "Admin" : "User"}</td>
                <td className="px-4 py-3 text-slate-300">{user.is_active ? "Active" : "Disabled"}</td>
                <td className="px-4 py-3 text-slate-300">
                  {user.cv_count} CVs, {user.analysis_count} analyses
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <ActionButton
                      disabled={Boolean(busyAction)}
                      onClick={() =>
                        runAction(`role-${user.id}`, () => updateAdminUser(user.id, { is_admin: !user.is_admin }))
                      }
                    >
                      {user.is_admin ? "Make user" : "Make admin"}
                    </ActionButton>
                    <ActionButton
                      disabled={Boolean(busyAction)}
                      onClick={() =>
                        runAction(`status-${user.id}`, () => updateAdminUser(user.id, { is_active: !user.is_active }))
                      }
                    >
                      {user.is_active ? "Disable" : "Enable"}
                    </ActionButton>
                    <ActionButton
                      tone="danger"
                      disabled={Boolean(busyAction)}
                      onClick={() => {
                        if (window.confirm(`Delete ${user.email} and all related data?`)) {
                          runAction(`delete-user-${user.id}`, () => deleteAdminUser(user.id));
                        }
                      }}
                    >
                      Delete
                    </ActionButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Recent Analyses">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="px-4 py-3 font-medium">CV</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {dashboard.analyses.map((analysis) => (
              <tr key={analysis.id}>
                <td className="px-4 py-3 text-white">{analysis.file_name}</td>
                <td className="px-4 py-3 text-slate-300">{analysis.user_email}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[analysis.status] || STATUS_STYLES.pending}`}>
                    {analysis.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-300">{analysis.match_score === null ? "N/A" : `${analysis.match_score}%`}</td>
                <td className="px-4 py-3 text-slate-300">{new Date(analysis.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <ActionButton
                    tone="danger"
                    disabled={Boolean(busyAction)}
                    onClick={() => {
                      if (window.confirm(`Delete analysis #${analysis.id}?`)) {
                        runAction(`delete-analysis-${analysis.id}`, () => deleteAdminAnalysis(analysis.id));
                      }
                    }}
                  >
                    Delete
                  </ActionButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Recent CV Uploads">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="px-4 py-3 font-medium">File</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Analyses</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {dashboard.cvs.map((cv) => (
              <tr key={cv.id}>
                <td className="px-4 py-3 text-white">{cv.file_name}</td>
                <td className="px-4 py-3 text-slate-300">{cv.user_email}</td>
                <td className="px-4 py-3 text-slate-300">{cv.analysis_count}</td>
                <td className="px-4 py-3 text-slate-300">{new Date(cv.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <ActionButton
                    tone="danger"
                    disabled={Boolean(busyAction)}
                    onClick={() => {
                      if (window.confirm(`Delete ${cv.file_name} and its analyses?`)) {
                        runAction(`delete-cv-${cv.id}`, () => deleteAdminCv(cv.id));
                      }
                    }}
                  >
                    Delete
                  </ActionButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  );
}
