const STORAGE_KEY = "medizenMedicineSchedules";

let schedules = loadSchedules();
let notified = new Set();
let toastTimer;
let audioContext;
let remindersEnabled = false;

const $ = (id) => document.getElementById(id);

function todayString() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function loadSchedules() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveSchedules() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
}

function formatDate(dateValue) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(`${dateValue}T12:00:00`));
}

function formatTime(timeValue) {
  const [hours, minutes] = timeValue.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function frequencyLabel(repeat) {
  return repeat.charAt(0).toUpperCase() + repeat.slice(1);
}

function isDueToday(schedule, date = new Date()) {
  const startDate = new Date(`${schedule.startDate}T00:00:00`);
  const currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (currentDate < startDate) return false;

  if (schedule.repeat === "daily") return true;

  if (schedule.repeat === "weekly") {
    return currentDate.getDay() === startDate.getDay();
  }

  return currentDate.getDate() === startDate.getDate();
}

function showToast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    $("toast").classList.remove("show");
  }, 3000);
}

function switchScreen(name) {
  const home = name === "home";

  $("homeScreen").hidden = !home;
  $("scheduleScreen").hidden = home;

  document.querySelectorAll(".tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.screen === name);
  });

  if (!home) renderSavedSchedules();
}

function renderHome() {
  const dueToday = schedules
    .filter((schedule) => isDueToday(schedule))
    .sort((a, b) => a.time.localeCompare(b.time));

  $("todayLabel").textContent = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date());

  $("todayCount").textContent =
    `${dueToday.length} medicine${dueToday.length === 1 ? "" : "s"}`;

  if (!dueToday.length) {
    $("todayList").innerHTML = `
      <p class="empty-state">
        No medicines are scheduled for today.
      </p>
    `;
    return;
  }

  $("todayList").innerHTML = dueToday.map((schedule) => `
    <article class="medicine-item">
      <div class="medicine-icon">💊</div>
      <div class="medicine-details">
        <strong>${escapeHTML(schedule.name)}</strong>
        <small>${formatTime(schedule.time)} · ${frequencyLabel(schedule.repeat)}</small>
      </div>
    </article>
  `).join("");
}

function renderSavedSchedules() {
  const ordered = [...schedules].sort((a, b) =>
    `${a.startDate}${a.time}`.localeCompare(`${b.startDate}${b.time}`)
  );

  if (!ordered.length) {
    $("savedList").innerHTML = `
      <p class="empty-state">No medicine schedules saved yet.</p>
    `;
    return;
  }

  $("savedList").innerHTML = ordered.map((schedule) => `
    <article class="medicine-item">
      <div class="medicine-icon">💊</div>
      <div class="medicine-details">
        <strong>${escapeHTML(schedule.name)}</strong>
        <small>
          Starts ${formatDate(schedule.startDate)} ·
          ${frequencyLabel(schedule.repeat)} ·
          ${formatTime(schedule.time)}
        </small>
      </div>
      <div class="medicine-actions">
        <button class="edit-button" type="button"
                data-action="edit" data-id="${schedule.id}">
          Edit
        </button>
        <button class="delete-button" type="button"
                data-action="delete" data-id="${schedule.id}">
          Delete
        </button>
      </div>
    </article>
  `).join("");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character]);
}

function resetForm() {
  $("medicineForm").reset();
  $("editId").value = "";
  $("startDate").value = todayString();
  $("medicineTime").value = "08:00";
  $("repeat").value = "daily";
  $("saveButton").textContent = "Save Medicine";
  $("saveStatus").textContent = "";
}

function editSchedule(id) {
  const schedule = schedules.find((item) => item.id === id);
  if (!schedule) return;

  $("editId").value = schedule.id;
  $("medicineName").value = schedule.name;
  $("startDate").value = schedule.startDate;
  $("repeat").value = schedule.repeat;
  $("medicineTime").value = schedule.time;
  $("saveButton").textContent = "Save Changes";
  $("saveStatus").textContent = "Editing medicine schedule.";
  $("medicineName").focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteSchedule(id) {
  const schedule = schedules.find((item) => item.id === id);
  if (!schedule) return;

  if (!confirm(`Delete ${schedule.name} from the schedule?`)) return;

  schedules = schedules.filter((item) => item.id !== id);
  saveSchedules();
  renderHome();
  renderSavedSchedules();
  showToast("Medicine schedule deleted.");
}

function playAlarm() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    showToast("Medicine reminder: please take your medicine.");
    return;
  }

  audioContext = audioContext || new AudioContextClass();

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  [0, 0.45, 0.9].forEach((startTime) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.16, audioContext.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + startTime + 0.32
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(audioContext.currentTime + startTime);
    oscillator.stop(audioContext.currentTime + startTime + 0.32);
  });

  if (navigator.vibrate) {
    navigator.vibrate([250, 120, 250, 120, 250]);
  }
}

async function enableReminders() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (AudioContextClass) {
    audioContext = audioContext || new AudioContextClass();
    await audioContext.resume();
  }

  if ("Notification" in window && Notification.permission === "default") {
    await Notification.requestPermission();
  }

  remindersEnabled = true;
  $("enableReminders").textContent = "✓ Alarm Enabled";
  showToast("Medicine alarm reminders are enabled.");
  checkReminders();
}

function checkReminders() {
  if (!remindersEnabled) return;

  const now = new Date();
  const today = todayString();

  schedules.forEach((schedule) => {
    if (!isDueToday(schedule, now)) return;

    const scheduledTime = new Date(`${today}T${schedule.time}:00`);
    const difference = now - scheduledTime;
    const reminderKey = `${schedule.id}-${today}`;

    if (difference >= 0 && difference < 60000 && !notified.has(reminderKey)) {
      playAlarm();

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("MediZen Medicine Reminder", {
          body: `It is time to take ${schedule.name}.`
        });
      }

      notified.add(reminderKey);
      showToast(`Medicine reminder: ${schedule.name}`);
    }
  });
}

document.querySelectorAll("[data-screen]").forEach((button) => {
  button.addEventListener("click", () => switchScreen(button.dataset.screen));
});

$("medicineForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const name = $("medicineName").value.trim();
  const startDate = $("startDate").value;
  const repeat = $("repeat").value;
  const time = $("medicineTime").value;
  const id = $("editId").value;

  if (!name || !startDate || !repeat || !time) {
    $("saveStatus").textContent = "Please complete all fields.";
    return;
  }

  const schedule = {
    id: id || createId(),
    name,
    startDate,
    repeat,
    time
  };

  if (id) {
    schedules = schedules.map((item) => item.id === id ? schedule : item);
  } else {
    schedules.push(schedule);
  }

  saveSchedules();
  resetForm();
  renderHome();
  renderSavedSchedules();
  $("saveStatus").textContent = "Medicine schedule saved.";
  showToast("Medicine schedule saved.");
});

$("cancelEdit").addEventListener("click", resetForm);
$("enableReminders").addEventListener("click", enableReminders);

$("testAlarm").addEventListener("click", async () => {
  if (!remindersEnabled) await enableReminders();
  playAlarm();
  showToast("Test alarm is playing.");
});

$("savedList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  if (button.dataset.action === "edit") editSchedule(button.dataset.id);
  if (button.dataset.action === "delete") deleteSchedule(button.dataset.id);
});

resetForm();
renderHome();
setInterval(() => {
  renderHome();
  checkReminders();
}, 15000);