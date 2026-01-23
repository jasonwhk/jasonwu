const germanyCenter = [51.1657, 10.4515];
const germanyZoom = 6;
const selectionZoom = 8;
const map = L.map("map", {
  center: germanyCenter,
  zoom: germanyZoom,
  scrollWheelZoom: true,
});

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

const resultsList = document.getElementById("results-list");
const searchInput = document.getElementById("search");
const plateInput = document.getElementById("plate-input");
const plateSubmit = document.getElementById("plate-submit");
const plateMessage = document.getElementById("plate-message");
const detailsEmpty = document.getElementById("details-empty");
const detailsContent = document.getElementById("details-content");
const detailsCode = document.getElementById("details-code");
const detailsName = document.getElementById("details-name");
const detailsState = document.getElementById("details-state");
const detailsMap = document.getElementById("details-map");
const resetButton = document.getElementById("reset-view");

let activeMarker = null;
let highlightRing = null;
let highlightTimeoutId = null;
let activeButton = null;
let allEntries = [];
let filteredEntries = [];
let debounceId = null;

const MAX_VISIBLE_RESULTS = 200;

const updateDetails = (entry) => {
  detailsEmpty.hidden = true;
  detailsContent.hidden = false;
  detailsCode.textContent = entry.code;
  detailsName.textContent = entry.name;
  detailsState.textContent = entry.state || "—";
  detailsMap.textContent =
    entry.lat != null && entry.lon != null
      ? `${entry.lat.toFixed(4)}, ${entry.lon.toFixed(4)}`
      : "Coordinates not available yet";
};

const selectEntry = (entry, button) => {
  if (activeButton) {
    activeButton.classList.remove("is-active");
  }
  if (button) {
    button.classList.add("is-active");
    activeButton = button;
  }

  if (entry.lat != null && entry.lon != null) {
    const location = [entry.lat, entry.lon];
    if (!activeMarker) {
      activeMarker = L.marker(location).addTo(map);
    } else {
      activeMarker.setLatLng(location);
    }

    if (highlightRing) {
      map.removeLayer(highlightRing);
      highlightRing = null;
    }
    if (highlightTimeoutId) {
      window.clearTimeout(highlightTimeoutId);
      highlightTimeoutId = null;
    }

    highlightRing = L.circle(location, {
      radius: 20000,
      className: "highlight-ring",
    }).addTo(map);

    highlightTimeoutId = window.setTimeout(() => {
      if (highlightRing) {
        map.removeLayer(highlightRing);
        highlightRing = null;
      }
      highlightTimeoutId = null;
    }, 1800);

    const popupHtml = `<strong>${entry.code}</strong><br>${entry.name}`;
    activeMarker.bindPopup(popupHtml).openPopup();
    map.flyTo(location, selectionZoom, { duration: 0.8 });
  } else {
    if (activeMarker) {
      map.removeLayer(activeMarker);
      activeMarker = null;
    }
    map.flyTo(germanyCenter, germanyZoom, { duration: 0.8 });
  }
  updateDetails(entry);
};

const renderList = (entries) => {
  resultsList.innerHTML = "";
  const fragment = document.createDocumentFragment();

  entries.slice(0, MAX_VISIBLE_RESULTS).forEach((entry) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "results-button";
    button.setAttribute("role", "option");
    button.dataset.code = entry.code;
    button.innerHTML = `<strong>${entry.code}</strong><span>${entry.name}</span>`;
    button.addEventListener("click", () => selectEntry(entry, button));
    item.appendChild(button);
    fragment.appendChild(item);
  });

  resultsList.appendChild(fragment);
};

const renderEmptyState = (message) => {
  resultsList.innerHTML = `<li><div class="placeholder">${message}</div></li>`;
};

const normalize = (value) => value.trim().toLowerCase();

const setPlateMessage = (message, status = "info") => {
  plateMessage.textContent = message;
  plateMessage.classList.remove("is-error", "is-success");
  if (status === "error") {
    plateMessage.classList.add("is-error");
  }
  if (status === "success") {
    plateMessage.classList.add("is-success");
  }
};

