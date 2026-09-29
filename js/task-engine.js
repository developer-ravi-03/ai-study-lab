const configs = {
  2: {
    button: "Generate Notes",
    prompt: v => `Create polished, exam-ready study notes from this material. Use Markdown headings, short bullet points, definitions, examples, and a concise recap. Do not use decorative symbols or Markdown tables. Keep the content accurate to the supplied topic. Material:\n${v}`
  },
  3: {
    button: "Generate Slides",
    prompt: v => `Create exactly 6 classroom presentation slides. Return JSON only: {"slides":[{"title":"...","points":["...","...","..."]}]}. Keep titles concise and points presentation-ready. Topic:\n${v}`
  },
  4: {
    button: "Generate Mind Map",
    prompt: v => `Create a concise hierarchical mind map. Return JSON only: {"title":"...","branches":[{"name":"...","children":["...","..."]}]}. Topic:\n${v}`
  },
  6: {
    button: "Generate Quiz",
    prompt: v => `Create 8 multiple-choice questions. Return JSON only: {"questions":[{"question":"...","options":["A","B","C","D"],"answer":0,"explanation":"..."}]}. Answer is a zero-based option index. Topic:\n${v}`
  },
  8: {
    button: "Generate Cards",
    prompt: v => `Create 10 useful revision flashcards. Return JSON only: {"cards":[{"front":"...","back":"..."}]}. Topic:\n${v}`
  },
  9: {
    button: "Build Plan",
    prompt: v => `Create a practical day-wise study plan. Return JSON only: {"summary":"...","days":[{"day":"Day 1","tasks":[{"subject":"...","duration":"...","task":"..."}]}]}. Requirements:\n${v}`
  }
};

const esc = AIStudyLab.escapeHtml;
let currentSlides = [];
let slideIndex = 0;
let quizScore = 0;
let quizTotal = 0;

function setStatus(el, text) {
  if (!el) return;
  el.textContent = text;
  const state = /WORKING|GENERATING/i.test(text) ? "working" : /ERROR|FAILED/i.test(text) ? "error" : "ready";
  el.dataset.state = state;
}

