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

const testMarker = L.marker([50.7374, 7.0982]).addTo(map);

testMarker
  .bindPopup("<strong>BN</strong><br>Bonn (Test marker)")
  .openPopup();
