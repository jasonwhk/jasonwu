const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "..", "data", "plates.de.json");
const raw = fs.readFileSync(dataPath, "utf8");
const data = JSON.parse(raw);

const errors = [];
const codeSet = new Set();

const hasValue = (value) => value !== null && value !== undefined && value !== "";

if (!Array.isArray(data)) {
  errors.push("Dataset should be a JSON array.");
}

if (Array.isArray(data)) {
  data.forEach((entry, index) => {
    const prefix = `Entry ${index + 1}`;
    if (!hasValue(entry.code)) {
      errors.push(`${prefix}: missing code.`);
    }
    if (!hasValue(entry.name)) {
      errors.push(`${prefix}: missing name.`);
    }
    if (!hasValue(entry.state)) {
      errors.push(`${prefix}: missing state.`);
    }

    if (hasValue(entry.code)) {
      const code = String(entry.code).toUpperCase();
      if (codeSet.has(code)) {
        errors.push(`${prefix}: duplicate code ${code}.`);
      } else {
        codeSet.add(code);
      }
    }

    const hasLat = entry.lat !== null && entry.lat !== undefined;
    const hasLon = entry.lon !== null && entry.lon !== undefined;

    if (hasLat !== hasLon) {
      errors.push(`${prefix}: lat/lon must both be set or both be null.`);
    }

    if (hasLat && hasLon) {
      if (typeof entry.lat !== "number" || typeof entry.lon !== "number") {
        errors.push(`${prefix}: lat/lon must be numbers.`);
      } else {
        if (entry.lat < 47 || entry.lat > 55) {
          errors.push(`${prefix}: latitude out of expected range (${entry.lat}).`);
        }
        if (entry.lon < 5 || entry.lon > 16) {
          errors.push(`${prefix}: longitude out of expected range (${entry.lon}).`);
        }
      }
    }
  });
}

if (errors.length > 0) {
  console.error("Validation failed:\n" + errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Validation passed: dataset looks good.");
}
