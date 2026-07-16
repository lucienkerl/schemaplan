# Canvas-UX-Verbesserungen, Autosave, Icons & Netze-BW-Export

Status: Entwurf — Design inkl. UI/UX-Review-Ergänzungen mit Nutzer abgestimmt.

## Kontext

Schemaplan ist ein clientseitiger, abhängigkeitsfreier SVG-Editor (`index.html` +
`app.js`) für Übersichtsschaltpläne von PV-/Speicheranlagen, gehostet auf
GitHub Pages (`https://lucienkerl.github.io/schemaplan/`). Alle Daten bleiben
im Browser; es gibt keinen Server und keinen Build-Schritt.

Dieses Design deckt folgende Verbesserungen ab, die gemeinsam umgesetzt
werden:

1. Bugfix: Textmarkierung beim Ziehen auf der Zeichenfläche
2. Autosave/Wiederherstellung über Seitenneuladen hinweg
3. Icons pro Bauteiltyp (Palette + Zeichenfläche)
4. Netze-BW-konformer Export (Projektdaten-Schriftfeld in SVG/PNG)
5. Zusätzliche High-Prio-Fixes aus dem UI/UX-Review (Drag&Drop aus Palette,
   Platzhalter-Werte in Feldern)
6. Kleinere Polish-Fixes aus dem UI/UX-Review (Zoom-Zentrierung,
   Spawn-Position neuer Bausteine, Tastaturbedienung, Kontrast der
   Port-Labels, konsistente Lösch-Bestätigung)

**Explizit zurückgestellt:** Eine responsive/Tablet-taugliche Panel-Struktur
(einklappbare Seitenleisten unter ~1024px) ist ein eigenständiges
Redesign-Thema und wird in einem separaten Design-Gespräch behandelt.

## 1. Bugfix: Textmarkierung beim Ziehen

**Ursache:** Es fehlt `user-select:none` auf der App-Shell/Zeichenfläche, und
die `pointerdown`-Handler für Node-Drag, Pan und Wiring rufen kein
`preventDefault()` auf. Dadurch startet der Browser bei schnellen
Ziehbewegungen eine native Textselektion über benachbarte UI-Texte.

**Fix:**
- `user-select:none` (inkl. `-webkit-user-select`) auf `#app` per CSS,
  mit expliziter Rückausnahme (`user-select:text`) für `.field input`,
  `.field select` und das neue Projektdaten-Panel, damit Formularfelder
  weiterhin normal editierbar/selektierbar bleiben.
- `e.preventDefault()` zusätzlich in den bestehenden `pointerdown`-Zweigen
  für Node-Drag, Pan (Leertaste/Mittelklick) und Wiring in `app.js`, als
  zweite Absicherung unabhängig vom Browser/CSS-Support.

Keine Datenstruktur- oder Verhaltensänderung, rein CSS/Event-Handling.

## 2. Autosave & Wiederherstellung

**Speichern:** Nach jeder Zustandsänderung (gleiche Stellen, die aktuell
`pushHistory()`/`render()` auslösen) wird der State debounced (500ms nach
der letzten Änderung) als JSON in `localStorage` unter dem Schlüssel
`schemaplan.autosave.v1` abgelegt. Debounce verhindert exzessive
`localStorage`-Schreibzugriffe bei z.B. laufendem Node-Drag.

**Laden (App-Init):**
- Existiert ein gültiger Autosave-Eintrag → wird geladen (`state = JSON.parse(...)`),
  `seed()` wird **nicht** aufgerufen.
- Kein Eintrag vorhanden (allererster Besuch) oder Eintrag lässt sich nicht
  parsen → Fallback auf den bisherigen `seed()`-Beispielplan (defensiv:
  korrupte Daten dürfen die App nicht blockieren, führen aber zu keinem
  Datenverlust-Risiko, da nichts überschrieben wird, bevor der Nutzer aktiv
  etwas ändert).

