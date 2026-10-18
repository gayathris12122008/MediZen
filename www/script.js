const translations = {
  en: {
    welcomeLabel: "YOUR PERSONAL HEALTH COMPANION",
    welcomeTitle: "Your health, made simpler.",
    welcomeDescription: "Everything you need, in one easy place.",
    dailyQuote: "A thought for today",
    featuresHeading: "What do you need today?",
    featuresDescription: "Select a service to continue.",
    medicinesTitle: "My Medicines",
    medicinesDescription: "Medicine reminders and schedules",
    appointmentsTitle: "Appointments",
    appointmentsDescription: "Your visits and schedules",
    caretakerTitle: "Caretaker",
    caretakerDescription: "Save a trusted emergency contact",
    hospitalsTitle: "Nearby Hospitals",
    hospitalsDescription: "Find hospital information",
    tipsTitle: "Health Tips",
    tipsDescription: "Everyday health and wellness",
    settingsTitle: "Settings",
    settingsDescription: "Adult and caregiver details",
    openFeature: "Open service →"
  },

  ta: {
    welcomeLabel: "உங்கள் தனிப்பட்ட சுகாதார துணை",
    welcomeTitle: "உங்கள் ஆரோக்கியம், இப்போது எளிதாக.",
    welcomeDescription: "உங்களுக்கு தேவையான அனைத்தும் ஒரே இடத்தில்.",
    dailyQuote: "இன்றைய சிந்தனை",
    featuresHeading: "இன்று உங்களுக்கு என்ன தேவை?",
    featuresDescription: "தொடர ஒரு சேவையைத் தேர்ந்தெடுக்கவும்.",
    medicinesTitle: "என் மருந்துகள்",
    medicinesDescription: "மருந்து நினைவூட்டல்கள் மற்றும் அட்டவணை",
    appointmentsTitle: "சந்திப்புகள்",
    appointmentsDescription: "உங்கள் வருகைகள் மற்றும் அட்டவணை",
    caretakerTitle: "பராமரிப்பாளர்",
    caretakerDescription: "நம்பகமான அவசர தொடர்பை சேமிக்கவும்",
    hospitalsTitle: "அருகிலுள்ள மருத்துவமனைகள்",
    hospitalsDescription: "மருத்துவமனை தகவலைக் கண்டறியவும்",
    tipsTitle: "சுகாதார குறிப்புகள்",
    tipsDescription: "தினசரி ஆரோக்கிய குறிப்புகள்",
    settingsTitle: "அமைப்புகள்",
    settingsDescription: "பயனர் மற்றும் பராமரிப்பாளர் விவரங்கள்",
    openFeature: "சேவையைத் திறக்கவும் →"
  }
};

const dailyQuotes = [
  "Kindness and patience make every day brighter.",
  "Small healthy habits create a better tomorrow.",
  "Take one step at a time and care for yourself.",
  "A calm mind supports a healthy body.",
  "Every day is a new chance to feel better."
];

let language = "en";
let toastTimer;

const $ = (id) => document.getElementById(id);

function showToast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    $("toast").classList.remove("show");
  }, 3000);
}

function updateDateTime() {
  const now = new Date();

  $("current-date").textContent = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(now);

  $("current-time").textContent = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  }).format(now);
}

function setDailyQuote() {
  const day = new Date().getDate();
  $("dailyQuoteText").textContent = dailyQuotes[day % dailyQuotes.length];
}

function updateLanguage() {
  const text = translations[language];

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    element.textContent = text[key];
  });

  $("languageButton").textContent =
    language === "en" ? "🌐 English / தமிழ்" : "🌐 தமிழ் / English";

  document.documentElement.lang = language;
}

function getSavedCaregiver() {
  try {
    const caregiver = JSON.parse(
      localStorage.getItem("medizenCaregiver") || "null"
    );

    if (!caregiver || !caregiver.name || !caregiver.phone) {
      return null;
    }

    return caregiver;
  } catch {
    return null;
  }
}

function updateSOSMessage() {
  const caregiver = getSavedCaregiver();

  if (caregiver) {
    $("sosStatus").textContent = `Tap SOS to call ${caregiver.name}.`;
  } else {
    $("sosStatus").textContent =
      "No caregiver is saved. Tap SOS to add caregiver details.";
  }
}

function handleSOS() {
  const caregiver = getSavedCaregiver();

  if (!caregiver) {
    window.location.href = "caregiver.html";
    return;
  }

  const phoneNumber = caregiver.phone.replace(/[^\d+]/g, "");
  window.location.href = `tel:${phoneNumber}`;
}

function readPageAloud() {
  const content = document.querySelector("main").innerText;

  if (!("speechSynthesis" in window)) {
    showToast("Read aloud is not supported on this device.");
    return;
  }

  window.speechSynthesis.cancel();

  const speech = new SpeechSynthesisUtterance(content);
  speech.lang = language === "ta" ? "ta-IN" : "en-IN";
  speech.rate = 0.85;

  speech.onend = () => {
    $("readAloudButton").hidden = false;
    $("stopReadingButton").hidden = true;
  };

  window.speechSynthesis.speak(speech);
  $("readAloudButton").hidden = true;
  $("stopReadingButton").hidden = false;
}

$("languageButton").addEventListener("click", () => {
  language = language === "en" ? "ta" : "en";
  updateLanguage();
});

$("textSizeButton").addEventListener("click", () => {
  document.body.classList.toggle("large-text");

  $("textSizeButton").textContent =
    document.body.classList.contains("large-text")
      ? "A− Normal Size"
      : "A+ Text Size";
});

$("readAloudButton").addEventListener("click", readPageAloud);

$("stopReadingButton").addEventListener("click", () => {
  window.speechSynthesis.cancel();
  $("readAloudButton").hidden = false;
  $("stopReadingButton").hidden = true;
});

$("sosButton").addEventListener("click", handleSOS);

document.querySelectorAll("[data-coming-soon]").forEach((card) => {
  card.addEventListener("click", (event) => {
    event.preventDefault();
    showToast(`${card.dataset.comingSoon} will be added soon.`);
  });
});

updateDateTime();
setDailyQuote();
updateLanguage();
updateSOSMessage();

setInterval(updateDateTime, 1000);