# Schemaplan — Übersichtsschaltplan-Editor

Ein browserbasierter Editor für **Übersichtsschaltpläne von PV- und Speicheranlagen**
(z. B. für die Netzanmeldung bei der Netze BW). Node-basiert: Bausteine platzieren,
Ports frei verdrahten, Kennwerte eintragen, als SVG/PNG exportieren.

Läuft **komplett im Browser** — kein Server, keine Datenbank, keine Cloud.
Alle Daten bleiben auf deinem Gerät.

## Funktionen

- **Bausteinpalette** für Netz/Messung, Erzeugung (PV-WR, MPPT-Laderegler),
  Batterie/Victron (Multi-WR mit AC-In / AC-Out1 / AC-Out2 / DC, Batterie-WR,
  DC-Sammelschiene, Cerbo GX) und Verbraucher (Wallbox, Backup, Steuerbox §14a).
- **Freies Verdrahten** über typisierte Ports (AC = gelb, DC = blau, Signal = grün).
- **Bausteine & Verbindungen** verschieben, auswählen, duplizieren, löschen
  (Klick + Entf, Rechtsklick-Menü oder Löschbutton im Inspektor).
- **Undo / Redo**, Zoom & Pan, Raster-Snapping, Suche in der Palette.
- **Speichern/Laden** als JSON, **Export** als SVG oder PNG.

## Bedienung

| Aktion | Wie |
|---|---|
| Baustein einfügen | Palette anklicken **oder** auf die Fläche ziehen |
| Verbinden | Von einem Port (○) zum anderen ziehen |
| Verschieben (Baustein) | Baustein greifen und ziehen |
| Ansicht verschieben | Leertaste halten + ziehen, oder Mittelklick + ziehen |
| Zoom | Mausrad, oder +/− unten rechts |
| Löschen | Element wählen, dann `Entf` · oder Rechtsklick · oder Inspektor-Button |
| Rückgängig / Wiederholen | `Strg/Cmd+Z` / `Strg/Cmd+Umschalt+Z` |

## Hosting über GitHub Pages

1. Dieses Verzeichnis in ein GitHub-Repo pushen (Dateien im Repo-Root).
2. Im Repo unter **Settings → Pages**: *Source* = „Deploy from a branch",
   Branch = `main`, Ordner = `/ (root)`.
3. Nach ~1 Minute ist die Seite unter
   `https://<user>.github.io/<repo>/` erreichbar.

Jeder weitere `git push` aktualisiert die Live-Seite automatisch.
Die Datei `.nojekyll` verhindert, dass GitHub die Dateien durch Jekyll verarbeitet.

## Lokale Nutzung

Einfach `index.html` im Browser öffnen (Doppelklick). Kein Build nötig.

## Dateien

- `index.html` — Struktur & Styles
- `app.js` — Editor-Logik (keine externen Abhängigkeiten)
- `.nojekyll` — für GitHub Pages

## Hinweis

Der erzeugte Plan dient der Vorbereitung/Dokumentation. Für die Netzanmeldung
ist in der Regel die Einreichung durch eine eingetragene Elektrofachkraft
erforderlich.