**Kein Ersatz für Speichern/Laden:** Die bestehenden Buttons „Speichern"
(JSON-Datei-Download) und „Laden" (JSON-Datei-Upload) bleiben unverändert
für Weitergabe/Backup außerhalb des Browsers. Autosave ist rein
browserlokal (pro Gerät/Browser-Profil) und dient als Absicherung gegen
versehentliches Schließen/Neuladen des Tabs.

**Scope-Grenze:** View-State (Pan/Zoom) wird nicht persistiert — nach
Wiederherstellung reicht die Standardansicht bzw. der Nutzer nutzt
„Einpassen". Das hält die gespeicherte Datenstruktur auf das Wesentliche
(`nodes`, `wires`, `seq`, `project`) begrenzt.

## 3. Icons pro Bauteiltyp

**Umfang:** Je ein Icon für alle aktuell 17 Einträge in `LIB` (Netz, HAK,
SLS, Zähler, Grid-Meter, UV, PV-WR, PV-Generator, MPPT, Multi-/Batterie-WR,
Batterie-WR AC, Batteriespeicher, DC-Sammelschiene, Cerbo/EMS, Wallbox,
Verbraucher, Backup-Verteilung, Steuerbox §14a).

**Stil:** Inline-SVG im bestehenden Look der Toolbar-Icons (`viewBox 0 0 24
24`, `stroke="currentColor"`, `stroke-width ~1.6–2`, `fill="none"`,
`stroke-linecap/linejoin="round"`), grob an reale
Schaltzeichen/Bauteilsilhouetten angelehnt (z.B. Batteriezellen für
Speicher, Sicherung für HAK, Stecker für Wallbox/Verbraucher, Solarpanel
für PV-Generator, Wechselrichter-Symbol für PV-WR).

**Datenstruktur:** Neues `ICONS`-Objekt in `app.js`, keyed wie `LIB`
(gleiche Keys), jeweils ein SVG-Inner-Markup-String. Kein externes
Asset-/Sprite-System — bleibt konsistent mit der bisherigen
Zero-Dependency-Architektur.

**Platzierung:**
- **Palette (`buildPalette`)**: Icon ersetzt/ergänzt den farbigen Punkt in
  `.pitem` — farbiger Kreis-Hintergrund passend zur Bauteilfarbe, Icon in
  kontrastierender Farbe (dunkel auf hellem Akzent bzw. weiß, je nach
  Kontrastbedarf).
- **Zeichenfläche (`render()`)**: kleines Icon-Badge (ca. 16–18px) oben
  links im Node-Rechteck, zusätzlich zum bestehenden farbigen Balken/Titel
  — Node-Abmessungen (`w`/`h` in `LIB`) bleiben unverändert, das Icon nutzt
  vorhandenen Freiraum neben dem Titeltext.

## 4. Netze-BW-konformer Export (Projektdaten + Schriftfeld)

**Hintergrund:** Netze BW verlangt, dass der Übersichtsschaltplan alle
sicherheitsrelevanten Komponenten sowie die Anlage vom Modul bis zum
Netzverknüpfungspunkt zeigt. Für die Einreichung ist branchenüblich
(VDE-AR-N 4105, siehe vergleichbare Vorlagen anderer deutscher
Verteilnetzbetreiber) ein **Schriftfeld** mit Betreiber-, Standort- und
Errichterangaben plus Titelzeile üblich.

**Neues Datenfeld:** `state.project = {betreiberName, betreiberAdresse,
standortAdresse, erstellerFirma, erstellerOrt, datum}`. Wird Teil des
regulären State — landet damit automatisch in `snapshot()`/Undo-Historie,
im JSON-Speichern/Laden und im neuen Autosave (Abschnitt 2), ohne
Sonderbehandlung.

**UI:** Neuer Header-Button „Projekt" (Icon, Position neben „Speichern")
öffnet ein Panel/Dialog mit den obigen Feldern als einfache Text-Inputs
(analog zum bestehenden Inspector-Feld-Stil), „Datum" vorbefüllt mit
heutigem Datum, aber editierbar. Speichern der Felder verhält sich wie die
Inspector-Felder (Eingabe → State-Update → Autosave greift automatisch).

