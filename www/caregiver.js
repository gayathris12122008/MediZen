const PROFILE_KEY = "medizenProfile";
const CAREGIVER_KEY = "medizenCaregiver";

const $ = (id) => document.getElementById(id);

function loadSavedDetails() {
  try {
    const profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
    const caregiver = JSON.parse(localStorage.getItem(CAREGIVER_KEY) || "null");

    if (profile) {
      $("adultName").value = profile.adultName || "";
      $("adultPhone").value = profile.adultPhone || "";
      $("caregiverName").value = profile.caregiverName || "";
      $("caregiverPhone").value = profile.caregiverPhone || "";
      $("relationship").value = profile.relationship || "";
    }

    if (caregiver && caregiver.name && caregiver.phone) {
      showCaregiver(caregiver);
    }
  } catch {
    $("savedCaregiver").textContent = "No caregiver details saved yet.";
  }
}

function showCaregiver(caregiver) {
  $("savedCaregiver").innerHTML = `
    <strong>${caregiver.name}</strong><br>
    ${caregiver.relationship || "Caregiver"}<br>
    ${caregiver.phone}
  `;

  $("callCaregiver").href =
    `tel:${caregiver.phone.replace(/[^\d+]/g, "")}`;

  $("callCaregiver").hidden = false;
}

$("profileForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const profile = {
    adultName: $("adultName").value.trim(),
    adultPhone: $("adultPhone").value.trim(),
    caregiverName: $("caregiverName").value.trim(),
    caregiverPhone: $("caregiverPhone").value.trim(),
    relationship: $("relationship").value
  };

  const caregiver = {
    name: profile.caregiverName,
    phone: profile.caregiverPhone,
    relationship: profile.relationship
  };

  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  localStorage.setItem(CAREGIVER_KEY, JSON.stringify(caregiver));

  showCaregiver(caregiver);
  $("saveStatus").textContent = "Details saved successfully.";
});

loadSavedDetails();