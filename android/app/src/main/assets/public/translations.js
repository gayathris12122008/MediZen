
/* MediZen: shared English and Tamil translations */
(function () {
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
      settingsDescription: "Manage profiles, medicines, appointments and app details",
      openFeature: "Open service →",
      openSettings: "Open settings →",

      languageButton: "🌐 English / தமிழ்",
      textSizeButton: "A+ Text Size",
      normalTextSize: "A− Normal Size",
      readAloudButton: "🔊 Read Aloud",
      stopReadingButton: "⏹ Stop Reading",
      sosButton: "SOS — GET HELP",

      loadingDate: "Loading date...",
      loadingTime: "Loading time...",
      footerMessage: "Care made clearer. One step at a time.",

      tapMore: n => `Tap ${n} more time${n === 1 ? "" : "s"} to activate SOS.`,
      sosCalling: "SOS activated. Opening your phone app...",
      noCaregiver: "No caregiver number saved. Please add one in Caretaker settings.",
      invalidPhone: "The saved caregiver phone number is invalid.",
      sosReset: "SOS cancelled. Tap 3 times to activate.",
      readUnsupported: "Read aloud is not supported on this device.",
      serviceComingSoon: name => `${name} will be added soon.`
    },

    ta: {
      welcomeLabel: "உங்கள் தனிப்பட்ட சுகாதாரத் துணை",
      welcomeTitle: "உங்கள் ஆரோக்கியம், இப்போது எளிதாக.",
      welcomeDescription: "உங்களுக்குத் தேவையான அனைத்தும் ஒரே இடத்தில்.",
      dailyQuote: "இன்றைய சிந்தனை",
      featuresHeading: "இன்று உங்களுக்கு என்ன தேவை?",
      featuresDescription: "தொடர ஒரு சேவையைத் தேர்ந்தெடுக்கவும்.",

      medicinesTitle: "என் மருந்துகள்",
      medicinesDescription: "மருந்து நினைவூட்டல்கள் மற்றும் அட்டவணைகள்",
      appointmentsTitle: "சந்திப்புகள்",
      appointmentsDescription: "உங்கள் சந்திப்புகள் மற்றும் அட்டவணைகள்",
      caretakerTitle: "பராமரிப்பாளர்",
      caretakerDescription: "நம்பகமான அவசரத் தொடர்பைச் சேமிக்கவும்",
      hospitalsTitle: "அருகிலுள்ள மருத்துவமனைகள்",
      hospitalsDescription: "மருத்துவமனைத் தகவல்களைக் கண்டறியவும்",
      tipsTitle: "சுகாதாரக் குறிப்புகள்",
      tipsDescription: "அன்றாட ஆரோக்கியம் மற்றும் நலக் குறிப்புகள்",
      settingsTitle: "அமைப்புகள்",
      settingsDescription: "சுயவிவரங்கள், மருந்துகள், சந்திப்புகள் மற்றும் செயலி விவரங்களை நிர்வகிக்கவும்",
      openFeature: "சேவையைத் திறக்கவும் →",
      openSettings: "அமைப்புகளைத் திறக்கவும் →",

      languageButton: "🌐 தமிழ் / English",
      textSizeButton: "A+ உரையைப் பெரிதாக்கு",
      normalTextSize: "A− இயல்பான உரை",
      readAloudButton: "🔊 சத்தமாக வாசிக்கவும்",
      stopReadingButton: "⏹ வாசிப்பதை நிறுத்து",
      sosButton: "SOS — உதவி பெறவும்",

      loadingDate: "தேதி ஏற்றப்படுகிறது...",
      loadingTime: "நேரம் ஏற்றப்படுகிறது...",
      footerMessage: "தெளிவான பராமரிப்பு. ஒவ்வொரு அடியாக.",

      tapMore: n => `SOS செயல்பட இன்னும் ${n} முறை தட்டவும்.`,
      sosCalling: "SOS செயல்படுத்தப்பட்டது. தொலைபேசி செயலியைத் திறக்கிறது...",
      noCaregiver: "பராமரிப்பாளரின் எண் சேமிக்கப்படவில்லை. பராமரிப்பாளர் அமைப்புகளில் எண்ணைச் சேர்க்கவும்.",
      invalidPhone: "சேமிக்கப்பட்ட பராமரிப்பாளர் தொலைபேசி எண் தவறானது.",
      sosReset: "SOS ரத்து செய்யப்பட்டது. செயல்படுத்த 3 முறை தட்டவும்.",
      readUnsupported: "இந்தச் சாதனத்தில் சத்தமாக வாசிக்கும் வசதி இல்லை.",
      serviceComingSoon: name => `${name} விரைவில் சேர்க்கப்படும்.`
    }
  };

  const storageKey = "medizenLanguage";

  function getLanguage() {
    try {
      return localStorage.getItem(storageKey) === "ta" ? "ta" : "en";
    } catch {
      return "en";
    }
  }

  let language = getLanguage();

  function t(key, ...args) {
    const entry = translations[language][key] ??
                  translations.en[key] ??
                  key;
    return typeof entry === "function" ? entry(...args) : entry;
  }

  function apply(root = document) {
    document.documentElement.lang = language;

    root.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      const value = t(key);
      if (typeof value === "string") el.textContent = value;
    });

    root.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });

    root.querySelectorAll("[data-i18n-title]").forEach(el => {
      el.title = t(el.dataset.i18nTitle);
    });

    root.querySelectorAll("[data-i18n-aria-label]").forEach(el => {
      el.setAttribute("aria-label", t(el.dataset.i18nAriaLabel));
    });

    document.querySelectorAll("[data-i18n-html-lang]").forEach(el => {
      el.lang = language;
    });

    document.dispatchEvent(new CustomEvent("medizen:languagechange", {
      detail: { language }
    }));
  }

  function setLanguage(nextLanguage) {
    language = nextLanguage === "ta" ? "ta" : "en";

    try {
      localStorage.setItem(storageKey, language);
    } catch (error) {
      console.warn("Could not save language preference.", error);
    }

    apply();
  }

  function toggleLanguage() {
    setLanguage(language === "en" ? "ta" : "en");
  }

  window.MediZenI18n = {
    translations,
    t,
    apply,
    setLanguage,
    toggleLanguage,
    getLanguage: () => language
  };
})();