function cleanJson(raw) {
  return String(raw).replace(/^\`\`\`json\s*/i, "").replace(/^\`\`\`\s*/, "").replace(/\s*\`\`\`$/, "").trim();
}

function prettyMarkdown(text) {
  const lines = String(text).split(/\r?\n/);
  const html = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      closeList();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${esc(heading[2])}</h${level}>`);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${esc(line.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${esc(line).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}</p>`);
  }

  closeList();
  return html.join("");
}

function renderJson(id, data) {
  if (id === 3) {
    currentSlides = Array.isArray(data.slides) ? data.slides : [];
    slideIndex = 0;
    return `
      <div id="slideStage"></div>
      <div class="actions result-actions">
        <button class="quiet" id="prevSlide" type="button">← Previous</button>
        <button class="quiet" id="nextSlide" type="button">Next →</button>
        <button class="quiet" id="printSlides" type="button">Print</button>
        <button class="quiet export-btn" id="downloadPptx" type="button">Download PPTX</button>
        <button class="quiet export-btn" id="downloadPresentationPdf" type="button">Download PDF</button>
      </div>`;
  }

  if (id === 4) {
    return `
      <div class="mindmap">
        <div class="mindmap-title">${esc(data.title || "Mind Map")}</div>
        ${(data.branches || []).map(branch => `
          <section>
            <h3>${esc(branch.name || "")}</h3>
            <ul>${(branch.children || []).map(child => `<li>${esc(typeof child === "string" ? child : JSON.stringify(child))}</li>`).join("")}</ul>
          </section>`).join("")}
      </div>`;
  }

  if (id === 6) {
    quizScore = 0;
    quizTotal = Array.isArray(data.questions) ? data.questions.length : 0;
    return `
      <div class="quiz-summary" id="quizScore">Score <strong>0 / ${quizTotal}</strong></div>
      ${(data.questions || []).map((q, index) => `
        <article class="quiz-q" data-answer="${Number(q.answer) || 0}">
          <div class="quiz-number">QUESTION ${String(index + 1).padStart(2, "0")}</div>
          <h3>${esc(q.question || "")}</h3>
          <div class="quiz-options">
            ${(q.options || []).map((option, choice) => `<button type="button" data-choice="${choice}">${esc(option)}</button>`).join("")}
          </div>
          <p class="quiz-feedback"></p>
          <small class="quiz-explanation">${esc(q.explanation || "")}</small>
        </article>`).join("")}`;
  }

  if (id === 8) {
    return `
      <div class="flash-grid">
        ${(data.cards || []).map((card, index) => `
          <button type="button" class="flashcard">
            <span class="flash-index">CARD ${String(index + 1).padStart(2, "0")}</span>
            <strong>${esc(card.front || "")}</strong>
            <span class="backface">${esc(card.back || "")}</span>
            <span class="flash-hint">Click to reveal answer</span>
          </button>`).join("")}
      </div>`;
  }

  if (id === 9) {
    return `
      <div class="planner-summary">${esc(data.summary || "Personalized study plan")}</div>
      ${(data.days || []).map(day => `
        <article class="plan-day">
          <h3>${esc(day.day || "Study day")}</h3>
          ${(day.tasks || []).map(task => `
            <div class="plan-task">
              <strong>${esc(task.subject || "")}</strong>
              <span>${esc(task.duration || "")}</span>
              <p>${esc(task.task || "")}</p>
            </div>`).join("")}
        </article>`).join("")}`;
  }

  return `<pre>${esc(JSON.stringify(data, null, 2))}</pre>`;
}

function drawSlide() {
  const stage = document.querySelector("#slideStage");
  if (!stage) return;
  const slide = currentSlides[slideIndex];

  if (!slide) {
    stage.innerHTML = '<div class="empty-state">No slides were returned.</div>';
    return;
  }

  stage.innerHTML = `
    <article class="ppt-slide-preview">
      <div class="ppt-topline"><span>AI STUDYLAB</span><span>0${slideIndex + 1}</span></div>
      <div class="ppt-content">
        <div class="slide-label">SLIDE ${slideIndex + 1} / ${currentSlides.length}</div>
        <h3>${esc(slide.title || "")}</h3>
        <ul>${(slide.points || []).map(point => `<li>${esc(point)}</li>`).join("")}</ul>
      </div>
      <div class="ppt-footer"><span>AI Presentation Generator</span><span>Ravi</span></div>
    </article>`;
}

function downloadPresentationPdf() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("PDF export is still loading. Please try again.");
    return;
  }

  const doc = new window.jspdf.jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  currentSlides.forEach((slide, index) => {
    if (index > 0) doc.addPage("a4", "landscape");
    doc.setFillColor(24, 37, 54);
    doc.rect(0, 0, 297, 210, "F");
    doc.setTextColor(201, 107, 75);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("AI STUDYLAB", 18, 18);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(27);
    doc.text(String(slide.title || "Presentation"), 18, 55, { maxWidth: 245 });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    let y = 82;
    (slide.points || []).forEach(point => {
      const lines = doc.splitTextToSize(String(point), 230);
      doc.text("•", 20, y);
      doc.text(lines, 29, y);
      y += Math.max(9, lines.length * 7 + 3);
    });
    doc.setTextColor(190, 198, 207);
    doc.setFontSize(9);
    doc.text(`AI Presentation Generator  •  ${index + 1} / ${currentSlides.length}`, 18, 198);
  });
  doc.save("AI-StudyLab-Presentation.pdf");
}

async function downloadPresentationPptx() {
  if (!window.PptxGenJS) {
    alert("PowerPoint export is still loading. Please try again.");
    return;
  }

  const pptx = new window.PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Ravi";
  pptx.subject = "AI StudyLab Presentation";
  pptx.title = currentSlides[0]?.title || "AI StudyLab Presentation";
  pptx.company = "AI StudyLab";
  pptx.lang = "en-US";

  currentSlides.forEach((slide, index) => {
    const page = pptx.addSlide();
    page.background = { color: "182536" };
    page.addText("AI STUDYLAB", {
      x: 0.55, y: 0.35, w: 2.2, h: 0.25,
      fontFace: "Aptos", fontSize: 9, bold: true, color: "C96B4B",
      charSpacing: 1.4, margin: 0
    });
    page.addText(String(slide.title || "Presentation"), {
      x: 0.65, y: 1.25, w: 11.2, h: 0.75,
      fontFace: "Aptos Display", fontSize: 27, bold: true,
      color: "FFFFFF", margin: 0
    });
    page.addShape(pptx.ShapeType.line, {
      x: 0.65, y: 2.18, w: 1.0, h: 0,
      line: { color: "C96B4B", width: 2.5 }
    });

    const points = (slide.points || []).map(point => ({
      text: String(point),
      options: { bullet: { indent: 16 }, hanging: 4, breakLine: true }
    }));

    page.addText(points, {
      x: 0.85, y: 2.55, w: 10.8, h: 3.65,
      fontFace: "Aptos", fontSize: 18, color: "E9EDF2",
      breakLine: false, paraSpaceAfterPt: 14,
      margin: 0.02, valign: "mid", fit: "shrink"
    });
    page.addText(`AI Presentation Generator    ${String(index + 1).padStart(2, "0")} / ${String(currentSlides.length).padStart(2, "0")}`, {
      x: 0.65, y: 7.0, w: 11.7, h: 0.25,
      fontFace: "Aptos", fontSize: 8, color: "AEB8C4", margin: 0,
      align: "right"
    });
  });

  await pptx.writeFile({ fileName: "AI-StudyLab-Presentation.pptx" });
}

function addNotesPdf(raw) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("PDF export is still loading. Please try again.");
    return;
  }

  const doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
  const margin = 16;
  const maxWidth = 178;
  const lineHeight = 6;
  let y = 18;

  const clean = value => String(value)
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/\`([^\`]*)\`/g, "$1")
    .trim();

  const addText = (value, size = 11, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);

    for (const line of doc.splitTextToSize(clean(value), maxWidth)) {
      if (y > 280) {
        doc.addPage();
        y = 18;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    }
  };

  for (const rawLine of String(raw).replace(/\r/g, "").split("\n")) {
    const line = rawLine.trim();

    if (!line) {
      y += 3;
      continue;
    }

    if (/^#{1}\s+/.test(line)) addText(line.replace(/^#\s+/, ""), 18, true);
    else if (/^#{2}\s+/.test(line)) addText(line.replace(/^##\s+/, ""), 15, true);
    else if (/^#{3}\s+/.test(line)) addText(line.replace(/^###\s+/, ""), 13, true);
    else if (/^[-*]\s+/.test(line)) addText("• " + line.replace(/^[-*]\s+/, ""));
    else if (/^\|/.test(line)) {
      const cells = line.split("|").map(clean).filter(Boolean);
      if (!cells.every(cell => /^[-:]+$/.test(cell))) addText(cells.join("   |   "), 10);
    } else {
      addText(line);
    }
  }

  doc.save("AI-StudyLab-Notes.pdf");
}

document.addEventListener("DOMContentLoaded", () => {
  const id = Number(document.body.dataset.task);
  const cfg = configs[id];
  if (!cfg) return;

  const input = document.querySelector("#taskInput");
  const run = document.querySelector("#runTask");
  const clear = document.querySelector("#clearTask");
  const output = document.querySelector("#output");
  const status = document.querySelector("#outputStatus");

  if (!input || !run || !output) return;

  setStatus(status, "WAITING");

  run.addEventListener("click", async () => {
    const value = input.value.trim();

    if (!value) {
      setStatus(status, "INPUT NEEDED");
      output.classList.add("is-empty");
      output.innerHTML = '<div class="empty-state"><strong>Nothing to generate yet.</strong><span>Enter a topic or study material first.</span></div>';
      return;
    }

    run.disabled = true;
    run.textContent = "Generating…";
    setStatus(status, "WORKING");
    output.classList.remove("is-empty");
    output.innerHTML = '<div class="empty-state"><strong>Preparing your result</strong><span>Gemini is working on it…</span></div>';

    try {
      const structured = [3, 4, 6, 8, 9].includes(id);
      const raw = await AIStudyLab.generate(cfg.prompt(value), { json: structured });
      const data = structured ? JSON.parse(cleanJson(raw)) : null;

      output.innerHTML = data ? renderJson(id, data) : `<div class="rich-text">${prettyMarkdown(raw)}</div>`;
      output.classList.remove("is-empty");
      setStatus(status, "READY");

      if (id === 2) {
        let download = document.querySelector("#downloadNotes");
        if (!download) {
          download = document.createElement("button");
          download.id = "downloadNotes";
          download.type = "button";
          download.className = "quiet";
          download.textContent = "Download PDF";
          document.querySelector(".actions")?.appendChild(download);
        }
        download.onclick = () => addNotesPdf(raw);
      }

      if (id === 3) {
        drawSlide();
        document.querySelector("#prevSlide").onclick = () => {
          if (slideIndex > 0) {
            slideIndex--;
            drawSlide();
          }
        };
        document.querySelector("#nextSlide").onclick = () => {
          if (slideIndex < currentSlides.length - 1) {
            slideIndex++;
            drawSlide();
          }
        };
        document.querySelector("#printSlides").onclick = () => window.print();
        document.querySelector("#downloadPptx").onclick = () => downloadPresentationPptx();
        document.querySelector("#downloadPresentationPdf").onclick = () => downloadPresentationPdf();
      }
    } catch (error) {
      setStatus(status, "ERROR");
      output.classList.add("is-empty");
      output.innerHTML = `<div class="empty-state error-state"><strong>Generation failed</strong><span>${esc(error.message)}</span></div>`;
    } finally {
      run.disabled = false;
      run.textContent = cfg.button + " →";
    }
  });

  if (clear) {
    clear.addEventListener("click", () => {
      input.value = "";
      setStatus(status, "WAITING");
      output.classList.add("is-empty");
      output.innerHTML = '<div class="empty-state"><strong>Your result will appear here.</strong><span>Enter content and use the action above.</span></div>';
    });
  }

  document.addEventListener("click", event => {
    const flash = event.target.closest(".flashcard");
    if (flash) flash.classList.toggle("flipped");

    const quizButton = event.target.closest(".quiz-q button");
    if (!quizButton) return;

    const question = quizButton.closest(".quiz-q");
    if (!question || question.dataset.done === "1") return;

    const correct = Number(quizButton.dataset.choice) === Number(question.dataset.answer);
    question.dataset.done = "1";
    question.querySelectorAll("button").forEach(button => button.disabled = true);
    quizButton.classList.add("selected");

    if (correct) quizScore++;
    const feedback = question.querySelector(".quiz-feedback");
    feedback.textContent = correct ? "Correct" : "Incorrect";
    feedback.className = "quiz-feedback " + (correct ? "correct" : "wrong");

    const score = document.querySelector("#quizScore");
    if (score) score.innerHTML = `Score <strong>${quizScore} / ${quizTotal}</strong>`;
  });
});