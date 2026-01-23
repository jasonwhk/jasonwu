const germanyCenter = [51.1657, 10.4515];
const map = L.map("map", {
  center: germanyCenter,
  zoom: 6,
  scrollWheelZoom: true,
});

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

const resultsList = document.getElementById("results-list");
const detailsEmpty = document.getElementById("details-empty");
const detailsContent = document.getElementById("details-content");
const detailsCode = document.getElementById("details-code");
const detailsName = document.getElementById("details-name");
const detailsState = document.getElementById("details-state");
const detailsMap = document.getElementById("details-map");

let activeMarker = null;
let activeButton = null;

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
    if (!activeMarker) {
      activeMarker = L.marker([entry.lat, entry.lon]).addTo(map);
    } else {
      activeMarker.setLatLng([entry.lat, entry.lon]);
    }

    const popupHtml = `<strong>${entry.code}</strong><br>${entry.name}`;
    activeMarker.bindPopup(popupHtml).openPopup();
    map.setView([entry.lat, entry.lon], 8);
  } else {
    if (activeMarker) {
      map.removeLayer(activeMarker);
      activeMarker = null;
    }
    map.setView(germanyCenter, 6);
  }
  updateDetails(entry);
};

const renderList = (entries) => {
  resultsList.innerHTML = "";
  const fragment = document.createDocumentFragment();

  entries.forEach((entry) => {
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

const loadPlates = async () => {
  try {
    const response = await fetch("data/plates.de.json");
    if (!response.ok) {
      throw new Error("Failed to load dataset");
    }
    const data = await response.json();
    const entries = data
      .slice()
      .sort((a, b) => a.code.localeCompare(b.code, "de"));

    renderList(entries);
  } catch (error) {
    resultsList.innerHTML =
      "<li><div class=\"placeholder\">Unable to load data.</div></li>";
  }
};

loadPlates();
