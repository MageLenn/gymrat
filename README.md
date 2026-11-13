# GymRat

Offline-Trainings-Tracker fürs iPhone (Web-App zum Installieren). Alle Daten bleiben lokal auf dem Gerät.

## Installieren
1. Repo mit GitHub Desktop veröffentlichen (öffentlich).
2. Auf github.com: Settings → Pages → Branch `main` / `(root)` → Save.
3. Den Pages-Link in Safari öffnen → Teilen → „Zum Home-Bildschirm“.

## Updates
Nach jeder Änderung an den App-Dateien `VERSION` in `sw.js` hochzählen (z. B. `gymrat-v2`), sonst behält das iPhone die alte Version.

## Format für den Geräte-Import
In der App: Start → Zahnrad → „Geräteliste importieren“. Die JSON-Datei sieht so aus:

```json
{
  "devices": [
    { "name": "Brustpresse", "category": "kraft", "muscle": "Brust", "step": 2.5 },
    { "name": "Kurzhantel: Seitheben", "category": "kraft", "muscle": "Schultern", "step": 2 },
    { "name": "Fahrrad 1", "category": "cardio", "cardioType": "bike" },
    { "name": "Laufband 1", "category": "cardio", "cardioType": "treadmill" }
  ],
  "templates": {
    "push": ["Brustpresse", "Kurzhantel: Seitheben"],
    "pull": [],
    "legs": []
  }
}
```

- `category`: `kraft` oder `cardio`
- `muscle`: Brust, Rücken, Schultern, Bizeps, Trizeps, Unterarme, Bauch, Quadrizeps, Beinbeuger, Gesäß, Waden, Adduktoren / Abduktoren, Ganzkörper
- `step`: Gewichtsschritte in kg (0.5, 1, 1.25, 2, 2.5, 5, 10)
- `cardioType`: `bike`, `treadmill`, `crosstrainer`, `rower`, `stepper`, `other`
- `templates` ist optional und legt Trainingspläne an (oder füllt leere Pläne mit gleichem Namen). Geräte mit schon vorhandenem Namen werden übersprungen.

Die Startgeräte des Studios und die Pläne Push / Pull / Legs stehen in `seed.js`. Wird dort `version` erhöht, übernimmt die App beim nächsten Start neue Geräte, ohne vorhandene zu ändern.