**Export-Erweiterung (`serializeSVG()`):**
- Zusätzliche Titelzeile oberhalb des Diagramms: „Übersichtsschaltplan
  nach VDE-AR-N 4105".
- Schriftfeld-Tabelle unterhalb des Diagramms (innerhalb der exportierten
  SVG-Bounding-Box, analog zum recherchierten Referenz-Layout):
  Betreiber (Name + Adresse) / Anlagenstandort / Anlagenerrichter (Firma,
  Ort) + Datum + leere Unterschriftslinie.
- Sowohl `exportSvg` als auch `png`-Export (der `serializeSVG()`
  wiederverwendet) erhalten das Schriftfeld automatisch, da beide auf
  derselben Funktion basieren.
- Bereits vorhandene Diagramm-Legende (Leitungsarten/Port-Status) bleibt
  unverändert erhalten.

**Nicht im Scope:** Kein separater PDF-Export (Nutzerentscheidung: SVG/PNG
mit Schriftfeld reicht), kein Abgleich mit einem offiziellen Netze-BW-PDF-
Formular (keins verfügbar) — Schriftfeld folgt dem branchenüblichen
VDE-AR-N-4105-Muster.

## 5. High-Prio-Fixes aus dem UI/UX-Review

**5a. Drag&Drop aus der Palette funktioniert nicht zuverlässig.** Live-Test
zeigte: Ziehen eines Palette-Eintrags auf die Fläche erzeugt keinen Node
(nur die Textmarkierung aus Abschnitt 1 tritt auf); Klick funktioniert
zuverlässig. Ursache ist vermutlich, dass native `dragstart`/`drop`-Events
(HTML5 Drag&Drop API, siehe `.pitem`-`dragstart`-Listener und
`stage`-`drop`-Listener in `app.js`) mit dem eigenen Pointer-basierten
Interaktionssystem (`pointerdown`/`pointermove`) kollidieren bzw. auf
manchen Eingabepfaden (Touch, synthetische Events) gar nicht feuern. Fix im
Rahmen dieser Runde: den bestehenden HTML5-Drag&Drop-Pfad robuster machen
(sicherstellen, dass `dragover`/`drop` korrekt `preventDefault()` aufrufen
und die Koordinatenumrechnung mit `toWorld()` bei jedem Drop-Event
zuverlässig funktioniert) und mit echtem Maus-Drag im Browser verifizieren
statt nur mit Klick. Eine vollständige Umstellung auf ein reines
Pointer-Event-Drag (ohne HTML5 DnD) ist eine Option, falls der Robustheits-
Fix nicht ausreicht — Entscheidung fällt bei der Umsetzung anhand des
Testergebnisses.

**5b. Platzhalter-Werte stecken im echten Feldwert statt in `placeholder`.**
Aktuell werden Default-Strings wie `__ kVA` oder `__ kWp` beim Anlegen
eines Bausteins direkt als `n.fields[key]` gesetzt (`addNode()`,
`c.fields.forEach(f=>fields[f[0]]=f[2])`) und erscheinen dadurch im
Inspector-Input als normaler, ununterscheidbarer Wert. Für Pläne, die zur
Netzanmeldung eingereicht werden, ist das riskant: unausgefüllte
Pflichtangaben fallen nicht auf. Fix: Platzhalter-Strings in `LIB` (dritter
Wert je `fields`-Eintrag) werden beim Anlegen **nicht** mehr in
`n.fields` vorbefüllt (Feld startet leer), sondern nur noch als
HTML-`placeholder`-Attribut auf dem jeweiligen Inspector-`<input>`
gerendert (`inspector()`-Funktion). Auf der Zeichenfläche/im Export werden
leere Felder entsprechend ausgeblendet (verhält sich wie die bestehende
`subs.filter(v=>v&&v.trim())`-Logik, die leere Werte bereits herausfiltert
— das greift dann automatisch auch für tatsächlich leere Pflichtfelder).

## 6. Polish-Fixes aus dem UI/UX-Review

