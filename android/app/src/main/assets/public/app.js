
'use strict';

const STORAGE_KEY = 'app-appointments-v1';
const NOTIFIED_KEY = 'app-notified-v1';

const form = document.querySelector('#appointment-form');
const list = document.querySelector('#reminder-list');
const emptyState = document.querySelector('#empty-state');
const count = document.querySelector('#appointment-count');
const message = document.querySelector('#form-message');
const dateInput = document.querySelector('#date');
const alertPopup = document.querySelector('#alert-popup');
const previewButton = document.querySelector('#preview-sound');

function getLocalDateString(date = new Date()) {
  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return local.toISOString().slice(0, 10);
}

dateInput.min = getLocalDateString();

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function getAppointments() {
  return readArray(STORAGE_KEY);
}

function saveAppointments(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function dateAtLocalMidnight(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value) {
  return dateAtLocalMidnight(value).toLocaleDateString(
    undefined,
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }
  );
}

function dayDifference(value) {
  const target = dateAtLocalMidnight(value);
  const today = dateAtLocalMidnight(getLocalDateString());

  return Math.round((target - today) / 86400000);
}

function dayLabel(days) {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === 2) return 'In 2 days';

  return `In ${days} days`;
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function formatTime(value) {
  const [hours, minutes] = value.split(':').map(Number);

  return new Date(2000, 0, 1, hours, minutes)
    .toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit'
    });
}

function makeId() {
  if (
    window.crypto &&
    typeof window.crypto.randomUUID === 'function'
  ) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Display saved appointments
function render() {
  const appointments = getAppointments()
    .filter(item => item.date && dayDifference(item.date) >= 0)
    .sort((a, b) =>
      `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
    );

  // Remove past appointments from the active list.
  saveAppointments(appointments);

  list.replaceChildren();
  count.textContent = `${appointments.length} saved`;
  emptyState.hidden = appointments.length > 0;

  for (const appointment of appointments) {
    const days = dayDifference(appointment.date);
    const date = dateAtLocalMidnight(appointment.date);

    const card = document.createElement('article');
    card.className = 'appointment-card';

    card.innerHTML = `
      <button class="delete-button" type="button"
        aria-label="Remove appointment with ${escapeHTML(appointment.doctor)}">
        ×
      </button>

      <div class="card-top">
        <div class="date-badge">
          <span class="month">
            ${date.toLocaleDateString(undefined, {
              month: 'short'
            }).toUpperCase()}
          </span>
          <span class="day">${date.getDate()}</span>
        </div>

        <div class="appointment-info">
          <h3>${escapeHTML(appointment.doctor)}</h3>
          <p>
            ${escapeHTML(formatDate(appointment.date))}
            · ${escapeHTML(formatTime(appointment.time))}
            ${
              appointment.location
                ? `<span class="location">${escapeHTML(appointment.location)}</span>`
                : ''
            }
          </p>
        </div>
      </div>

      <div class="reminder-tags">
        <span class="tag ${days === 0 ? 'today' : ''}">
          ${escapeHTML(dayLabel(days))}
        </span>
        <span class="tag">◷ 2-day reminder</span>
        <span class="tag">♫ Day-of chime</span>
      </div>
    `;

    card.querySelector('.delete-button').addEventListener('click', () => {
      saveAppointments(
        getAppointments().filter(item => item.id !== appointment.id)
      );

      render();
      message.textContent = 'Appointment removed.';
    });

    list.append(card);
  }
}

// Save a new appointment
form.addEventListener('submit', async event => {
  event.preventDefault();

  const data = new FormData(form);

  const appointment = {
    id: makeId(),
    doctor: String(data.get('doctor') || '').trim(),
    date: String(data.get('date') || ''),
    time: String(data.get('time') || ''),
    location: String(data.get('location') || '').trim()
  };

  if (!appointment.doctor || !appointment.date || !appointment.time) {
    message.textContent = 'Please complete the required fields.';
    return;
  }

  if (dayDifference(appointment.date) < 0) {
    message.textContent = 'Please choose today or a future date.';
    return;
  }

  saveAppointments([...getAppointments(), appointment]);

  render();
  form.reset();
  dateInput.min = getLocalDateString();

  message.textContent =
    'Appointment saved. Keep this page open for on-page reminders.';

  await requestNotificationPermission();
});

// Request browser notification permission
async function requestNotificationPermission() {
  if (
    !('Notification' in window) ||
    Notification.permission !== 'default'
  ) {
    return;
  }

  try {
    await Notification.requestPermission();
  } catch {
    // Browser notifications are optional.
  }
}

function getNotified() {
  try {
    return JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

// Check two-day and appointment-day reminders
function checkReminders() {
  const notified = getNotified();
  const now = new Date();

  const currentTime =
    `${String(now.getHours()).padStart(2, '0')}:` +
    `${String(now.getMinutes()).padStart(2, '0')}`;

  for (const appointment of getAppointments()) {
    if (!appointment.date || !appointment.time) continue;

    const days = dayDifference(appointment.date);

    if (days !== 2 && days !== 0) continue;

    if (appointment.time !== currentTime) continue;

    const reminderType = days === 2 ? 'two-days' : 'appointment-day';
    const key = `${appointment.id}-${reminderType}`;

    if (notified[key]) continue;

    const title = days === 2
      ? 'Appointment coming up'
      : 'Your appointment is today';

    const body =
      `${appointment.doctor} · ${formatTime(appointment.time)}` +
      (appointment.location ? ` · ${appointment.location}` : '');

    showPopup(title, body);

    if (
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      new Notification(title, {
        body,
        tag: key
      });
    }

    if (days === 0) {
      playChime();
    }

    notified[key] = true;
  }

  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(notified));
}

// Show an on-page reminder
function showPopup(title, body) {
  alertPopup.innerHTML =
    `<strong>${escapeHTML(title)}</strong>${escapeHTML(body)}`;

  alertPopup.hidden = false;

  clearTimeout(showPopup.timeout);

  showPopup.timeout = setTimeout(() => {
    alertPopup.hidden = true;
  }, 15000);
}

// Reminder sound
let audioContext;
let alarmInterval;
let alarmTimeout;

function stopChime() {
  clearInterval(alarmInterval);
  clearTimeout(alarmTimeout);

  alarmInterval = undefined;
  alarmTimeout = undefined;
}

function playChime(durationMs = 60000) {
  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    showPopup(
      'Sound unavailable',
      'This browser does not support the reminder chime.'
    );
    return;
  }

  stopChime();

  audioContext ||= new AudioContextClass();

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const notes = [740, 880, 988, 880];
  let noteIndex = 0;

  function ringOnce() {
    const frequency = notes[noteIndex % notes.length];
    noteIndex++;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const start = audioContext.currentTime;

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.18, start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(start);
    oscillator.stop(start + 0.3);
  }

  ringOnce();

  alarmInterval = setInterval(ringOnce, 550);
  alarmTimeout = setTimeout(stopChime, durationMs);
}

// Preview the sound for three seconds
previewButton.addEventListener('click', () => {
  playChime(3000);
});

// Start the app
render();
checkReminders();

// Check reminder times every minute while the page is open
setInterval(checkReminders, 60000);
