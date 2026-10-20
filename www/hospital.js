
"use strict";

const $ = (id) => document.getElementById(id);

const locateButton = $("locateButton");
const searchForm = $("searchForm");
const locationInput = $("locationInput");
const radiusSelect = $("radiusSelect");
const refreshButton = $("refreshButton");
const statusMessage = $("statusMessage");
const hospitalList = $("hospitalList");
const resultCount = $("resultCount");

let map;
let userMarker = null;
let hospitalMarkers = [];
let currentLocation = null;
let requestNumber = 0;

const overpassEndpoints = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter"
];

function setStatus(message) {
  statusMessage.textContent = message;
}

function setBusy(busy) {
  locateButton.disabled = busy;
  refreshButton.disabled = busy;
  searchForm.querySelector("button[type='submit']").disabled = busy;

  locateButton.textContent = busy
    ? "Please wait..."
    : "📍 Use My Current Location";
}

function initialiseMap() {
  if (typeof L === "undefined") {
    setStatus("The map library could not load. Check your internet connection.");
    return;
  }

  // A neutral starting view; no user location is assumed.
  map = L.map("map").setView([20, 0], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  }).addTo(map);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371;
  const radians = (degrees) => degrees * Math.PI / 180;

  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(lat1)) *
    Math.cos(radians(lat2)) *
    Math.sin(dLon / 2) ** 2;

  return earthRadius * 2 * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a)
  );
}

function formatDistance(distance) {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m away`;
  }

  return `${distance.toFixed(1)} km away`;
}

function clearHospitalMarkers() {
  hospitalMarkers.forEach((marker) => map.removeLayer(marker));
  hospitalMarkers = [];
}

function showEmptyState(message) {
  hospitalList.replaceChildren();

  const container = document.createElement("div");
  container.className = "empty-state";

  const icon = document.createElement("span");
  icon.textContent = "🏥";
  icon.setAttribute("aria-hidden", "true");

  const text = document.createElement("p");
  text.textContent = message;

  container.append(icon, text);
  hospitalList.append(container);
}

function getElementCoordinates(element) {
  if (
    Number.isFinite(element.lat) &&
    Number.isFinite(element.lon)
  ) {
    return { lat: element.lat, lon: element.lon };
  }

  if (
    element.center &&
    Number.isFinite(element.center.lat) &&
    Number.isFinite(element.center.lon)
  ) {
    return {
      lat: element.center.lat,
      lon: element.center.lon
    };
  }

  return null;
}

function getHospitalName(tags) {
  return tags.name ||
    tags["name:en"] ||
    tags.official_name ||
    "Hospital (name unavailable)";
}

function getAddress(tags) {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"],
    tags["addr:city"] || tags["addr:town"] || tags["addr:village"],
    tags["addr:postcode"]
  ].filter(Boolean);

  return parts.length
    ? parts.join(", ")
    : "Address not listed";
}

function getPhone(tags) {
  return tags.phone ||
    tags["contact:phone"] ||
    tags["contact:mobile"] ||
    "";
}

async function fetchOverpass(query) {
  let lastError;

  for (const endpoint of overpassEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
        },
        body: "data=" + encodeURIComponent(query),
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        throw new Error(`Hospital data service returned ${response.status}.`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Hospital data is temporarily unavailable.");
}

async function searchHospitals(lat, lon) {
  if (!map) {
    setStatus("The map is unavailable. Refresh the page and try again.");
    return;
  }

  const thisRequest = ++requestNumber;
  const radius = Number(radiusSelect.value);

  currentLocation = { lat, lon };

  setBusy(true);
  setStatus("Finding hospitals near your selected location...");
  resultCount.textContent = "Searching...";
  showEmptyState("Searching for nearby hospitals...");
  clearHospitalMarkers();

  if (userMarker) {
    map.removeLayer(userMarker);
  }

  userMarker = L.marker([lat, lon])
    .addTo(map)
    .bindPopup("Your selected location");

  userMarker.openPopup();
  map.setView([lat, lon], radius <= 2000 ? 15 : 13);

  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="hospital"](around:${radius},${lat},${lon});
      way["amenity"="hospital"](around:${radius},${lat},${lon});
      relation["amenity"="hospital"](around:${radius},${lat},${lon});
      node["healthcare"="hospital"](around:${radius},${lat},${lon});
      way["healthcare"="hospital"](around:${radius},${lat},${lon});
      relation["healthcare"="hospital"](around:${radius},${lat},${lon});
    );
    out center tags;
  `;

  try {
    const data = await fetchOverpass(query);

    // Ignore older results if the user starts another search.
    if (thisRequest !== requestNumber) return;

    const unique = new Map();

    for (const element of data.elements || []) {
      const coordinates = getElementCoordinates(element);

      if (!coordinates) continue;

      const distance = calculateDistance(
        lat,
        lon,
        coordinates.lat,
        coordinates.lon
      );

      if (distance * 1000 > radius) continue;

      const tags = element.tags || {};
      const key = `${element.type}-${element.id}`;

      unique.set(key, {
        id: key,
        name: getHospitalName(tags),
        address: getAddress(tags),
        phone: getPhone(tags),
        lat: coordinates.lat,
        lon: coordinates.lon,
        distance,
        tags
      });
    }

    const hospitals = [...unique.values()].sort(
      (a, b) => a.distance - b.distance
    );

    renderHospitals(hospitals);

    if (hospitals.length === 0) {
      setStatus(
        "No hospitals were found in this radius. Try a larger search radius."
      );
    } else {
      setStatus(`Found ${hospitals.length} mapped hospital(s).`);
    }
  } catch (error) {
    if (thisRequest !== requestNumber) return;

    console.error("Hospital search failed:", error);

    showEmptyState(
      "Hospital data could not be loaded. Check your internet connection and try again."
    );

    resultCount.textContent = "Search unavailable.";
    setStatus(
      "The hospital data service may be busy. Please try Search Again in a moment."
    );
  } finally {
    if (thisRequest === requestNumber) {
      setBusy(false);
    }
  }
}

