document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#resumeForm"),
    preview = document.querySelector("#preview"),
    status = document.querySelector("#status"),
    previewStatus = document.querySelector("#previewStatus"),
    reset = document.querySelector("#reset"),
    print = document.querySelector("#printBtn");
  const esc = AIStudyLab.escapeHtml;
  const val = (id) => document.querySelector("#" + id).value.trim();

  const textValue = (value, fallback = "") => {
    if (value == null) return fallback;
    if (typeof value === "string") return value;
    if (Array.isArray(value))
      return value
        .map((v) => textValue(v))
        .filter(Boolean)
        .join(" • ");
    if (typeof value === "object")
      return Object.values(value)
        .map((v) => textValue(v))
        .filter(Boolean)
        .join(" • ");
    return String(value);
  };

  const experienceItems = (value, fallback) => {
    if (!Array.isArray(value)) {
      const text = textValue(value, fallback);
      return text ? [text] : [];
    }
    return value.flatMap((item) => {
      if (typeof item === "string") return [item];
      if (item && typeof item === "object") {
        const preferred = [
          "bullet",
          "description",
          "details",
          "achievement",
          "text",
          "role",
          "title",
          "company",
        ];
        const preferredText = preferred
          .map((k) => item[k])
          .filter((v) => v != null)
          .map((v) => textValue(v))
          .filter(Boolean);
        if (preferredText.length) return [preferredText.join(" — ")];
        return [textValue(item)].filter(Boolean);
      }
      return [];
    });
  };

  const render = (r) => {
    const skills = Array.isArray(r.skills)
      ? r.skills
          .map((v) => textValue(v))
          .filter(Boolean)
          .join(", ")
      : textValue(r.skills, val("skills"));
    const exp = experienceItems(r.experience, val("experience"));
    preview.innerHTML =
      "<h3>" +
      esc(textValue(r.name, val("name"))) +
      "</h3><div class='contact'>" +
      esc(textValue(r.contact, val("contact"))) +
      "</div><h4>Objective</h4><p>" +
      esc(textValue(r.objective, val("objective"))) +
      "</p><h4>Education</h4><p>" +
      esc(textValue(r.education, val("education"))).replace(/\n/g, "<br>") +
      "</p><h4>Skills</h4><p>" +
      esc(skills) +
      "</p><h4>Experience</h4><ul>" +
      (exp.length
        ? exp.map((x) => "<li>" + esc(x) + "</li>").join("")
        : "<li>" + esc(val("experience")) + "</li>") +
      "</ul>";
    print.classList.add("show");
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const input = {
      name: val("name"),
      contact: val("contact"),
      education: val("education"),
      skills: val("skills"),
      experience: val("experience"),
      objective: val("objective"),
    };
    status.textContent = "WORKING";
    previewStatus.textContent = "GENERATING";
    preview.innerHTML =
      "<div class='empty'>Gemini is preparing your resume content…</div>";
    const prompt = `Improve and structure this resume data for a student/professional resume. Do not invent employers, degrees, dates, skills, achievements or contact details. You may rewrite wording and turn supplied experience into concise bullet points using only supplied facts. Preserve the user's facts accurately. Return valid JSON only with exactly this shape: {"name":"","contact":"","objective":"","education":"","skills":[""],"experience":[""]}. Every experience item MUST be a plain string, not an object. Data: ${JSON.stringify(input)}`;
    try {
      const raw = await AIStudyLab.generate(prompt, { json: true });
      const cleaned = raw.replace(/^\`\`\`json|^\`\`\`|\`\`\`$/g, "").trim();
      const data = JSON.parse(cleaned);
      render(data);
      status.textContent = "READY";
      previewStatus.textContent = "AI DRAFT";
    } catch (err) {
      status.textContent = "ERROR";
      previewStatus.textContent = "FAILED";
      preview.innerHTML = "<div class='empty'>" + esc(err.message) + "</div>";
    }
  });
  reset.addEventListener("click", () => {
    form.reset();
    status.textContent = "READY";
    previewStatus.textContent = "EMPTY";
    preview.innerHTML =
      "<div class='empty'>Complete the profile form to create your resume preview.</div>";
    print.classList.remove("show");
  });
  print.addEventListener("click", () => window.print());
});
