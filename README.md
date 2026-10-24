# Wetter-App

Schlanke, webbasierte Wetter-App mit 5-Tage-Vorhersage, Pollenflug, Wassertemperaturen und Pegelständen. Die ganze App steckt in einer einzigen HTML-Datei, ohne Bibliotheken, ohne Cookies und ohne Tracking.

**App öffnen:** https://wetteranwendung.github.io/Wetter_App/
**Repository:** https://github.com/WetterAnwendung/Wetter_App

## Installieren (als App auf dem Handy)

1. Die Adresse oben in Chrome (Android) bzw. Safari (iPhone) öffnen.
2. Android: Menü ⋮ › *App installieren* / *Zum Startbildschirm hinzufügen*.
   iPhone: Teilen › *Zum Home-Bildschirm*.

Wer die App schon von der alten Adresse installiert hatte, muss die alte Verknüpfung entfernen und von der neuen Adresse neu installieren (siehe [Umzug](#umzug)).

## Dateien

| Datei | Zweck |
|---|---|
| `index.html` | Die App: Oberfläche, Logik, eingebettete Schrift, Sicherheitsregel (CSP) |
| `manifest.webmanifest` | App-Name, Kennung, Startadresse und Symbole für die Installation |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` | App-Symbole |
| `csp-hash.py` | Berechnet den Sicherheits-Hash des Skripts neu (siehe unten) |
| `wetter-app.html` | Nur Weiterleitung auf `./` für alte Links auf den früheren Dateinamen |

Alle Verweise in der App sind **relativ** (`manifest.webmanifest`, `icon-192.png`, `./`). Die App funktioniert deshalb unter jeder Adresse und in jedem Unterordner, ohne dass Pfade angepasst werden müssen. Einzige absolute Angaben: die Manifest-Kennung `"id": "/Wetter_App/"` und die Weiterleitungsseite `wetter-app.html`.

## Nach Änderungen am Skript: CSP-Hash neu berechnen

Die Content-Security-Policy im Kopf von `index.html` erlaubt nur genau dieses eine Skript, erkannt an seinem sha256-Hash. Wer das Skript ändert, muss den Hash neu eintragen, sonst zeigt die App nur „Die App startet nicht“:

```bash
python3 csp-hash.py index.html
```

Änderungen an HTML-Text, CSS oder Kommentaren außerhalb des `<script>`-Blocks brauchen keinen neuen Hash.

## Datendienste

Die App lädt beim Öffnen nichts von außen. Erst bei einer Suche oder beim Tippen auf den Standort-Knopf gehen Anfragen an diese Dienste (die CSP lässt keine anderen zu):

| Dienst | Wofür |
|---|---|
| `api.open-meteo.com` | Wettervorhersage |
| `geocoding-api.open-meteo.com` | Ortssuche, Postleitzahlen |
| `air-quality-api.open-meteo.com` | Pollenflug |
| `marine-api.open-meteo.com` | Wassertemperatur am Meer |
| `photon.komoot.io` | Ortsname zum Standort, Postleitzahlen |
| `www.pegelonline.wsv.de` | Pegel und Wassertemperatur an Flüssen |

GitHub Pages liefert die Seite aus und protokolliert dabei die IP-Adresse. Der Standort wird vor dem Absenden auf etwa 1 km gerundet. Gespeichert wird nur der zuletzt gewählte Ort im Browser (`localStorage`, Schlüssel `wetter:last`). Den vollständigen Datenschutzhinweis zeigt die App über den ⓘ-Knopf.

## Sicherheit

- Strenge CSP: nur das eigene Skript, Verbindungen nur zu den Diensten oben, keine fremden Bilder, Schriften oder Skripte
- Keine externen Dateien; die Schrift *Bricolage Grotesque* (SIL Open Font License 1.1) ist eingebettet
- Startet nicht, wenn sie in eine fremde Seite eingebettet wird (Schutz vor Clickjacking)
- Prüft gespeicherte Daten und Antworten der Dienste, bevor sie angezeigt werden
- Kein Referer, keine Cookies, kein Service Worker

## Umzug

Die App lag früher unter `https://saschamartinmail-design.github.io/Wetter_App_Claude_V01/wetter-app.html` und ist am 24.10.2026 in die Organisation **WetterAnwendung** umgezogen.

- Die App heißt jetzt `index.html`, damit die kurze Adresse `…/Wetter_App/` direkt funktioniert.
- Die Manifest-Kennung lautet jetzt `/Wetter_App/`.
- Der zuletzt gewählte Ort wird nicht übernommen, weil Browser gespeicherte Daten pro Adresse trennen. Einmal neu suchen genügt.
- Installierte Apps von der alten Adresse zeigen weiter auf die alte Seite: dort entfernen und neu installieren.
- Vorteil des Umzugs: Die App teilt ihre Adresse (und damit den Browser-Speicher) nicht mehr mit anderen Projekten unter `saschamartinmail-design.github.io`.

## Lizenzen und Quellen

Wetterdaten: [Open-Meteo](https://open-meteo.com/) (CC BY 4.0) · Ortsdaten: © [OpenStreetMap](https://www.openstreetmap.org/copyright)-Mitwirkende (ODbL), GeoNames (CC BY 4.0) · Pegel: [PEGELONLINE](https://www.pegelonline.wsv.de/) der WSV (dl-de/by-2-0) · Schrift: Bricolage Grotesque (OFL 1.1)
