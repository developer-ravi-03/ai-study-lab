const out = document.querySelector("#output");
const status = document.querySelector("#status");
const endpoint = document.querySelector("#endpoint");
const count = document.querySelector("#recordCount");
const insights = document.querySelector("#insights");

let currentRows = [];

const setStatus = (text, state = "ready") => {
  status.textContent = text;
  status.dataset.state = state;
};

const endpointValue = () => endpoint.value.trim();

function renderRows(rows) {
  currentRows = rows;
  if (!rows.length) {
    out.innerHTML =
      '<div class="empty-state"><strong>No records yet.</strong><span>Add a record using the form.</span></div>';
    count.textContent = "0 records";
    insights.hidden = true;
    return;
  }

  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  out.innerHTML = `
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr>${headers.map((h) => `<th>${AIStudyLab.escapeHtml(h)}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows.map((row) => `<tr>${headers.map((h) => `<td>${AIStudyLab.escapeHtml(row[h] ?? "")}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>`;

  count.textContent = `${rows.length} record${rows.length === 1 ? "" : "s"}`;
  updateStats(rows, headers);
}

function updateStats(rows, headers) {
  const marksKey = headers.find((h) => /marks?|score/i.test(h));
  const attendanceKey = headers.find((h) => /attendance/i.test(h));
  const average = (key) => {
    if (!key) return "—";
    const values = rows.map((row) => Number(row[key])).filter(Number.isFinite);
    return values.length
      ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
      : "—";
  };

  document.querySelector("#statRecords").textContent = rows.length;
  document.querySelector("#statMarks").textContent = average(marksKey);
  document.querySelector("#statAttendance").textContent = attendanceKey
    ? average(attendanceKey) + "%"
    : "—";
  insights.hidden = false;
}

async function loadData() {
  const url = endpointValue();
  if (!url) {
    setStatus("URL NEEDED", "error");
    return;
  }

  try {
    setStatus("LOADING", "working");
    out.innerHTML =
      '<div class="empty-state"><strong>Loading sheet data…</strong><span>Fetching the latest rows.</span></div>';

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Endpoint returned ${response.status}`);

    const data = await response.json();
    const rows = Array.isArray(data) ? data : data.data || data.rows || [];
    renderRows(rows);
    setStatus("CONNECTED", "ready");
  } catch (error) {
    setStatus("ERROR", "error");
    out.innerHTML = `<div class="empty-state error-state"><strong>Connection failed</strong><span>${AIStudyLab.escapeHtml(error.message)}</span></div>`;
  }
}

document.querySelector("#load").addEventListener("click", loadData);

document.querySelector("#append").addEventListener("click", async () => {
  const url = endpointValue();
  const name = document.querySelector("#name").value.trim();
  const subject = document.querySelector("#subject").value.trim();
  const marks = document.querySelector("#marks").value.trim();
  const attendance = document.querySelector("#attendance").value.trim();

  if (!url || !name || !subject || !marks || !attendance) {
    setStatus("INPUT NEEDED", "error");
    return;
  }

  try {
    setStatus("SAVING", "working");

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        Name: name,
        Subject: subject,
        Marks: Number(marks),
        Attendance: Number(attendance),
      }),
    });

    if (!response.ok) throw new Error(`Append failed: ${response.status}`);

    setStatus("SAVED", "ready");
    document.querySelector("#name").value = "";
    document.querySelector("#subject").value = "";
    document.querySelector("#marks").value = "";
    document.querySelector("#attendance").value = "";
    await loadData();
  } catch (error) {
    setStatus("ERROR", "error");
    out.innerHTML = `<div class="empty-state error-state"><strong>Could not save record</strong><span>${AIStudyLab.escapeHtml(error.message)}</span></div>`;
  }
});
