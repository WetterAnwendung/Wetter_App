# Wetter-App

Schlanke, webbasierte Wetter-App mit 5-Tage-Vorhersage, Tageshinweisen (Regenjacke, Sonnenschutz, Frost, Hitze, Böen, Lüften), Temperatur- und Regenverlauf, Regenradar (gemessen und aus Modelldaten), einer Einschätzung des Sonnenuntergangs (mäßig, toll, super), Luftqualität, Pollenflug, Wassertemperaturen und Pegelständen und bis zu fünf gemerkten Orten. Die ganze App steckt in einer einzigen HTML-Datei, ohne Bibliotheken, ohne Cookies und ohne Tracking. Sie lässt sich als App installieren (PWA) und startet dank Service Worker schnell, auch bei schlechtem Netz.

**App öffnen:** https://wetteranwendung.github.io/
**Repository:** https://github.com/WetterAnwendung/wetteranwendung.github.io

## Installieren (als App auf dem Handy)

1. Die Adresse oben in Chrome (Android) bzw. Safari (iPhone) öffnen.
2. Android: Menü ⋮ › *App installieren* / *Zum Startbildschirm hinzufügen*.
   iPhone: Teilen › *Zum Home-Bildschirm*.

Wer die App schon von einer früheren Adresse installiert hatte, muss die alte Verknüpfung entfernen und von der neuen Adresse neu installieren (siehe [Umzug](#umzug)).

## Dateien

| Datei | Zweck |
|---|---|
| `index.html` | Die App: Oberfläche, Logik, eingebettete Schrift, Sicherheitsregel (CSP) |
| `sw.js` | Service Worker: speichert nur die App-Hülle für schnellen Start und Offline-Start |
| `offline.html` | Hinweisseite, wenn keine Verbindung besteht und die App noch nicht gespeichert ist |
| `datenschutz.html` | Datenschutzerklärung als feste Seite ohne Skript (öffentliche Adresse für Google Play) |
| `manifest.webmanifest` | App-Name, Kennung, Startadresse, Symbole und Screenshots für die Installation; `launch_handler`: ein erneuter Aufruf holt das offene Fenster nach vorn statt ein zweites zu öffnen |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` | App-Symbole |
| `screenshots/` | Bilder für den Installationsdialog (Hoch- und Querformat, Beispieldaten) |
| `csp-hash.py` | Berechnet den Sicherheits-Hash des Skripts neu (siehe unten) |
| `wetter-app.html` | Nur Weiterleitung auf `./` für alte Links auf den früheren Dateinamen |
| `.well-known/assetlinks.json` | Digital Asset Links: bestätigt, dass die Android-App `io.github.wetteranwendung.wetter` zu dieser Seite gehört (Vollbild ohne Adressleiste). Enthält nur Paketname und SHA-256-Fingerabdruck des Signaturzertifikats, nichts Geheimes. Bei einem neuen Signaturschlüssel (z. B. Google Play App Signing) zusätzlichen Fingerabdruck ergänzen |
| `.nojekyll` | Leere Datei: schaltet Jekyll bei GitHub Pages ab, sonst würde der Ordner `.well-known` (beginnt mit Punkt) nicht ausgeliefert |
| `.gitignore` | Verhindert, dass APK, AAB, Keystore oder PWABuilder-ZIP versehentlich veröffentlicht werden |

Alle Verweise in der App sind **relativ** (`manifest.webmanifest`, `sw.js`, `icon-192.png`, `./`). Einzige absolute Angaben: die Manifest-Kennung `"id": "/"` und der `canonical`-Link der Weiterleitungsseite.

## Nach Änderungen am Skript: CSP-Hash neu berechnen

Die Content-Security-Policy im Kopf von `index.html` erlaubt nur genau dieses eine Skript, erkannt an seinem sha256-Hash. Wer das Skript ändert, muss den Hash neu eintragen, sonst zeigt die App nur „Die App startet nicht“:

```bash
python3 csp-hash.py index.html
```

Änderungen an HTML-Text, CSS oder Kommentaren außerhalb des `<script>`-Blocks brauchen keinen neuen Hash.

## Service Worker

Strategie **„Netz zuerst mit Zeitlimit“**, nur für die eigenen Dateien der App (App-Hülle):

1. Die Datei wird bei GitHub Pages angefragt.
2. Antwortet GitHub innerhalb von 3 Sekunden, wird die frische Fassung gezeigt und gespeichert.
3. Sonst (langsames Netz, offline) kommt die gespeicherte Fassung.
4. Ist noch nichts gespeichert und das Netz weg, erscheint `offline.html`.

Anfragen an die Datendienste fasst der Service Worker nicht an. Wetterdaten, Orte und Suchbegriffe werden nie gespeichert.

**Pflege**
- Änderungen an `index.html` kommen ohne weiteres Zutun an.
- Kommt eine Datei zur App-Hülle hinzu oder wird umbenannt: Liste `SHELL` in `sw.js` anpassen und `VERSION` erhöhen.
- Die App meldet fremde Service Worker unter derselben Adresse ab; erlaubt ist nur `sw.js`.

**Rückbau** (falls der Service Worker wieder weg soll): `sw.js` **nicht löschen**, ein bereits installierter Service Worker bliebe sonst aktiv. Stattdessen `sw.js` durch diese Abschalt-Version ersetzen, einige Wochen liegen lassen und erst dann entfernen:

```js
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) await caches.delete(k);
  await self.registration.unregister();
  for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate(c.url);
})()));
```

Den Stand vor der Einführung des Service Workers enthält der Branch `vor-pwa`.

## Datendienste

Die App lädt beim Öffnen nichts von fremden Servern. Erst bei einer Suche, beim Tippen auf den Standort-Knopf oder für den zuletzt gewählten Ort gehen Anfragen an diese Dienste (die CSP lässt keine anderen zu):

| Dienst | Wofür |
|---|---|
| `api.open-meteo.com` | Wettervorhersage, Wolkenschichten (auch an zwei Punkten in Richtung des Sonnenuntergangs, ca. 80 und 200 km, auf 0,1° gerundet), Regenkarte aus Modelldaten (81 Rasterpunkte im Umkreis von 60 km, auf 0,01° gerundet) samt Höhen für das Relief (lokal gezeichnet) |
| `api.brightsky.dev` | Gemessenes Regenradar des DWD (nur Orte in Deutschland, erst nach Tippen auf „Jetzt“, gerundete Koordinaten) |
| `geocoding-api.open-meteo.com` | Ortssuche, Postleitzahlen |
| `air-quality-api.open-meteo.com` | Luftqualität (auch Aerosol und Staub) und Pollenflug |
| `marine-api.open-meteo.com` | Wassertemperatur am Meer |
| `photon.komoot.io` | Ortsname zum Standort, Postleitzahlen |
| `www.pegelonline.wsv.de` | Pegel und Wassertemperatur an Flüssen |

GitHub Pages liefert die Seite aus und protokolliert dabei die IP-Adresse. Der Standort wird vor dem Absenden auf etwa 2 km gerundet (Raster 0,02° × 0,03°). Gespeichert werden im Browser nur der zuletzt gewählte Ort (`localStorage`, Schlüssel `wetter:last`), die gemerkten Orte (Schlüssel `wetter:favs`, höchstens 5) und die App-Hülle im Cache des Service Workers. Den Datenschutzhinweis zeigt die App über den ⓘ-Knopf; die vollständige Datenschutzerklärung liegt als eigene Seite ohne Skript unter `datenschutz.html` (öffentliche Adresse für Google Play).

## Sicherheit

- Strenge CSP: nur das eigene Skript, Verbindungen nur zu den Diensten oben, Service Worker nur von der eigenen Adresse, keine fremden Bilder, Schriften oder Skripte
- Keine externen Dateien; die Schrift *Bricolage Grotesque* (SIL Open Font License 1.1) ist eingebettet
- Startet nicht, wenn sie in eine fremde Seite eingebettet wird (Schutz vor Clickjacking); eingebettet wird auch kein Service Worker registriert
- Prüft gespeicherte Daten und Antworten der Dienste, bevor sie angezeigt werden
- Kein Referer, keine Cookies; der Service Worker speichert keine Wetter- oder Ortsdaten
- In der Organisation WetterAnwendung liegt nur diese App: Alle Pages-Projekte einer Organisation teilen sich Adresse und Browser-Speicher

## Umzug

- 24.–25.10.2026: `https://wetteranwendung.github.io/Wetter_App/` (Repository `Wetter_App`)
- Seit 25.10.2026: `https://wetteranwendung.github.io/` (Repository `wetteranwendung.github.io`, Manifest-Kennung `/`)

Hinweise:
- Installierte Apps von früheren Adressen zeigen weiter auf die alte Seite: dort entfernen und neu installieren.
- Beim Wechsel von `…/Wetter_App/` zur Domain-Wurzel bleibt der zuletzt gewählte Ort erhalten (gleiche Domain). Beim Umzug vom alten Konto ging er verloren, weil Browser Daten pro Adresse trennen.
- Die Domain-Wurzel ist nötig, damit die geplante Android-App (TWA) über `/.well-known/assetlinks.json` mit dieser Seite verknüpft werden kann.

## Lizenzen und Quellen

Wetterdaten: [Open-Meteo](https://open-meteo.com/) (CC BY 4.0) · Ortsdaten: © [OpenStreetMap](https://www.openstreetmap.org/copyright)-Mitwirkende (ODbL), GeoNames (CC BY 4.0) · Pegel: [PEGELONLINE](https://www.pegelonline.wsv.de/) der WSV (dl-de/by-2-0) · Schrift: Bricolage Grotesque (OFL 1.1)
