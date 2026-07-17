# Schemaplan — Übersichtsschaltplan-Editor

Ein browserbasierter Editor für **Übersichtsschaltpläne von PV- und Speicheranlagen**
(z. B. für die Netzanmeldung bei der Netze BW). Node-basiert: Bausteine platzieren,
Ports frei verdrahten, Kennwerte eintragen, als SVG/PNG exportieren.

Läuft **komplett im Browser** — kein Server, keine Datenbank, keine Cloud.
Alle Daten bleiben auf deinem Gerät.

## Funktionen

- **Bausteinpalette** mit eigenem Icon je Bauteiltyp für Netz/Messung,
  Erzeugung (PV-WR, MPPT-Laderegler), Batterie/Victron (Multi-WR mit
  AC-In / AC-Out1 / AC-Out2 / DC, Batterie-WR, DC-Sammelschiene, Cerbo GX)
  und Verbraucher (Wallbox, Backup, Steuerbox §14a). Jeder platzierte
  Baustein trägt sein Icon auch auf der Zeichenfläche.
- **Freies Verdrahten** über typisierte Ports (AC = gelb, DC = blau, Signal = grün).
- **Bausteine & Verbindungen** verschieben, auswählen, duplizieren, löschen
  (Klick + Entf, Rechtsklick-Menü oder Löschbutton im Inspektor). Ausgewählte
  Bausteine lassen sich zusätzlich per **Pfeiltasten** verschieben.
- **Undo / Redo**, Zoom & Pan, Raster-Snapping, Suche in der Palette.
- **Automatisches Speichern** im Browser: der aktuelle Stand (inkl.
  Projektdaten) wird laufend lokal gesichert und nach einem Neuladen der
  Seite automatisch wiederhergestellt — nichts geht verloren.
- **Kennwertfelder** zeigen unausgefüllte Platzhalter (`__ kVA` usw.) als
  graue Hinweistexte statt als scheinbar echte Werte, damit fehlende
  Angaben vor der Einreichung auffallen.
- **Projektdaten** (Betreiber, Anlagenstandort, Anlagenerrichter, Datum)
  über den Button **„Projekt"** erfassen — sie erscheinen im Schriftfeld des
  Exports.
- **Speichern/Laden** als JSON, **Export** als SVG oder PNG. Der Export
  enthält für die Netzanmeldung eine Titelzeile „Übersichtsschaltplan nach
  VDE-AR-N 4105", eine Legende der Leitungsarten und ein **Schriftfeld** mit
  den Projektdaten.

## Bedienung

| Aktion | Wie |
|---|---|
| Baustein einfügen | Palette anklicken **oder** auf die Fläche ziehen |
| Verbinden | Von einem Port (○) zum anderen ziehen |
| Verschieben (Baustein) | Baustein greifen und ziehen |
| Verschieben (Tastatur) | Baustein wählen, dann Pfeiltasten (12-px-Schritte) |
| Ansicht verschieben | Leertaste halten + ziehen, oder Mittelklick + ziehen |
| Zoom | Mausrad, oder +/− unten rechts |
| Löschen | Element wählen, dann `Entf` · oder Rechtsklick · oder Inspektor-Button |
| Rückgängig / Wiederholen | `Strg/Cmd+Z` / `Strg/Cmd+Umschalt+Z` |
| Projektdaten erfassen | Button **„Projekt"** in der Kopfzeile |

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
Der Arbeitsstand wird automatisch im Browser (localStorage) gesichert und
beim nächsten Öffnen wiederhergestellt.

## Dateien

- `index.html` — Struktur & Styles
- `app.js` — Editor-Logik (keine externen Abhängigkeiten)
- `.nojekyll` — für GitHub Pages

## Hinweis

Der erzeugte Plan dient der Vorbereitung/Dokumentation. Für die Netzanmeldung
ist in der Regel die Einreichung durch eine eingetragene Elektrofachkraft
erforderlich.
