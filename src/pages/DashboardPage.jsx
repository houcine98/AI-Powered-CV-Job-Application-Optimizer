import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { analyzeCv, fetchGenerationUsage, fetchHistory, uploadCv } from "../api/client";
import AnalysisCard from "../components/AnalysisCard";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [history, setHistory] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;
    let pollTimer;

    async function loadHistory() {
      try {
        const [data, usageData] = await Promise.all([fetchHistory(), fetchGenerationUsage()]);
        if (!isActive) {
          return;
        }
        setHistory(data);
        setUsage(usageData);

        if (data.some((item) => item.status === "pending" || item.status === "running")) {
          pollTimer = window.setTimeout(loadHistory, 3000);
        }
      } catch (err) {
        if (isActive) {
          setError(err.message);
        }
      } finally {
        if (isActive) {
          setLoadingHistory(false);
        }
      }
    }

    loadHistory();

    return () => {
      isActive = false;
      if (pollTimer) {
        window.clearTimeout(pollTimer);
      }
    };
  }, []);

  const handleAnalyze = async (event) => {
    event.preventDefault();
    if (!file) {
      setError("Please upload your CV first.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const uploadedCv = await uploadCv(file);
      const result = await analyzeCv({
        cv_id: uploadedCv.id,
        job_description: jobDescription,
      });
      const usageData = await fetchGenerationUsage();
      setUsage(usageData);
      setJobDescription("");
      setFile(null);
      navigate(`/results/${result.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-brand-100/80">AI Resume Copilot</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
            Tailor your CV for every role with structured AI feedback.
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            Upload your CV, paste a job description, and we will queue an AI analysis with ATS scoring, gap analysis, a rewritten CV, and a cover letter.
          </p>
        </div>
        <form onSubmit={handleAnalyze} className="glass-panel rounded-[2rem] p-6">
          <div className="space-y-5">
            {usage ? (
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white">Daily generation attempts</p>
                  <p className="text-sm text-slate-300">
                    {usage.remaining} of {usage.limit} remaining
                  </p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${Math.min((usage.used / usage.limit) * 100, 100)}%` }}
                  />
                </div>
                {usage.remaining === 0 ? (
                  <p className="mt-3 text-sm text-amber-100">
                    You reached today&apos;s limit. It resets on {new Date(usage.reset_at).toLocaleString()}.
                  </p>
                ) : null}
              </div>
            ) : null}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Upload CV</label>
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
                className="block w-full rounded-2xl border border-dashed border-white/15 bg-slate-900/60 px-4 py-4 text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-brand-500 file:px-4 file:py-2 file:font-semibold file:text-slate-950"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Job description</label>
              <textarea
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                rows={10}
                minLength={50}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-brand-500"
                placeholder="Paste the target role description here..."
                required
              />
            </div>
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            <button
              type="submit"
              disabled={submitting || usage?.remaining === 0}
              className="w-full rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Queueing analysis..." : usage?.remaining === 0 ? "Daily Limit Reached" : "Start Analysis"}
            </button>
          </div>
        </form>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">Analysis history</h2>
          <p className="text-sm text-slate-400">Queued, running, and completed analyses for previous applications</p>
        </div>
        {loadingHistory ? (
          <div className="glass-panel rounded-3xl p-6 text-slate-300">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="glass-panel rounded-3xl p-6 text-slate-300">No analyses yet.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {history.map((item) => (
              <AnalysisCard key={item.id} analysis={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
