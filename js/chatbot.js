let history = [];
const chat = document.querySelector("#chat");
const form = document.querySelector("#chatForm");
const input = document.querySelector("#question");
const status = document.querySelector("#status");

const addMessage = (role, text) => {
  const el = document.createElement("div");
  el.className = `msg ${role}`;
  const label = document.createElement("div");
  label.className = "msg-role";
  label.textContent = role === "user" ? "YOU" : "AI TUTOR";
  const body = document.createElement("div");
  body.innerHTML = AIStudyLab.escapeHtml(text).replace(/\n/g, "<br>");
  el.append(label, body);
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
  return el;
};

const setStatus = (text, state) => {
  status.textContent = text;
  status.dataset.state = state || "ready";
};

form.onsubmit = async e => {
  e.preventDefault();
  const q = input.value.trim();
  if (!q) return;

  addMessage("user", q);
  input.value = "";
  input.disabled = true;
  form.querySelector("button").disabled = true;
  setStatus("THINKING", "working");

  const typing = document.createElement("div"); typing.className = "typing-row"; typing.innerHTML = '<span></span><span></span><span></span><em>AI is typing</em>'; chat.appendChild(typing); chat.scrollTop = chat.scrollHeight;
  thinking.classList.add("thinking");

  try {
    const context = history.slice(-8).map(x => `${x.role}: ${x.text}`).join("\n");
    const answer = await AIStudyLab.generate(
      "You are a patient academic subject tutor. Answer at student level. " +
      "Explain concepts clearly, use short sections and examples when useful. " +
      "Do not invent facts. If the question is ambiguous, ask one concise clarification. " +
      "Recent conversation:\n" + context + "\n\nStudent question:\n" + q
    );

    history.push({role:"user", text:q}, {role:"assistant", text:answer});
    thinking.remove();
    addMessage("ai", answer);
    setStatus("READY", "ready");
  } catch (err) {
    thinking.remove();
    addMessage("ai", err.message);
    setStatus("ERROR", "error");
  } finally {
    input.disabled = false;
    form.querySelector("button").disabled = false;
    input.focus();
  }
};

document.querySelector("#clearChat").onclick = () => {
  history = [];
  chat.innerHTML = `<div class="msg ai"><div class="msg-role">AI TUTOR</div><div>Hello! Tell me the subject and your doubt. I can explain concepts step by step and answer follow-up questions using the conversation context.</div></div>`;
  setStatus("READY", "ready");
  input.focus();
};