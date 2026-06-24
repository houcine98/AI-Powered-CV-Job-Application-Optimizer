import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { buildResume, downloadResumeFile, fetchAnalysis, fetchResumeTemplates } from "../api/client";

function ResultList({ title, items }) {
  return (
    <div className="glass-panel rounded-[2rem] p-6">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <ul className="mt-4 space-y-3 text-slate-300">
        {items.map((item) => (
          <li key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function downloadTextFile(fileName, text) {
  const blob = new Blob([text || ""], { type: "text/plain;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function GeneratedDocumentPanel({ title, fileName, text }) {
  const [copied, setCopied] = useState(false);
  const hasText = Boolean(text?.trim());

  const handleCopy = async () => {
    if (!hasText) {
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article className="glass-panel rounded-[2rem] p-6">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
          <p className="mt-2 text-sm text-slate-400">Generated content from your CV and the target job description.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!hasText}
            className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:border-brand-500 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={() => downloadTextFile(fileName, text)}
            disabled={!hasText}
            className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:border-brand-500 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Download TXT
          </button>
        </div>
      </div>
      <div className="mt-5 max-h-[38rem] overflow-auto rounded-2xl border border-white/10 bg-slate-950/70 p-5">
        <pre className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-200">
          {hasText ? text : "No generated content is available yet."}
        </pre>
      </div>
    </article>
  );
}

function TemplatePreview({ template, selected, onSelect }) {
  const isTwoColumn = template.preview.layout === "two-column";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-lg border p-4 text-left transition ${
        selected ? "border-brand-500 bg-brand-500/10" : "border-white/10 bg-white/5 hover:border-brand-500/50"
      }`}
    >
      <div className="aspect-[4/5] rounded-lg border border-white/10 bg-slate-950 p-3" style={{ "--accent": template.preview.accent }}>
        <div className="h-2 w-2/3 rounded bg-white" />
        <div className="mt-2 h-1.5 w-1/2 rounded" style={{ backgroundColor: template.preview.accent }} />
        <div className={`mt-4 grid h-[78%] gap-2 ${isTwoColumn ? "grid-cols-[0.35fr_0.65fr]" : "grid-cols-1"}`}>
          {isTwoColumn ? (
            <div className="space-y-2 border-r border-white/10 pr-2">
              <div className="h-1.5 rounded bg-white/60" />
              <div className="h-1.5 rounded bg-white/30" />
              <div className="h-1.5 rounded bg-white/30" />
              <div className="mt-3 h-1.5 rounded" style={{ backgroundColor: template.preview.accent }} />
              <div className="h-1.5 rounded bg-white/30" />
            </div>
          ) : null}
          <div className="space-y-2">
            <div className="h-1.5 rounded" style={{ backgroundColor: template.preview.accent }} />
            <div className="h-1.5 rounded bg-white/40" />
            <div className="h-1.5 rounded bg-white/40" />
            <div className="h-1.5 w-5/6 rounded bg-white/30" />
            <div className="mt-3 h-1.5 rounded" style={{ backgroundColor: template.preview.accent }} />
            <div className="h-1.5 rounded bg-white/40" />
            <div className="h-1.5 w-4/5 rounded bg-white/30" />
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">{template.name}</h3>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{template.category}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs ${template.ats_friendly ? "bg-brand-500/15 text-brand-100" : "bg-amber-500/15 text-amber-100"}`}>
          {template.ats_friendly ? "ATS" : "Visual"}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-300">{template.description}</p>
      <p className="mt-3 text-xs text-slate-500">{template.best_for}</p>
    </button>
  );
}

function ResumeBuilder({ analysis, onResumeGenerated }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(analysis.resume_template_id || "");
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState("");
  const [error, setError] = useState("");
  const hasGeneratedResume = analysis.has_latex_resume || analysis.has_resume_pdf;

  useEffect(() => {
    let isActive = true;
    async function loadTemplates() {
      try {
        const data = await fetchResumeTemplates();
        if (!isActive) {
          return;
        }
        setTemplates(data);
        setSelectedTemplateId((current) => current || data[0]?.id || "");
      } catch (err) {
        if (isActive) {
          setError(err.message);
        }
      } finally {
        if (isActive) {
          setLoadingTemplates(false);
        }
      }
    }
    loadTemplates();
    return () => {
      isActive = false;
    };
  }, []);

  const handleGenerate = async () => {
    if (!selectedTemplateId) {
      setError("Choose a template first.");
      return;
    }
    setGenerating(true);
    setError("");
    try {
      await buildResume(analysis.id, { template_id: selectedTemplateId });
      await onResumeGenerated();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (type) => {
    setDownloading(type);
    setError("");
    try {
      await downloadResumeFile(analysis.id, type);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading("");
    }
  };

  return (
    <section className="glass-panel rounded-[2rem] p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-brand-100/80">LaTeX Resume Builder</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Choose a template and generate a polished PDF resume</h2>
          <p className="mt-3 max-w-3xl text-slate-300">
            These original styles are based on common resume families: ATS classic, modern two-column, compact tech, executive, academic, and creative minimal.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || loadingTemplates}
            className="rounded-lg bg-brand-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {generating ? "Generating PDF..." : hasGeneratedResume ? "Regenerate Resume" : "Generate Resume"}
          </button>
          {hasGeneratedResume ? (
            <>
              <button
                type="button"
                onClick={() => handleDownload("pdf")}
                disabled={Boolean(downloading) || !analysis.has_resume_pdf}
                className="rounded-lg border border-white/15 px-4 py-3 font-semibold text-white transition hover:border-brand-500 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloading === "pdf" ? "Downloading..." : "Download PDF"}
              </button>
              <button
                type="button"
                onClick={() => handleDownload("tex")}
                disabled={Boolean(downloading) || !analysis.has_latex_resume}
                className="rounded-lg border border-white/15 px-4 py-3 font-semibold text-white transition hover:border-brand-500 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloading === "tex" ? "Downloading..." : "Download LaTeX"}
              </button>
            </>
          ) : null}
        </div>
      </div>

      {error || analysis.resume_error_message ? (
        <p className="mt-5 rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error || analysis.resume_error_message}
        </p>
      ) : null}

      {analysis.resume_generated_at ? (
        <p className="mt-4 text-sm text-slate-400">
          Last generated with {analysis.resume_template_id} on {new Date(analysis.resume_generated_at).toLocaleString()}.
        </p>
      ) : null}

      {loadingTemplates ? (
        <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-5 text-slate-300">Loading templates...</div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <TemplatePreview
              key={template.id}
              template={template}
              selected={template.id === selectedTemplateId}
              onSelect={() => setSelectedTemplateId(template.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function StatusPanel({ analysis }) {
  const copy = {
    pending: {
      title: "Analysis queued",
      description: "Your CV and job description are saved. The AI worker will start shortly.",
      tone: "text-amber-100 border-amber-500/30 bg-amber-500/10",
    },
    running: {
      title: "Analysis running",
      description: "The AI is generating scoring, recommendations, a rewritten CV, and a tailored cover letter.",
      tone: "text-sky-100 border-sky-500/30 bg-sky-500/10",
    },
    failed: {
      title: "Analysis failed",
      description: analysis.error_message || "The analysis could not be completed.",
      tone: "text-rose-100 border-rose-500/30 bg-rose-500/10",
    },
  };

  const state = copy[analysis.status] || copy.pending;

  return (
    <section className={`rounded-[2rem] border px-6 py-5 ${state.tone}`}>
      <h2 className="text-xl font-semibold">{state.title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6">{state.description}</p>
      {analysis.status !== "failed" ? (
        <p className="mt-4 text-sm text-slate-300">This page refreshes automatically while the job is in progress.</p>
      ) : null}
    </section>
  );
}

export default function ResultsPage() {
  const { analysisId } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;
    let pollTimer;

    async function loadAnalysis() {
      try {
        const data = await fetchAnalysis(analysisId);
        if (!isActive) {
          return;
        }
        setAnalysis(data);
        setError("");

        if (data.status === "pending" || data.status === "running") {
          pollTimer = window.setTimeout(loadAnalysis, 2500);
        }
      } catch (err) {
        if (isActive) {
          setError(err.message);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadAnalysis();

    return () => {
      isActive = false;
      if (pollTimer) {
        window.clearTimeout(pollTimer);
      }
    };
  }, [analysisId]);

  const reloadAnalysis = async () => {
    const data = await fetchAnalysis(analysisId);
    setAnalysis(data);
    setError("");
  };

  if (loading) {
    return <div className="glass-panel rounded-[2rem] p-6 text-slate-300">Loading analysis...</div>;
  }

  if (error) {
    return <div className="glass-panel rounded-[2rem] p-6 text-rose-300">{error}</div>;
  }

  const isCompleted = analysis.status === "completed";

  return (
    <div className="space-y-8">
      <section className="glass-panel rounded-[2rem] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm text-slate-400">{analysis.file_name}</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">AI Optimization Results</h1>
            <p className="mt-3 max-w-3xl whitespace-pre-wrap text-slate-300">{analysis.job_description}</p>
          </div>
          <div className="rounded-[1.5rem] border border-brand-500/30 bg-brand-500/10 px-6 py-5 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-brand-100">
              {isCompleted ? "ATS Match" : "Status"}
            </p>
            <p className="mt-2 text-4xl font-semibold text-white">
              {isCompleted && analysis.match_score !== null
                ? `${analysis.match_score}%`
                : analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1)}
            </p>
          </div>
        </div>
      </section>

      {isCompleted ? (
        <>
          <section className="grid gap-6 lg:grid-cols-3">
            <ResultList title="Missing Skills" items={analysis.missing_skills} />
            <ResultList title="Strengths" items={analysis.strengths} />
            <ResultList title="Weaknesses" items={analysis.weaknesses} />
          </section>

          <section>
            <ResultList title="Suggestions" items={analysis.suggestions} />
          </section>

          <ResumeBuilder analysis={analysis} onResumeGenerated={reloadAnalysis} />

          <section className="grid gap-6 xl:grid-cols-2">
            <GeneratedDocumentPanel
              title="Rewritten CV"
              fileName={`rewritten-cv-${analysis.id}.txt`}
              text={analysis.rewritten_cv}
            />
            <GeneratedDocumentPanel
              title="Generated Cover Letter"
              fileName={`cover-letter-${analysis.id}.txt`}
              text={analysis.cover_letter}
            />
          </section>
        </>
      ) : (
        <StatusPanel analysis={analysis} />
      )}
    </div>
  );
}
