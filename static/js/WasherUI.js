import { washers, dryers } from "./WasherState.js";

export function updateTimerDisplay(store, type, id) {
  requestAnimationFrame(() => {
    const timerElement = document.getElementById(`${type}-timer-${id}`);
    if (!timerElement) return;

    const m = Math.floor(store[id].remaining / 60)
      .toString()
      .padStart(2, "0");
    const s = (store[id].remaining % 60).toString().padStart(2, "0");
    timerElement.textContent = `${m}:${s}`;
  });
}

export function showToast(msg) {
  const toastEl = document.getElementById("machineToast");
  toastEl.querySelector(".toast-body").textContent = msg;
  new bootstrap.Toast(toastEl).show();
}

export function createDrumHoles(store, prefix, id) {
  const drumContainer = document.querySelector(
    `#${prefix}-drum-${id} .drum-holes`
  );
  if (!drumContainer) return;

  drumContainer.innerHTML = "";
  for (let i = 0; i < 8; i++) {
    const hole = document.createElement("div");
    hole.className = "drum-hole";
    drumContainer.appendChild(hole);
  }

  if (store[id].status === "running") {
    drumContainer.classList.add("spin");
  } else {
    drumContainer.classList.remove("spin");
  }
}

export function addProgressRing(prefix, id) {
  const container = document.querySelector(`#${prefix}-drum-${id}`);
  if (!container) return;

  const ring = document.createElement("div");
  ring.className = "progress-ring";
  container.appendChild(ring);
}

export function updateProgressRing(store, prefix, id) {
  const c = document.getElementById(`progress-${prefix}${id}`);
  if (!c) return;
  const total = store[id].totalTime;
  const remain = store[id].remaining;
  const circumference = 157;
  c.style.strokeDashoffset =
    circumference - ((total - remain) / total) * circumference;
}
