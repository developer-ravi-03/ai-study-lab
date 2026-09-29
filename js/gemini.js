const AI_API_BASE = window.AI_STUDYLAB_API_BASE || "https://REPLACE-WITH-YOUR-VERCEL-URL.vercel.app/api";
window.AIStudyLab = window.AIStudyLab || {};

AIStudyLab.escapeHtml = v => {
  const d = document.createElement("div");
  d.textContent = String(v ?? "");
  return d.innerHTML;
};

AIStudyLab.sleep = ms => new Promise(r => setTimeout(r, ms));

AIStudyLab.setLoading = on => {
  let el = document.querySelector("#aiLoading");
  if (on) {
    if (!el) {
      el = document.createElement("div");
      el.id = "aiLoading";
      el.innerHTML = '<div class="ai-loader-card"><div class="ai-spinner"></div><strong>AI is working</strong><span>Generating your result…</span></div>';
      document.body.appendChild(el);
    }
    el.classList.add("show");
    document.body.setAttribute("aria-busy", "true");
  } else {
    if (el) el.classList.remove("show");
    document.body.removeAttribute("aria-busy");
  }
};

AIStudyLab.generate = async (prompt, { json = false, loading = true } = {}) => {
  if (!AI_API_BASE || AI_API_BASE.includes("REPLACE-WITH-YOUR-VERCEL-URL")) {
    throw new Error("AI backend is not configured yet. Deploy the backend and set its Vercel URL in js/gemini.js.");
  }

  if (loading) AIStudyLab.setLoading(true);

  try {
    const response = await fetch(AI_API_BASE + "/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, json })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "AI service is temporarily unavailable.");
    }

    return data.text || "";
  } finally {
    if (loading) AIStudyLab.setLoading(false);
  }
};
