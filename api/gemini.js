const MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.5-flash-lite"];
const BASE = "https://generativelanguage.googleapis.com/v1beta/models/";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

export default async function handler(req, res) {
  cors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: "Gemini API key is not configured on the server." });

  const { prompt, json = false } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "A prompt is required." });
  }

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.35, maxOutputTokens: 5000 }
  };
  if (json) body.generationConfig.responseMimeType = "application/json";

  let lastError = null;

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(BASE + model + ":generateContent", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify(body)
        });

        const data = await response.json();

        if (response.ok) {
          const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
          if (text) return res.status(200).json({ text });
          lastError = new Error("Gemini returned an empty response.");
          break;
        }

        const status = response.status;
        const message = data?.error?.message || "";

        if (status === 400 || status === 401 || status === 403 || status === 429) {
          return res.status(status).json({
            error: status === 429
              ? "Gemini rate limit reached. Please wait a little and try again."
              : message || "Gemini rejected the request."
          });
        }

        if (status === 404) {
          lastError = new Error("This Gemini model is unavailable for the current API project.");
          break;
        }

        lastError = new Error(message || "Gemini is temporarily unavailable.");
        if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 1200));
      } catch (error) {
        lastError = error;
        if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 1200));
      }
    }
  }

  return res.status(503).json({
    error: lastError?.message || "Gemini is temporarily unavailable. Please try again."
  });
}
