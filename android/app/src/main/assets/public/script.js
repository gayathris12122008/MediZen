
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
    openFeature: "Open service →",
    tapMore: (n) => `Tap ${n} more time${n === 1 ? "" : "s"} to activate SOS.`,
    sosCalling: "SOS activated. Opening your phone app...",
    noCaregiver: "No caregiver number saved. Please add one in Caretaker settings.",
    invalidPhone: "The saved caregiver phone number is invalid.",
    sosReset: "SOS cancelled. Tap 3 times to activate.",
    readUnsupported: "Read aloud is not supported on this device."
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
    openFeature: "சேவையைத் திறக்கவும் →",
    tapMore: (n) => `SOS செயல்பட இன்னும் ${n} முறை தட்டவும்.`,
    sosCalling: "SOS செயல்படுத்தப்பட்டது. தொலைபேசி செயலியைத் திறக்கிறது...",
    noCaregiver: "பராமரிப்பாளர் எண் சேமிக்கப்படவில்லை. பராமரிப்பாளர் அமைப்புகளில் எண்ணைச் சேர்க்கவும்.",
    invalidPhone: "சேமிக்கப்பட்ட தொலைபேசி எண் சரியானதல்ல.",
    sosReset: "SOS ரத்து செய்யப்பட்டது. செயல்படுத்த 3 முறை தட்டவும்.",
    readUnsupported: "இந்த சாதனத்தில் குரல் வாசிப்பு ஆதரிக்கப்படவில்லை."
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
let sosTapCount = 0;
let sosTapTimer = null;

const $ = (id) => document.getElementById(id);

function showToast(message) {
  const toast = $("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}
function updateDateTime() {
  const now = new Date();
  const currentLanguage =
    typeof i18n !== "undefined" && i18n.getLanguage
      ? i18n.getLanguage()
      : localStorage.getItem("medizenLanguage") || "en";

  const locale = currentLanguage === "ta" ? "ta-IN" : "en-IN";

  const dateElement = document.getElementById("current-date");
  const timeElement = document.getElementById("current-time");

  if (dateElement) {
    dateElement.textContent = new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(now);
  }

  if (timeElement) {
    timeElement.textContent = new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    }).format(now);
  }
}

function setDailyQuote() {
  const quote = $("dailyQuoteText");
  if (!quote) return;

  const day = Math.floor(
    (new Date().setHours(0, 0, 0, 0) -
      new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86400000
  );

  quote.textContent = dailyQuotes[day % dailyQuotes.length];
}

function updateLanguage() {
  const text = translations[language];

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;

    if (text[key] && typeof text[key] === "string") {
      element.textContent = text[key];
    }
  });

  if ($("languageButton")) {
    $("languageButton").textContent =
      language === "en" ? "🌐 English / தமிழ்" : "🌐 தமிழ் / English";
  }

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
  } catch (error) {
    console.error("Could not read caregiver details:", error);
    return null;
  }
}

/* SOS: activate only after 3 taps within 3 seconds */


function updateSOSMessage() {
  if (!$("sosStatus")) return;

  if (sosTapCount > 0 && sosTapCount < 3) {
    $("sosStatus").textContent =
      i18n.t("tapMore", 3 - sosTapCount);
  } else {
    $("sosStatus").textContent = "";
  }
}


function handleSOS() {
  const caregiver = getSavedCaregiver();

  if (!caregiver) {
    showToast(i18n.t("noCaregiver"));
    return;
  }

  const phone = String(caregiver.phone).trim();
  const cleanedPhone = phone.replace(/[^\d+]/g, "");

  if (!cleanedPhone || !/^\+?\d{7,15}$/.test(cleanedPhone)) {
    showToast(i18n.t("invalidPhone"));
    return;
  }

  if ($("sosStatus")) {
    $("sosStatus").textContent = i18n.t("sosCalling");
  }

  window.location.href = `tel:${cleanedPhone}`;
}


function resetSOSTaps() {
  sosTapCount = 0;
  clearTimeout(sosTapTimer);
  sosTapTimer = null;
  updateSOSMessage();
}

if ($("sosButton")) {
  $("sosButton").addEventListener("click", () => {
    sosTapCount++;
    clearTimeout(sosTapTimer);

    if (sosTapCount === 3) {
      // Reset before activating to prevent duplicate calls.
      sosTapCount = 0;
      sosTapTimer = null;

      if ($("sosStatus")) {
        $("sosStatus").textContent = "";
      }

      handleSOS();
      return;
    }

    updateSOSMessage();

    // All 3 taps must occur within 3 seconds.
    sosTapTimer = setTimeout(() => {
      resetSOSTaps();
    }, 3000);
  });
}

/* Read aloud */

function readPageAloud() {
  const main = document.querySelector("main");

  if (!("speechSynthesis" in window)) {
    showToast(i18n.t("readUnsupported"));
    return;
  }

  window.speechSynthesis.cancel();

  const speech = new SpeechSynthesisUtterance(
    main ? main.innerText : document.body.innerText
  );

  speech.lang = i18n.getLanguage() === "ta" ? "ta-IN" : "en-IN";
  speech.rate = 0.85;

  speech.onend = () => {
    if ($("readAloudButton")) $("readAloudButton").hidden = false;
    if ($("stopReadingButton")) $("stopReadingButton").hidden = true;
  };

  window.speechSynthesis.speak(speech);

  if ($("readAloudButton")) $("readAloudButton").hidden = true;
  if ($("stopReadingButton")) $("stopReadingButton").hidden = false;
}

/* Accessibility buttons */

if ($("languageButton")) {
  $("languageButton").addEventListener("click", () => {
    language = language === "en" ? "ta" : "en";
    updateLanguage();
    updateSOSMessage();
  });
}

if ($("textSizeButton")) {
  $("textSizeButton").addEventListener("click", () => {
    document.body.classList.toggle("large-text");

    $("textSizeButton").textContent =
      document.body.classList.contains("large-text")
        ? i18n.t("normalTextSize")
        : i18n.t("textSizeButton");
  });
}

if ($("readAloudButton")) {
  $("readAloudButton").addEventListener("click", readPageAloud);
}

if ($("stopReadingButton")) {
  $("stopReadingButton").addEventListener("click", () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    $("readAloudButton").hidden = false;
    $("stopReadingButton").hidden = true;
  });
}

/* Placeholder services */

/* Placeholder services */

document.querySelectorAll("[data-coming-soon]").forEach((card) => {
  card.addEventListener("click", (event) => {
    event.preventDefault();

    const serviceName = card.dataset.comingSoon;
    showToast(i18n.t("serviceComingSoon", serviceName));
  });
});


/* Start the page */

updateDateTime();
setDailyQuote();
updateLanguage();
updateSOSMessage();


updateDateTime();
setInterval(updateDateTime, 1000);
