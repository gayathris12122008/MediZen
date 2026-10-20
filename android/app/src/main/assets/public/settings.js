
const $ = (id) => document.getElementById(id);

const STORAGE = {
  caregiver: "medizenProfile",
  medicine: "medizenSettingsMedicine",
  appointment: "medizenSettingsAppointment",
  hospital: "medizenSettingsHospital",
  tips: "medizenSettingsTips",
  creator: "medizenCreator"
};

let activeEditor = null;

const editorConfig = {
  caregiver: {
    title: "Caregiver & Caretaker Details",
    fields: [
      { id: "adultName", label: "Adult's name", placeholder: "Enter name", required: true },
      { id: "adultPhone", label: "Adult's phone number", placeholder: "Enter phone number", type: "tel" },
      { id: "caregiverName", label: "Caretaker's name", placeholder: "Enter caretaker name", required: true },
      { id: "caregiverPhone", label: "Caretaker's phone number", placeholder: "Enter phone number", type: "tel", required: true },
      { id: "relationship", label: "Relationship to adult", placeholder: "e.g. Daughter, son, friend" }
    ]
  },

  medicine: {
    title: "Medicine Details",
    fields: [
      { id: "medicineName", label: "Medicine name", placeholder: "Enter medicine name", required: true },
      { id: "dosage", label: "Dosage", placeholder: "As prescribed" },
      { id: "medicineTime", label: "Time / schedule", placeholder: "e.g. After breakfast" },
      { id: "medicineNotes", label: "Additional notes", placeholder: "Instructions from your healthcare professional", multiline: true }
    ]
  },

  appointment: {
    title: "Appointment Details",
    fields: [
      { id: "doctorName", label: "Doctor's name", placeholder: "Enter doctor's name" },
      { id: "appointmentDate", label: "Appointment date", type: "date" },
      { id: "appointmentTime", label: "Appointment time", type: "time" },
      { id: "appointmentPlace", label: "Clinic / hospital", placeholder: "Enter location" },
      { id: "appointmentNotes", label: "Notes", placeholder: "Purpose or instructions", multiline: true }
    ]
  },

  hospital: {
    title: "Hospital Details",
    fields: [
      { id: "hospitalName", label: "Hospital name", placeholder: "Enter hospital name" },
      { id: "hospitalAddress", label: "Address", placeholder: "Enter hospital address", multiline: true },
      { id: "hospitalPhone", label: "Phone number", placeholder: "Enter phone number", type: "tel" },
      { id: "hospitalNotes", label: "Additional information", placeholder: "Departments or other notes", multiline: true }
    ]
  },

  tips: {
    title: "Health Tips",
    fields: [
      { id: "tipTitle", label: "Tip title", placeholder: "Enter a title" },
      { id: "tipContent", label: "Health tip content", placeholder: "Enter your health tip", multiline: true, required: true },
      { id: "tipCategory", label: "Category", placeholder: "e.g. Hydration, sleep, wellness" }
    ]
  }
};

function readSaved(key, fallback = {}) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : fallback;
  } catch {
    return fallback;
  }
}

function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    alert("Unable to save details. Please check your device storage.");
    return false;
  }
}

function createField(field, value = "") {
  const wrapper = document.createElement("div");
  wrapper.className = "field";

  if (field.multiline) wrapper.classList.add("full-width");

  const label = document.createElement("label");
  label.htmlFor = field.id;
  label.textContent = field.label;

  const input = document.createElement(field.multiline ? "textarea" : "input");

  input.id = field.id;
  input.name = field.id;
  input.required = Boolean(field.required);
  input.placeholder = field.placeholder || "";
  input.value = typeof value === "string" ? value : "";

  if (!field.multiline) {
    input.type = field.type || "text";
  } else {
    input.rows = 3;
  }

  wrapper.append(label, input);
  return wrapper;
}

function openEditor(section) {
  const config = editorConfig[section];
  if (!config) return;

  activeEditor = section;
  $("editorTitle").textContent = config.title;
  $("editorFields").replaceChildren();

  const saved = readSaved(STORAGE[section]);

  config.fields.forEach((field) => {
    $("editorFields").appendChild(
      createField(field, saved[field.id] || "")
    );
  });

  // Load the existing caregiver profile if available.
  if (section === "caregiver") {
    const caregiver = readSaved("medizenCaregiver");

    const phoneField = $("caregiverPhone");
    const nameField = $("caregiverName");

    if (!nameField.value) nameField.value = caregiver.name || "";
    if (!phoneField.value) phoneField.value = caregiver.phone || "";
    if (!$("relationship").value) {
      $("relationship").value = caregiver.relationship || "";
    }
  }

  $("saveStatus").textContent = "";
  $("editorSection").hidden = false;
  $("editorSection").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  const firstInput = $("editorFields").querySelector("input, textarea");
  if (firstInput) firstInput.focus();
}

