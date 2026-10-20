
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const t = (key) => {
    const language = document.documentElement.lang === "ta" ? "ta" : "en";
    return window.translations?.[language]?.[key]
      ?? window.translations?.en?.[key]
      ?? key;
  };

  // Language preference is kept for this app's current WebView storage.
  let language = "en";
  let largeText = false;
  let originalFontSizes = new Map();
  let speechUtterance = null;
  let sosTapCount = 0;
  let sosTapTimer = null;

  try {
    language = localStorage.getItem("medizenLanguage") === "ta"
      ? "ta"
      : "en";

    largeText = localStorage.getItem("medizenLargeText") === "true";
  } catch {
    // Continue with default preferences if storage is unavailable.
  }

  function applyLanguage() {
    document.documentElement.lang = language;

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.dataset.i18n;
      const translated = t(key);

      // Only replace text on elements intended for translation.
      element.textContent = translated;
    });

    const sizeButton = $("textSizeButton");
    if (sizeButton) {
      sizeButton.textContent = largeText
        ? t("normalTextButton")
        : t("textSizeButton");
      sizeButton.setAttribute("aria-pressed", String(largeText));
    }

    const stopButton = $("stopReadingButton");
    const readButton = $("readAloudButton");

    if (stopButton) stopButton.textContent = t("stopReadingButton");

    if (readButton && !speechUtterance) {
      readButton.textContent = t("readAloudButton");
    }

    updateDateTime();
    updateQuote();
  }

  function rememberAndEnlargeText() {
    // Restore the baseline first, so repeated toggles never compound.
    restoreTextSizes();

    if (!largeText) return;

    document.querySelectorAll("body *").forEach((element) => {
      if (
        element.closest(".accessibility-bar") ||
        element.id === "toast" ||
        element.tagName === "SCRIPT" ||
        element.tagName === "STYLE"
      ) {
        return;
      }

      const computed = window.getComputedStyle(element);
      const size = parseFloat(computed.fontSize);

      if (!Number.isFinite(size) || size <= 0) return;

      originalFontSizes.set(element, element.style.fontSize);
      element.style.fontSize = `${Math.round(size * 1.25)}px`;
    });

    document.body.classList.add("large-text");
  }

  function restoreTextSizes() {
    for (const [element, originalValue] of originalFontSizes) {
      if (element.isConnected) {
        element.style.fontSize = originalValue;
      }
    }

    originalFontSizes.clear();
    document.body.classList.remove("large-text");
  }

  function setLargeText(enabled) {
    largeText = enabled;

    if (largeText) {
      rememberAndEnlargeText();
    } else {
      restoreTextSizes();
    }

    try {
      localStorage.setItem("medizenLargeText", String(largeText));
    } catch {}

    const button = $("textSizeButton");
    if (button) {
      button.textContent = largeText
        ? t("normalTextButton")
        : t("textSizeButton");
      button.setAttribute("aria-pressed", String(largeText));
    }
  }

  function updateDateTime() {
    const now = new Date();

    const dateElement = $("current-date");
    const timeElement = $("current-time");

    if (!dateElement || !timeElement) return;

    const locale = language === "ta" ? "ta-IN" : "en-IN";

    dateElement.textContent = now.toLocaleDateString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    timeElement.textContent = now.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  const quotes = {
    en: [
      "Every small step towards better health matters.",
      "Take today one step at a time.",
      "Your well-being deserves care and attention.",
      "A little care every day makes a difference.",
      "You deserve kindness, patience and good care."
    ],
    ta: [
      "ஆரோக்கியத்திற்காக எடுக்கும் ஒவ்வொரு சிறிய முயற்சியும் முக்கியம்.",
      "இன்றைய நாளை ஒவ்வொரு படியாக எடுத்துக்கொள்ளுங்கள்.",
      "உங்கள் நலனுக்கு அக்கறையும் கவனமும் அவசியம்.",
      "தினமும் சிறிதளவு அக்கறை பெரிய மாற்றத்தை ஏற்படுத்தும்.",
      "அன்பும் பொறுமையும் நல்ல பராமரிப்பும் உங்களுக்கு உரியது."
    ]
  };

  function updateQuote() {
    const quoteElement = $("dailyQuoteText");
    if (!quoteElement) return;

    // Select the same quote for the whole day, changing it daily.
    const day = new Date();
    const dayNumber = Math.floor(
      Date.UTC(day.getFullYear(), day.getMonth(), day.getDate())
      / 86400000
    );

    const list = quotes[language];
    quoteElement.textContent = list[((dayNumber % list.length) + list.length) % list.length];
  }

  function stopReading() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    speechUtterance = null;

    const readButton = $("readAloudButton");
    const stopButton = $("stopReadingButton");

    if (readButton) {
      readButton.hidden = false;
      readButton.textContent = t("readAloudButton");
    }

    if (stopButton) stopButton.hidden = true;
  }

  function startReading() {
    if (
      !("speechSynthesis" in window) ||
      typeof window.SpeechSynthesisUtterance !== "function"
    ) {
      window.alert(t("readUnavailable"));
      return;
    }

    stopReading();

    const main = $("mainContent");
    if (!main) return;

    const text = main.innerText.trim();

    if (!text) {
      window.alert(t("readEmpty"));
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.lang = language === "ta" ? "ta-IN" : "en-IN";
      utterance.rate = 0.85;
      utterance.pitch = 1;
      speechUtterance = utterance;

      utterance.onend = () => {
        if (speechUtterance !== utterance) return;
        speechUtterance = null;
        $("readAloudButton").hidden = false;
        $("readAloudButton").textContent = t("readAloudButton");
        $("stopReadingButton").hidden = true;
      };

      utterance.onerror = () => {
        if (speechUtterance !== utterance) return;
        speechUtterance = null;
        $("readAloudButton").hidden = false;
        $("readAloudButton").textContent = t("readAloudButton");
        $("stopReadingButton").hidden = true;
        window.alert(t("readError"));
      };

      $("readAloudButton").hidden = true;
      $("stopReadingButton").hidden = false;

      window.speechSynthesis.speak(utterance);
    } catch {
      speechUtterance = null;
      $("readAloudButton").hidden = false;
      $("stopReadingButton").hidden = true;
      window.alert(t("readError"));
    }
  }

  function readObject(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value && typeof value === "object" && !Array.isArray(value)
        ? value
        : {};
    } catch {
      return {};
    }
  }

  function firstValue(...values) {
    for (const value of values) {
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
    return "";
  }

  function getEmergencyContacts() {
    // Support keys used by earlier MediZen pages.
    const profile = readObject("medizenProfile");
    const caregiver = readObject("medizenCaregiver");
    const caregiverSettings = readObject("medizenSettingsCaregiver");
    const hospital = readObject("medizenSettingsHospital");
    const savedHospital = readObject("medizenHospital");

    const caregiverName = firstValue(
      profile.caregiverName,
      caregiver.name,
      caregiverSettings.caregiverName
    );

    const caregiverPhone = firstValue(
      profile.caregiverPhone,
      caregiver.phone,
      caregiverSettings.caregiverPhone,
      profile.phone
    );

    const hospitalName = firstValue(
      hospital.hospitalName,
      savedHospital.name,
      savedHospital.hospitalName
    );

    const hospitalPhone = firstValue(
      hospital.hospitalPhone,
      savedHospital.phone,
      savedHospital.hospitalPhone
    );

    return [
      {
        key: "caretakerCall",
        name: caregiverName || t("caretakerTitle"),
        phone: caregiverPhone
      },
      {
        key: "hospitalCall",
        name: hospitalName || t("hospitalsTitle"),
        phone: hospitalPhone
      }
    ];
  }

  function displayEmergencyContacts() {
    const status = $("sosStatus");
    const panel = $("sosContacts");

    if (!status || !panel) return;

    panel.replaceChildren();

    const contacts = getEmergencyContacts();
    const available = contacts.filter((contact) => contact.phone);

    if (available.length === 0) {
      status.textContent = t("sosNoContacts");
      panel.hidden = true;
      return;
    }

    status.textContent = t("sosContactsReady");
    panel.hidden = false;

    available.forEach((contact) => {
      const link = document.createElement("a");

      // Use a telephone link, allowing Android to open its dialer.
      link.href = `tel:${contact.phone.replace(/[^\d+*#,;]/g, "")}`;
      link.textContent = `${t(contact.key)}: ${contact.name}`;
      panel.appendChild(link);
    });
  }

  function handleSOS() {
    sosTapCount++;

    clearTimeout(sosTapTimer);

    sosTapTimer = setTimeout(() => {
      sosTapCount = 0;
    }, 3000);

    if (sosTapCount >= 3) {
      sosTapCount = 0;
      clearTimeout(sosTapTimer);
      displayEmergencyContacts();
    } else {
      $("sosStatus").textContent = t("sosTapHint");
    }
  }

  function showSavedTextPreference() {
    if (largeText) {
      rememberAndEnlargeText();
    }
  }

  $("languageButton").addEventListener("click", () => {
    stopReading();

    language = language === "en" ? "ta" : "en";

    try {
      localStorage.setItem("medizenLanguage", language);
    } catch {}

    applyLanguage();

    // Reapply the enlarged font sizes after translated text is inserted.
    if (largeText) {
      rememberAndEnlargeText();
    }
  });

  $("textSizeButton").addEventListener("click", () => {
    setLargeText(!largeText);
  });

  $("readAloudButton").addEventListener("click", startReading);
  $("stopReadingButton").addEventListener("click", stopReading);
  $("sosButton").addEventListener("click", handleSOS);

  // Initialize the home page.
  applyLanguage();
  showSavedTextPreference();
  updateDateTime();

  // Refresh the clock once a minute.
  window.setInterval(updateDateTime, 60000);
})();