const filterEntries = (query) => {
  if (!query) {
    return allEntries;
  }
  const normalized = normalize(query);
  return allEntries.filter((entry) => {
    const codeMatch = entry.code.toLowerCase().startsWith(normalized);
    const nameMatch = entry.name.toLowerCase().includes(normalized);
    return codeMatch || nameMatch;
  });
};

const applyFilter = () => {
  const query = searchInput.value;
  filteredEntries = filterEntries(query);
  if (filteredEntries.length === 0) {
    renderEmptyState("No matches found. Try another code or city.");
    return;
  }
  renderList(filteredEntries);
};

const extractPlateLetters = (plateValue) => {
  const trimmed = plateValue.trim().toUpperCase();
  if (!trimmed) {
    return null;
  }
  const match = trimmed.match(/^[A-ZÄÖÜ]+/);
  return match ? match[0] : null;
};

const findPlateCandidates = (letters) => {
  const byPrefix = allEntries
    .filter((entry) => letters.startsWith(entry.code))
    .sort((a, b) => b.code.length - a.code.length);
  if (byPrefix.length > 0) {
    return byPrefix;
  }
  return allEntries.filter((entry) => entry.code.startsWith(letters));
};

const handlePlateSubmit = () => {
  if (allEntries.length === 0) {
    setPlateMessage("Data is still loading. Please try again shortly.", "error");
    return;
  }
  const letters = extractPlateLetters(plateInput.value);
  if (!letters) {
    setPlateMessage("Enter a plate like BN-AB 1234 to detect the prefix.", "error");
    return;
  }
  const candidates = findPlateCandidates(letters);
  if (candidates.length === 0) {
    setPlateMessage(`No matches for "${letters}". Try another plate.`, "error");
    return;
  }
  const bestLength = candidates[0].code.length;
  const bestMatches = candidates.filter((entry) => entry.code.length === bestLength);
  if (bestMatches.length === 1) {
    const best = bestMatches[0];
    searchInput.value = best.code;
    applyFilter();
    const button = resultsList.querySelector(`button[data-code="${best.code}"]`);
    selectEntry(best, button);
    setPlateMessage(`Matched ${best.code} — ${best.name}.`, "success");
    return;
  }
  searchInput.value = letters;
  applyFilter();
  const suggestions = bestMatches.map((entry) => entry.code).join(", ");
  setPlateMessage(
    `Multiple matches: ${suggestions}. Pick the right one from the results.`,
    "error",
  );
};

const scheduleFilter = () => {
  if (debounceId) {
    window.clearTimeout(debounceId);
  }
  debounceId = window.setTimeout(applyFilter, 120);
};

const handleSearchKeydown = (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    const firstEntry = filteredEntries[0];
    if (firstEntry) {
      const firstButton = resultsList.querySelector("button");
      selectEntry(firstEntry, firstButton);
    }
  }
  if (event.key === "Escape") {
    event.preventDefault();
    searchInput.value = "";
    applyFilter();
    searchInput.blur();
  }
};

const loadPlates = async () => {
  try {
    const response = await fetch("data/plates.de.json");
    if (!response.ok) {
      throw new Error("Failed to load dataset");
    }
    const data = await response.json();
    allEntries = data
      .slice()
      .sort((a, b) => a.code.localeCompare(b.code, "de"));

    filteredEntries = allEntries;
    renderList(allEntries);
    searchInput.addEventListener("input", scheduleFilter);
    searchInput.addEventListener("keydown", handleSearchKeydown);
    plateInput.addEventListener("input", () => setPlateMessage(""));
    plateSubmit.addEventListener("click", handlePlateSubmit);
    plateInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handlePlateSubmit();
      }
    });
  } catch (error) {
    renderEmptyState("Unable to load data.");
  }
};

loadPlates();

resetButton.addEventListener("click", () => {
  map.flyTo(germanyCenter, germanyZoom, { duration: 0.8 });
});