function closeEditor() {
  $("editorSection").hidden = true;
  activeEditor = null;
  $("saveStatus").textContent = "";
}

document.querySelectorAll("[data-edit]").forEach((button) => {
  button.addEventListener("click", () => {
    openEditor(button.dataset.edit);
  });
});

$("closeEditor").addEventListener("click", closeEditor);
$("cancelEditor").addEventListener("click", closeEditor);

$("detailsForm").addEventListener("submit", (event) => {
  event.preventDefault();

  if (!activeEditor) return;

  const config = editorConfig[activeEditor];
  const details = {};

  config.fields.forEach((field) => {
    details[field.id] = $(field.id).value.trim();
  });

  if (!saveData(STORAGE[activeEditor], details)) return;

  // Keep the existing SOS feature compatible with caregiver.html.
  if (activeEditor === "caregiver") {
    const caregiver = {
      name: details.caregiverName,
      phone: details.caregiverPhone,
      relationship: details.relationship
    };

    const profile = readSaved("medizenProfile");
    Object.assign(profile, details);

    if (!saveData("medizenProfile", profile)) return;
    if (!saveData("medizenCaregiver", caregiver)) return;
  }

  $("saveStatus").textContent = "Details saved successfully!";
});

// App Creator Panel
const creatorFields = [
  "teamName",
  "projectName",
  "teamLeader",
  "institution",
  "eventName",
  "creatorContact",
  "teamMembers",
  "projectDescription"
];

function loadCreator() {
  const details = readSaved(STORAGE.creator);

  creatorFields.forEach((id) => {
    if (typeof details[id] === "string") {
      $(id).value = details[id];
    }
  });

  renderTeamPreview(details);
}

function renderTeamPreview(details) {
  const preview = $("teamPreview");
  preview.replaceChildren();

  const heading = document.createElement("h3");
  heading.textContent = details.teamName || "Team Profile Preview";
  preview.appendChild(heading);

  const fields = [
    ["Project", details.projectName],
    ["Team leader", details.teamLeader],
    ["Institution", details.institution],
    ["Event", details.eventName],
    ["Contact", details.creatorContact],
    ["Team members", details.teamMembers],
    ["About the project", details.projectDescription]
  ];

  const populated = fields.filter(([, value]) => value);

  if (!populated.length) {
    const message = document.createElement("p");
    message.textContent = "Save your details to display your team profile here.";
    preview.appendChild(message);
    return;
  }

  populated.forEach(([labelText, value]) => {
    const paragraph = document.createElement("p");
    const label = document.createElement("strong");

    label.textContent = `${labelText}: `;
    paragraph.append(label, document.createTextNode(value));
    preview.appendChild(paragraph);
  });
}

$("creatorForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const details = {};

  creatorFields.forEach((id) => {
    details[id] = $(id).value.trim();
  });

  if (!saveData(STORAGE.creator, details)) return;

  renderTeamPreview(details);
  $("creatorStatus").textContent = "Team details saved successfully!";
});

$("clearCreator").addEventListener("click", () => {
  if (!confirm("Clear all team details from this form?")) return;

  creatorFields.forEach((id) => {
    $(id).value = id === "projectName" ? "MediZen" : "";
  });

  if (saveData(STORAGE.creator, {})) {
    renderTeamPreview({});
    $("creatorStatus").textContent = "Team form cleared.";
  }
});

// Accessibility controls
$("textSizeButton").addEventListener("click", () => {
  const isLarge = document.body.classList.toggle("large-text");

  $("textSizeButton").textContent = isLarge
    ? "A− Normal Size"
    : "A+ Text Size";
});

$("readButton").addEventListener("click", () => {
  if (!("speechSynthesis" in window)) {
    alert("Read aloud is not supported on this device.");
    return;
  }

  speechSynthesis.cancel();

  const text = document.querySelector("main").innerText;
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = document.documentElement.lang === "ta" ? "ta-IN" : "en-IN";
  speech.rate = 0.85;

  speech.onend = () => {
    $("readButton").hidden = false;
    $("stopButton").hidden = true;
  };

  speechSynthesis.speak(speech);
  $("readButton").hidden = true;
  $("stopButton").hidden = false;
});

$("stopButton").addEventListener("click", () => {
  speechSynthesis.cancel();
  $("readButton").hidden = false;
  $("stopButton").hidden = true;
});

loadCreator();