function renderHospitals(hospitals) {
  hospitalList.replaceChildren();
  clearHospitalMarkers();

  resultCount.textContent =
    `${hospitals.length} hospital(s), nearest first`;

  if (hospitals.length === 0) {
    showEmptyState("No mapped hospitals found in the selected area.");
    return;
  }

  const bounds = [];

  hospitals.forEach((hospital, index) => {
    const marker = L.marker([hospital.lat, hospital.lon])
      .addTo(map)
      .bindPopup("");

    const popup = document.createElement("div");
    const popupTitle = document.createElement("strong");
    popupTitle.textContent = hospital.name;

    const popupDistance = document.createElement("p");
    popupDistance.textContent = formatDistance(hospital.distance);

    popup.append(popupTitle, popupDistance);

    if (hospital.address !== "Address not listed") {
      const popupAddress = document.createElement("p");
      popupAddress.textContent = hospital.address;
      popup.append(popupAddress);
    }

    marker.setPopupContent(popup);
    marker.on("click", () => {
      const card = $("hospital-" + index);
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });

    hospitalMarkers.push(marker);
    bounds.push([hospital.lat, hospital.lon]);

    const card = document.createElement("article");
    card.className = "hospital-card";
    card.id = "hospital-" + index;

    const title = document.createElement("h3");
    title.textContent = hospital.name;

    const distance = document.createElement("p");
    distance.className = "hospital-distance";
    distance.textContent = formatDistance(hospital.distance);

    const address = document.createElement("p");
    address.textContent = "📍 " + hospital.address;

    card.append(title, distance, address);

    if (hospital.phone) {
      const phone = document.createElement("p");
      phone.textContent = "☎ " + hospital.phone;
      card.append(phone);
    }

    const actions = document.createElement("div");
    actions.className = "hospital-actions";

    const mapButton = document.createElement("button");
    mapButton.type = "button";
    mapButton.textContent = "Show on Map";
    mapButton.addEventListener("click", () => {
      map.setView([hospital.lat, hospital.lon], 16);
      marker.openPopup();
    });

    actions.append(mapButton);

    if (hospital.phone) {
      const callLink = document.createElement("a");
      callLink.href = "tel:" + hospital.phone.replace(/[^\d+]/g, "");
      callLink.textContent = "Call Hospital";
      actions.append(callLink);
    }

    const directions = document.createElement("a");
    directions.href =
      "https://www.google.com/maps/dir/?api=1&destination=" +
      encodeURIComponent(`${hospital.lat},${hospital.lon}`);
    directions.target = "_blank";
    directions.rel = "noopener noreferrer";
    directions.textContent = "Get Directions ↗";

    actions.append(directions);
    card.append(actions);
    hospitalList.append(card);
  });

  if (userMarker) {
    bounds.push(userMarker.getLatLng());
  }

  if (bounds.length === 1) {
    map.setView(bounds[0], 15);
  } else if (bounds.length > 1) {
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
  }
}

function useCurrentLocation() {
  if (!navigator.geolocation) {
    setStatus("Your browser does not support location detection.");
    return;
  }

  setBusy(true);
  setStatus("Requesting permission to access your location...");

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      await searchHospitals(lat, lon);
    },
    (error) => {
      setBusy(false);

      if (error.code === error.PERMISSION_DENIED) {
        setStatus(
          "Location permission was denied. Allow location access in your browser, or search for a town or area instead."
        );
      } else if (error.code === error.TIMEOUT) {
        setStatus(
          "Location detection timed out. Try again or search by area."
        );
      } else {
        setStatus(
          "Your location could not be detected. Check device location settings or search by area."
        );
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000
    }
  );
}

async function searchByArea(place) {
  const queryText = place.trim();

  if (!queryText) {
    setStatus("Enter a town, city, or area name first.");
    locationInput.focus();
    return;
  }

  setBusy(true);
  setStatus("Looking up the location...");

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", queryText);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("Location search is unavailable.");
    }

    const places = await response.json();

    if (!places.length) {
      setStatus("Location not found. Try a different town or area.");
      setBusy(false);
      return;
    }

    await searchHospitals(
      Number(places[0].lat),
      Number(places[0].lon)
    );
  } catch (error) {
    console.error("Location lookup failed:", error);
    setBusy(false);
    setStatus(
      "Could not look up that area. Check your connection and try again."
    );
  }
}

locateButton.addEventListener("click", useCurrentLocation);

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  searchByArea(locationInput.value);
});

refreshButton.addEventListener("click", () => {
  if (currentLocation) {
    searchHospitals(currentLocation.lat, currentLocation.lon);
  } else {
    setStatus("Choose your location or search for an area first.");
  }
});

radiusSelect.addEventListener("change", () => {
  if (currentLocation) {
    searchHospitals(currentLocation.lat, currentLocation.lon);
  }
});

initialiseMap();
