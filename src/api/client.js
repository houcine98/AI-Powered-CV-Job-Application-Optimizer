const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const TOKEN_STORAGE_KEY = "ai_cv_optimizer_token";

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token) {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken() {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getStoredToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  return handleResponse(response);
}

async function requestBlob(path) {
  const headers = new Headers();
  const token = getStoredToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const response = await fetch(`${API_BASE_URL}${path}`, { headers });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Download failed");
  }
  return response.blob();
}

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) {
      clearStoredToken();
    }
    throw new Error(data.detail || "Request failed");
  }
  return data;
}

export async function registerAccount(payload) {
  return request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function loginAccount(payload) {
  return request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function fetchCurrentUser() {
  return request("/auth/me");
}

export async function uploadCv(file) {
  const formData = new FormData();
  formData.append("file", file);

  return request("/upload-cv", {
    method: "POST",
    body: formData,
  });
}

export async function analyzeCv(payload) {
  return request("/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function fetchGenerationUsage() {
  return request("/generation-usage");
}

export async function fetchHistory() {
  return request("/history");
}

export async function fetchAnalysis(analysisId) {
  return request(`/history/${analysisId}`);
}

export async function fetchResumeTemplates() {
  return request("/resume-templates");
}

export async function buildResume(analysisId, payload) {
  return request(`/analyses/${analysisId}/resume`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function downloadResumeFile(analysisId, type) {
  const blob = await requestBlob(`/analyses/${analysisId}/resume.${type}`);
  const extension = type === "pdf" ? "pdf" : "tex";
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `optimized-resume-${analysisId}.${extension}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function fetchAdminDashboard() {
  return request("/admin/dashboard");
}

export async function updateAdminUser(userId, payload) {
  return request(`/admin/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminUser(userId) {
  return request(`/admin/users/${userId}`, { method: "DELETE" });
}

export async function deleteAdminAnalysis(analysisId) {
  return request(`/admin/analyses/${analysisId}`, { method: "DELETE" });
}

export async function deleteAdminCv(cvId) {
  return request(`/admin/cvs/${cvId}`, { method: "DELETE" });
}
