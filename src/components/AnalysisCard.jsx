import { Link } from "react-router-dom";

const STATUS_STYLES = {
  pending: "bg-amber-500/15 text-amber-100",
  running: "bg-sky-500/15 text-sky-100",
  completed: "bg-brand-500/15 text-brand-100",
  failed: "bg-rose-500/15 text-rose-100",
};

export default function AnalysisCard({ analysis }) {
  const statusLabel = analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1);
  const statusClassName = STATUS_STYLES[analysis.status] || STATUS_STYLES.pending;

  return (
    <div className="glass-panel rounded-3xl p-5 transition hover:border-brand-500/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{new Date(analysis.created_at).toLocaleString()}</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{analysis.file_name}</h3>
        </div>
        <div className={`rounded-full px-4 py-2 text-sm font-semibold ${statusClassName}`}>
          {analysis.status === "completed" && analysis.match_score !== null
            ? `${analysis.match_score}%`
            : statusLabel}
        </div>
      </div>
      <Link
        to={`/results/${analysis.id}`}
        className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm text-white transition hover:border-brand-500 hover:bg-white/5"
      >
        {analysis.status === "completed" ? "View Results" : "Open Analysis"}
      </Link>
    </div>
  );
}
