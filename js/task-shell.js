document.addEventListener("DOMContentLoaded", () => {
  const input = document.querySelector("#taskInput"),
    run = document.querySelector("#runTask"),
    clear = document.querySelector("#clearTask"),
    out = document.querySelector("#output"),
    status = document.querySelector("#outputStatus");
  run.addEventListener("click", () => {
    if (!input.value.trim()) {
      status.textContent = "INPUT NEEDED";
      out.innerHTML =
        '<div class="mark">!</div><p>Please enter some content first.</p><small>Validation works locally without an API key.</small>';
      return;
    }
    status.textContent = "CAPTURED";
    out.innerHTML =
      '<div class="mark">✓</div><p>Input captured successfully.</p><small>AI generation will be connected task-by-task next.</small>';
  });
  clear.addEventListener("click", () => {
    input.value = "";
    status.textContent = "WAITING";
    out.innerHTML =
      '<div class="mark">✦</div><p>Your generated result will appear here.</p><small>Enter content and use the action above.</small>';
    input.focus();
  });
});
