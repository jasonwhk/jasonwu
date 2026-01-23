# Kennzeichen data

This folder contains the local dataset used by the Kennzeichen-Finder app.

## File: `plates.de.json`

The JSON file is an array of entries with the following schema:

```json
{
  "code": "BN",
  "name": "Bonn",
  "state": "Nordrhein-Westfalen",
  "lat": 50.7374,
  "lon": 7.0982
}
```

### Fields

- `code` (string, required): License plate prefix.
- `name` (string, required): City/region name.
- `state` (string, required): Bundesland.
- `lat` / `lon` (number, optional): Coordinates used for the map. If a coordinate is
  missing, set **both** to `null`. Some entries use state-level centroids when a more
  precise location is not available yet.

## Updating the dataset

1. Edit `plates.de.json` and add or update entries.
2. Keep `code` values unique.
3. If you add coordinates, make sure they are valid for Germany.
4. Run the validation script:

```sh
node ../scripts/validate-plates.js
```

The script checks for unique codes, required fields, and valid coordinate ranges.