- **Zoom-Buttons zentrieren nicht:** `zoomBy()` nutzt bereits die
  Viewport-Mitte (`r.width/2`/`r.height/2`) als Zoom-Ursprung — im Review
  wirkte das dennoch als "läuft aus dem Bild". Im Rahmen der Umsetzung
  gegenprüfen und ggf. den tatsächlichen Fehler (z.B. bei wiederholtem
  schnellem Klicken) beheben.
- **Neue Bausteine überlappen bestehende:** `addNode()` platziert neue
  Bausteine ohne Klick-Position immer exakt in der Viewport-Mitte. Fix:
  einfacher kaskadierender Offset (z.B. `+16px` pro bereits an derselben
  Position liegendem Node) oder Platzierung an einer freien Stelle in der
  Nähe der Mitte.
- **Keine Tastaturbedienung auf der Zeichenfläche:** `tabindex="0"` und
  passende `aria-label`s auf Node-Gruppen ergänzen; Pfeiltasten verschieben
  den ausgewählten Node (kleine Schrittweite, analog zum Grid-Snap),
  `Entf`/`Backspace` funktioniert für fokussierte Elemente bereits über den
  bestehenden `sel`-State.
- **Kontrast der Port-Labels zu gering:** `--faint`-Farbe (`#5b6674`) für
  `.port-label` durch einen helleren Ton ersetzen, der WCAG-AA-Kontrast
  (≥4.5:1) auf `--bg` erreicht.
- **Inkonsistente Lösch-Bestätigung:** `removeNode()`/`removeWire()` löschen
  sofort (abgesichert durch Undo), `clear`-Button nutzt `confirm()`. Da
  Undo für Einzel-Löschungen ausreichend Schutz bietet (mit Toast-Feedback),
  wird die Inkonsistenz durch **Entfernen** des `confirm()` bei „Leeren"
  vereinheitlicht — nicht durch Hinzufügen von Dialogen bei Einzel-Löschung
  (das würde den bisher schnellen Lösch-Flow verlangsamen). „Leeren" bleibt
  aber ebenfalls über Undo rückgängig machbar, da es bereits
  `pushHistory()` aufruft.

## Fehlerbehandlung

- Korrupter/fehlender `localStorage`-Eintrag → stiller Fallback auf
  Seed-Beispiel, kein Alert (entspricht bestehendem Verhalten bei
  fehlerhaftem JSON-Import, das mit `alert('Ungültige Datei.')` arbeitet —
  Autosave-Fallback braucht keinen Alert, da kein Nutzer-Trigger).
- `localStorage` nicht verfügbar (z.B. Privatmodus mit Blockierung) →
  Schreibversuch in `try/catch`, App funktioniert weiter ohne Autosave.

## Testing / Verifikation

- Manuell im Browser (Dev-Server via `preview_start`/GitHub Pages):
  - Node ziehen → keine Textmarkierung auf Palette/Header.
  - Bauteile platzieren, Seite neu laden → Plan ist wiederhergestellt.
  - Projektdaten ausfüllen, SVG/PNG exportieren → Schriftfeld korrekt
    befüllt sichtbar.
  - Palette- und Node-Icons für alle 17 Bauteiltypen sichtbar und
    unterscheidbar.
  - Bauteil aus Palette per echtem Maus-Drag (nicht nur Klick) auf die
    Fläche ziehen → Node wird angelegt.
  - Neu angelegter Baustein hat leeres Feld mit sichtbarem Platzhaltertext
    statt vorbefülltem `__ ...`-Wert.
  - Ausgewählten Node per Pfeiltasten verschieben, per Tab fokussieren.
- Kein automatisiertes Test-Setup im Projekt vorhanden (kein Build/Test-
  Tooling) — Verifikation bleibt manuell, konsistent mit dem restlichen
  Projekt.

## Zurückgestellt: Responsive/Tablet-Layout

Einklappbare Seitenleisten unter ~1024px Breite sind bewusst nicht Teil
dieser Runde (siehe Kontext-Abschnitt). Wird als eigenes Vorhaben mit
eigenem Brainstorming-Durchlauf geplant, sobald die aktuelle Runde
umgesetzt ist.
